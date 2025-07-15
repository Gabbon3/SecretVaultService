export class AES256GCM {
    /**
     * Generates a secure AES-GCM 256-bit key (non-exportable by default)
     * @param {boolean} [exportable=false] - Whether the key can be exported
     * @returns {Promise<CryptoKey>}
     */
    static async generateKey(exportable = false) {
        return await crypto.subtle.generateKey(
            {
                name: 'AES-GCM',
                length: 256,
            },
            exportable,
            ['encrypt', 'decrypt']
        );
    }

    /**
     * Imports a key from raw bytes (for compatibility)
     * @param {Uint8Array} keyData - 32-byte key
     * @param {boolean} [exportable=false] - Whether the key can be exported
     * @returns {Promise<CryptoKey>}
     */
    static async importKey(keyData, exportable = false) {
        if (keyData.length !== 32) {
            throw new Error('AES-256-GCM key must be 32 bytes (256 bits)');
        }
        
        return await crypto.subtle.importKey(
            'raw',
            keyData,
            { name: 'AES-GCM' },
            exportable,
            ['encrypt', 'decrypt']
        );
    }

    /**
     * Exports a key if it was created as exportable
     * @param {CryptoKey} key 
     * @returns {Promise<Uint8Array>}
     */
    static async exportKey(key) {
        return new Uint8Array(await crypto.subtle.exportKey('raw', key));
    }

    /**
     * Encrypts data using AES-256-GCM
     * @param {Uint8Array} data - Data to encrypt
     * @param {CryptoKey|Uint8Array} key - Either a CryptoKey or raw key bytes
     * @param {Uint8Array} [aad] - Additional authenticated data
     * @returns {Promise<Uint8Array>} Encrypted data in format [nonce (12B), ciphertext, tag (16B)]
     */
    static async encrypt(data, key, aad) {
        let cryptoKey = key;
        if (key instanceof Uint8Array) {
            cryptoKey = await this.importKey(key, false);
        }

        const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV
        const params = {
            name: 'AES-GCM',
            iv,
            tagLength: 128,
            ...(aad && { additionalData: aad })
        };

        const ciphertext = await crypto.subtle.encrypt(
            params,
            cryptoKey,
            data
        );

        // Combine IV (12B) + ciphertext (includes 16B tag at the end)
        const result = new Uint8Array(iv.length + ciphertext.byteLength);
        result.set(iv, 0);
        result.set(new Uint8Array(ciphertext), iv.length);
        
        return result;
    }

    /**
     * Decrypts data using AES-256-GCM
     * @param {Uint8Array} encryptedData - Encrypted data in format [nonce (12B), ciphertext]
     * @param {CryptoKey|Uint8Array} key - Either a CryptoKey or raw key bytes
     * @param {Uint8Array} [aad] - Additional authenticated data
     * @returns {Promise<Uint8Array>} Decrypted data
     * @throws {Error} If authentication fails
     */
    static async decrypt(encryptedData, key, aad) {
        if (encryptedData.length < 12) {
            throw new Error('Invalid encrypted data: too short to contain IV');
        }

        let cryptoKey = key;
        if (key instanceof Uint8Array) {
            cryptoKey = await this.importKey(key, false);
        }

        const iv = encryptedData.slice(0, 12);
        const ciphertext = encryptedData.slice(12);

        try {
            const decrypted = await crypto.subtle.decrypt(
                {
                    name: 'AES-GCM',
                    iv,
                    tagLength: 128,
                    ...(aad && { additionalData: aad })
                },
                cryptoKey,
                ciphertext
            );

            return new Uint8Array(decrypted);
        } catch (err) {
            throw new Error('Decryption failed: authentication tag verification failed');
        }
    }

    /**
     * Helper to generate a secure random key (exportable version)
     * @returns {Promise<Uint8Array>} 32-byte key
     */
    static async generateRandomKey() {
        return crypto.getRandomValues(new Uint8Array(32));
    }
}