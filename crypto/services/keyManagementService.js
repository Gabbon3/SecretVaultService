import { KeyManagementServiceClient } from "@google-cloud/kms";
import crc32c from "fast-crc32c";
import { Config } from "../../config.js";
import { DEKService } from "../../services/dek.service.js";
import { AES256GCM } from "../symmetric/aes256gcm.js";
import { DEK } from "../../models/dek.js";

export class KeyManagementService {
    static #keys = new Map();
    static #client = new KeyManagementServiceClient();
    static #dekService = new DEKService();
    static defaultDekId = null;

    /**
     * Initialize the service (must be called before use)
     */
    static async initialize() {
        if (!Config) {
            throw new Error("Configuration is not available");
        }

        await this.#loadKeysFromDb();
    }

    /**
     * Encrypts a DEK using Google KMS
     * @param {Buffer} plaintextKey - The DEK to encrypt
     * @returns {Promise<Buffer>} Encrypted DEK
     */
    static async encryptDEK(plaintextKey) {
        if (Config.DEV) return await this.#encryptDEKDev(plaintextKey);
        // ---
        const plaintextCrc32c = crc32c.calculate(plaintextKey);

        const [encryptResponse] = await this.#client.encrypt({
            name: this.#client.cryptoKeyPath(
                Config.KMS.projectId,
                Config.KMS[Config.KMS.defaultKekId].locationId,
                Config.KMS[Config.KMS.defaultKekId].keyRingId,
                Config.KMS[Config.KMS.defaultKekId].keyId
            ),
            plaintext: plaintextKey,
            plaintextCrc32c: {
                value: plaintextCrc32c,
            },
        });

        const ciphertext = encryptResponse.ciphertext;

        if (!encryptResponse.verifiedPlaintextCrc32c) {
            throw new Error("Encrypt: request corrupted in-transit");
        }
        if (
            crc32c.calculate(ciphertext) !==
            Number(encryptResponse.ciphertextCrc32c.value)
        ) {
            throw new Error("Encrypt: response corrupted in-transit");
        }

        return ciphertext;
    }

    /**
     * Decrypts a DEK using Google KMS
     * @param {Buffer} encryptedKey - Encrypted DEK from DB
     * @param {string} kekId - kek identifier
     * @returns {Promise<Buffer>} Decrypted DEK
     */
    static async decryptDEK(encryptedKey, kekId = null) {
        if (Config.DEV) return await this.#decryptDEKDev(encryptedKey);
        // ---
        const ciphertextCrc32c = crc32c.calculate(encryptedKey);

        const [decryptResponse] = await this.#client.decrypt({
            name: this.#client.cryptoKeyPath(
                Config.KMS.projectId,
                Config.KMS[Config.KMS.defaultKekId].locationId,
                Config.KMS[Config.KMS.defaultKekId].keyRingId,
                kekId || Config.KMS[Config.KMS.defaultKekId].keyId
            ),
            ciphertext: encryptedKey,
            ciphertextCrc32c: {
                value: ciphertextCrc32c,
            },
        });

        if (
            crc32c.calculate(decryptResponse.plaintext) !==
            Number(decryptResponse.plaintextCrc32c.value)
        ) {
            throw new Error("Decrypt: response corrupted in-transit");
        }

        return decryptResponse.plaintext;
    }

    /**
     * DEV Methods
     */

    static async #encryptDEKDev(plaintextKey) {
        const encryptedDek = await AES256GCM.encrypt(new Uint8Array(plaintextKey), Config.KEK)
        return Buffer.from(encryptedDek);
    }

    static async #decryptDEKDev(encryptedKey) {
        const dek = await AES256GCM.decrypt(new Uint8Array(encryptedKey), Config.KEK);
        return Buffer.from(dek);
    }

    /**
     * * * * *
     */

    /**
     * Get a Data Encryption Key (DEK) by its identifier
     * @param {number} keyId - The DEK identifier
     * @returns {Uint8Array} The requested encryption key
     * @throws {Error} When the specified key is not found
     */
    static getKey(keyId) {
        if (!keyId || typeof keyId !== "number" || keyId < 1) {
            throw new Error("Key ID must be a valid number");
        }

        if (this.#keys.has(keyId)) {
            return this.#keys.get(keyId);
        }

        const availableKeys = Array.from(this.#keys.keys()).join(", ");
        throw new Error(
            `Encryption key with ID '${keyId}' not found. Available keys: ${availableKeys}`
        );
    }

    /**
     * List all available key identifiers
     * @returns {number[]} Array of key IDs
     */
    static listKeyIds() {
        return Array.from(this.#keys.keys());
    }

    /**
     * Load new DEK to cache (#keys)
     * @param {DEK} dek
     */
    static async loadNewKey(dekId, dekKey) {
        this.#keys.set(
            dekId,
            await AES256GCM.importKey(new Uint8Array(dekKey))
        );
        // Update with new DEK ID, so the latest
        this.defaultDekId = dekId;
    }

    /**
     * Re-encrypts all DEKs with a new KEK (Key Encryption Key)
     * @param {string} newKekId - The new KEK identifier (e.g., 'kek-v2')
     * @param {string} [oldKekId] - Optional old KEK identifier for filtering
     * @returns {Promise<{total: number, success: number, failures: Array<{id: number, error: string}>}>}
     */
    static async reencryptAllDeksWithNewKek(newKekId, oldKekId = null) {
        if (!newKekId || typeof newKekId !== "string") {
            throw new Error("newKekId must be a non-empty string");
        }

        const dekService = new DEKService();
        const results = {
            total: 0,
            success: 0,
            failures: [],
        };

        try {
            // 1. Fetch all DEKs (decrypted)
            const deks = await dekService.getAllDeks(true);

            // 2. Filter by old KEK if specified
            const deksToReencrypt = oldKekId
                ? deks.filter((dek) => dek.kekId === oldKekId)
                : deks;

            results.total = deksToReencrypt.length;

            // 3. Process each DEK
            for (const dek of deksToReencrypt) {
                try {
                    // Decrypt the DEK using the old KEK (already done in getAllDeks)
                    const rawDek = dek.key;

                    // Re-encrypt with new KEK
                    const reencrypted = await this.#client.encrypt({
                        name: this.#client.cryptoKeyPath(
                            Config.KMS.projectId,
                            Config.KMS[newKekId].locationId,
                            Config.KMS[newKekId].keyRingId,
                            Config.KMS[newKekId].keyId
                        ),
                        plaintext: rawDek,
                    });

                    // Update the DEK record
                    await DEK.update(
                        {
                            key: reencrypted[0].ciphertext,
                            kekId: newKekId,
                            version: dek.version + 1,
                        },
                        { where: { id: dek.id } }
                    );

                    // Update in-memory cache
                    if (this.#keys.has(dek.id)) {
                        this.#keys.set(
                            dek.id,
                            await AES256GCM.importKey(rawDek)
                        );
                    }

                    results.success++;
                } catch (error) {
                    results.failures.push({
                        id: dek.id,
                        error: error.message,
                    });
                    console.error(`Failed to re-encrypt DEK ${dek.id}:`, error);
                }
            }

            return results;
        } catch (error) {
            throw new Error(`Failed to re-encrypt DEKs: ${error.message}`);
        }
    }

    /**
     * Rotates to a new KEK version (high-level operation)
     * @param {string} newKekId - The new KEK identifier
     * @returns {Promise<{dekRotation: object, secretRotation: object}>}
     */
    static async rotateToNewKek(newKekId) {
        // 1. First re-encrypt all DEKs with new KEK
        const dekResults = await this.reencryptAllDeksWithNewKek(newKekId);

        // 2. Update configuration to use new KEK as default
        Config.KMS.defaultKekId = newKekId;

        // 3. Return both operations results
        return {
            dekRotation: dekResults,
            // secretRotation will be handled by SecretService
        };
    }

    // Private methods
    static async #loadKeysFromDb() {
        const deks = await this.#dekService.getAllDeks(true);
        for (const dek of deks) {
            this.#keys.set(
                dek.id,
                await AES256GCM.importKey(new Uint8Array(dek.key))
            );
        }
        // Load latest DekId
        this.defaultDekId = deks[0]?.id || 1;
    }
}
