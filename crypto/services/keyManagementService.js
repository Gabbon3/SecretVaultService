import { Config } from '../../config.js';
import { HexEncoder } from '../../utils/encoders/hex.js';
import { AES256GCM } from '../symmetric/aes256gcm.js';

export class KeyManagementService {
    static #keys = new Map();
    static #defaultKeyId = null;

    /**
     * Initialize the service (must be called before use)
     */
    static initialize() {
        if (!Config) {
            throw new Error('Configuration is not available');
        }

        this.#loadKeysFromConfig();
        this.#determineDefaultKeyId();
    }

    /**
     * Get a Data Encryption Key (DEK) by its identifier
     * @param {number} keyId - The DEK identifier
     * @returns {Uint8Array} The requested encryption key
     * @throws {Error} When the specified key is not found
     */
    static getKey(keyId) {
        if (!keyId || typeof keyId !== 'number' || keyId < 1) {
            throw new Error('Key ID must be a valid number');
        }

        if (this.#keys.has(keyId)) {
            return this.#keys.get(keyId);
        }

        const availableKeys = Array.from(this.#keys.keys()).join(', ');
        throw new Error(`Encryption key with ID '${keyId}' not found. Available keys: ${availableKeys}`);
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
    static #loadKeysFromConfig() {
        const dekConfig = Config.DEK;
        if (!dekConfig) {
            throw new Error('Missing Crypto.DEK in configuration');
        }

        try {
            this.#keys.set(1, Config.DEK);
        } catch (e) {
            throw new Error(`Failed to load keys from configuration: ${e.message}`);
        }
    }

    static #determineDefaultKeyId() {
        // Try to get default from config, fall back to first available key
        const configDefault = Config.DEKID;
        this.#defaultKeyId = Number(configDefault) || this.listKeyIds()[0];
        
        if (!this.#defaultKeyId) {
            throw new Error('No keys available and no default key specified');
        }
    }
}