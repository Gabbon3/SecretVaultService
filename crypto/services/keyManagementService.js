import { KeyManagementServiceClient } from "@google-cloud/kms";
import crc32c from "fast-crc32c";
import { Config } from "../../config.js";
import { DEKService } from "../../services/dek.service.js";
import { AES256GCM } from "../symmetric/aes256gcm.js";

export class KeyManagementService {
    static #keys = new Map();
    static #defaultKeyId = null;
    static #client = new KeyManagementServiceClient();
    static #dekService = new DEKService();

    /**
     * Initialize the service (must be called before use)
     */
    static async initialize() {
        if (!Config) {
            throw new Error("Configuration is not available");
        }

        await this.#loadKeysFromDb();
        this.#determineDefaultKeyId();
    }

    /**
     * Encrypts a DEK using Google KMS
     * @param {Buffer} plaintextKey - The DEK to encrypt
     * @returns {Promise<Buffer>} Encrypted DEK
     */
    static async encryptDEK(plaintextKey) {
        const plaintextCrc32c = crc32c.calculate(plaintextKey);

        const [encryptResponse] = await this.#client.encrypt({
            name: this.#client.cryptoKeyPath(
                Config.KMS.projectId,
                Config.KMS.KEK1.locationId,
                Config.KMS.KEK1.keyRingId,
                Config.KMS.KEK1.keyId
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
        if (crc32c.calculate(ciphertext) !== Number(encryptResponse.ciphertextCrc32c.value)) {
            throw new Error("Encrypt: response corrupted in-transit");
        }

        return ciphertext;
    }

    /**
     * Decrypts a DEK using Google KMS
     * @param {Buffer} encryptedKey - Encrypted DEK from DB
     * @returns {Promise<Buffer>} Decrypted DEK
     */
    static async decryptDEK(encryptedKey) {
        const ciphertextCrc32c = crc32c.calculate(encryptedKey);

        const [decryptResponse] = await this.#client.decrypt({
            name: this.#client.cryptoKeyPath(
                Config.KMS.projectId,
                Config.KMS.KEK1.locationId,
                Config.KMS.KEK1.keyRingId,
                Config.KMS.KEK1.keyId
            ),
            ciphertext: encryptedKey,
            ciphertextCrc32c: {
                value: ciphertextCrc32c,
            },
        });

        if (crc32c.calculate(decryptResponse.plaintext) !== Number(decryptResponse.plaintextCrc32c.value)) {
            throw new Error("Decrypt: response corrupted in-transit");
        }

        return decryptResponse.plaintext;
    }

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
     * Get the current default key ID
     * @returns {string} The default key ID
     */
    static get defaultKeyId() {
        return this.#defaultKeyId;
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
    }

    static #loadKeysFromConfig() {
        const dekConfig = Config.DEK;
        if (!dekConfig) {
            throw new Error("Missing Crypto.DEK in configuration");
        }

        try {
            this.#keys.set(1, Config.DEK);
        } catch (e) {
            throw new Error(
                `Failed to load keys from configuration: ${e.message}`
            );
        }
    }

    static #determineDefaultKeyId() {
        // Try to get default from config, fall back to first available key
        const configDefault = Config.DEKID;
        this.#defaultKeyId = Number(configDefault) || this.listKeyIds()[0];

        if (!this.#defaultKeyId) {
            throw new Error("No keys available and no default key specified");
        }
    }
}
