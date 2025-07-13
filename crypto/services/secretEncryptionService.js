import { MessagePack } from '../../helpers/messagepack.js';
import { AES256GCM } from '../symmetric/aes256gcm.js';
import { KeyManagementService } from './keyManagementService.js';

export class SecretEncryptionService {
    static #SupportedAlgorithm = 'AES-256-GCM';

    /**
     * Encrypts secret data
     * @param {Uint8Array} plaintext - Data to encrypt
     * @param {number} [dekId] - Optional Data Encryption Key ID (uses default if not specified)
     * @returns {Promise<Uint8Array>} Encrypted package
     * @throws {Error} When encryption fails or input is invalid
     */
    static async encryptSecret(plaintext, dekId = null) {
        if (!plaintext || plaintext.length === 0) {
            throw new Error('Plaintext cannot be null or empty');
        }

        try {
            // Use default key if not specified
            dekId = dekId ?? KeyManagementService.defaultDekId;
            const dek = KeyManagementService.getKey(dekId);

            // Create Package Header
            const header = {
                alg: this.#SupportedAlgorithm,
                version: 1,
                dekId: dekId
            };

            // Serialize header (AAD)
            const headerBytes = MessagePack.encode(header);

            // Encrypt data
            const encryptedBytes = await AES256GCM.encrypt(plaintext, dek, headerBytes);

            // Create package with metadata
            const encryptedPackage = {
                header: header,
                payload: encryptedBytes
            };

            // Serialize with MessagePack
            return MessagePack.encode(encryptedPackage);
        } catch (ex) {
            throw new Error(`Failed to encrypt secret: ${ex.message}`);
        }
    }

    /**
     * Decrypts an encrypted secret package
     * @param {Uint8Array} encryptedPackageBytes - Encrypted package bytes
     * @param {number} expectedDekId - dekId from Secret model
     * @returns {Promise<{ secret: Uint8Array, header: { alg: string, version: number, dekId: number }}>} Decrypted data
     * @throws {Error} When decryption fails or input is invalid
     */
    static async decryptSecret(encryptedPackageBytes, expectedDekId) {
        if (!encryptedPackageBytes || encryptedPackageBytes.length === 0) {
            throw new Error('Encrypted package cannot be null or empty');
        }

        try {
            // Deserialize the package
            const encryptedPackage = MessagePack.decode(encryptedPackageBytes);

            // Validate package
            if (encryptedPackage.header.alg !== this.#SupportedAlgorithm) {
                throw new Error(`Unsupported algorithm: ${encryptedPackage.header.alg}. Only ${this.#SupportedAlgorithm} is supported.`);
            }

            if (encryptedPackage.header.version > KeyManagementService.defaultDekId) {
                throw new Error(`Package version ${encryptedPackage.header.version} is not supported. Maximum supported version is ${KeyManagementService.defaultDekId}.`);
            }

            // Checking dekId (id from header and id from the model)
            if (expectedDekId !== encryptedPackage.header.dekId) {
                throw new Error(`DEK mismatch: expected ${expectedDekId}, found ${encryptedPackage.header.dekId}`);
            }

            // Get the encryption key
            const dek = KeyManagementService.getKey(encryptedPackage.header.dekId);

            // Serialize Header (AAD)
            const headerBytes = MessagePack.encode(encryptedPackage.header);

            // Decrypt data
            const decryptedSecret = await AES256GCM.decrypt(encryptedPackage.payload, dek, headerBytes);
            return {
                secret: decryptedSecret,
                header: encryptedPackage.header,
            };
        } catch (ex) {
            throw new Error(`Failed to decrypt secret: ${ex.message}`);
        }
    }
}