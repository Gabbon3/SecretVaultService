import { SecretEncryptionService } from "../crypto/services/secretEncryptionService.js";
import { ServerError } from "../helpers/serverError.js";
import { Secret } from "../models/secret.js";

export class SecretService {
    /**
     * Creates a new secret with encrypted data
     * @param {string} name - Secret name/identifier
     * @param {string|Uint8Array} plaintext - The secret data to encrypt (string or Uint8Array)
     * @returns {Promise<Secret>} The created secret record
     * @throws {Error} If encryption or database operation fails
     */
    async create(name, plaintext) {
        if (!name || typeof name !== 'string' || name.trim() === '') {
            throw new Error('Secret name cannot be empty');
        }

        if (!plaintext) {
            throw new Error('Plaintext data cannot be empty');
        }

        // Convert string to Uint8Array if needed
        const dataToEncrypt = typeof plaintext === 'string' 
            ? new TextEncoder().encode(plaintext) 
            : plaintext;

        try {
            const encrypted = await SecretEncryptionService.encryptSecret(dataToEncrypt);
            
            const secret = await Secret.create({
                name: name,
                data: Buffer(encrypted),
            });

            return secret;
        } catch (error) {
            throw new Error(`Failed to create secret: ${error.message}`);
        }
    }

    /**
     * Retrieves and decrypts a secret by name
     * @param {string} id - Secret identifier
     * @returns {Promise<{name: string, data: Uint8Array}>} Decrypted secret data
     * @throws {Error} If secret not found or decryption fails
     */
    async get(id) {
        if (!id || typeof id !== 'string' || id.trim() === '') {
            throw new Error('Secret name cannot be empty');
        }

        let secret;
        try {
            secret = await Secret.findOne({ where: { id: id } });
        } catch (error) {
            throw new Error(`Failed to retrieve secret '${id}': ${error.message}`);
        }

        if (!secret) {
            throw new ServerError(`Secret '${id}' not found`, 404);
        }

        try {

            const decrypted = await SecretEncryptionService.decryptSecret(new Uint8Array(secret.data));
            
            return {
                name: secret.name,
                data: decrypted,
                createdAt: secret.createdAt,
                updatedAt: secret.updatedAt
            };
        } catch (error) {
            throw new Error(`Failed to decrypt secret '${id}': ${error.message}`);
        }
    }

    /**
     * Retrieves and decrypts a secret by name, returning as string
     * @param {string} name - Secret name/identifier
     * @returns {Promise<{name: string, data: string}>} Decrypted secret as string
     * @throws {Error} If secret not found or decryption fails
     */
    async getAsString(name) {
        const secret = await this.get(name);
        return {
            ...secret,
            data: new TextDecoder().decode(secret.data)
        };
    }

    /**
     * Updates an existing secret
     * @param {string} id - Secret identifier
     * @param {string} name - Secret name
     * @param {string|Uint8Array} newPlaintext - New secret data to encrypt
     * @returns {Promise<Secret>} The updated secret record
     * @throws {Error} If secret not found or operation fails
     */
    async update(id, name, newPlaintext) {
        if (!id) {
            throw new Error('Secret id cannot be empty');
        }

        if (!name || typeof name !== 'string' || name.trim() === '') {
            throw new Error('Secret name cannot be empty');
        }

        if (!newPlaintext) {
            throw new Error('Plaintext data cannot be empty');
        }

        // Convert string to Uint8Array if needed
        const dataToEncrypt = typeof newPlaintext === 'string' 
            ? new TextEncoder().encode(newPlaintext) 
            : newPlaintext;

        try {
            const encrypted = await SecretEncryptionService.encryptSecret(dataToEncrypt);
            
            const [affectedCount, updatedSecrets] = await Secret.update(
                { 
                    data: encrypted,
                },
                { 
                    where: { id },
                    returning: true 
                }
            );

            if (affectedCount === 0) {
                throw new Error(`Secret '${id}' not found`);
            }

            return updatedSecrets[0];
        } catch (error) {
            throw new Error(`Failed to update secret '${id}': ${error.message}`);
        }
    }

    /**
     * Deletes a secret by name
     * @param {string} name - Secret name/identifier
     * @returns {Promise<boolean>} True if deleted, false if not found
     */
    async delete(name) {
        if (!name || typeof name !== 'string' || name.trim() === '') {
            throw new Error('Secret name cannot be empty');
        }

        try {
            const deletedCount = await Secret.destroy({ where: { name } });
            return deletedCount > 0;
        } catch (error) {
            throw new Error(`Failed to delete secret '${name}': ${error.message}`);
        }
    }

    /**
     * Lists all available secret names
     * @returns {Promise<Array<{name: string, createdAt: Date}>>} List of secret metadata
     */
    async list() {
        try {
            const secrets = await Secret.findAll({ 
                attributes: ['id', 'name', 'createdAt'],
                order: [['name', 'ASC']]
            });
            return secrets.map(s => ({
                id: s.id,
                name: s.name,
                createdAt: s.createdAt
            }));
        } catch (error) {
            throw new Error(`Failed to list secrets: ${error.message}`);
        }
    }
}