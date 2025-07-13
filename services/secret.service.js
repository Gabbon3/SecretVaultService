import { KeyManagementService } from "../crypto/services/keyManagementService.js";
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
        if (!name || typeof name !== "string" || name.trim() === "") {
            throw new Error("Secret name cannot be empty");
        }

        if (!plaintext) {
            throw new Error("Plaintext data cannot be empty");
        }

        // Convert string to Uint8Array if needed
        const dataToEncrypt =
            typeof plaintext === "string"
                ? new TextEncoder().encode(plaintext)
                : plaintext;

        try {
            const encrypted = await SecretEncryptionService.encryptSecret(
                dataToEncrypt
            );

            const secret = await Secret.create({
                name: name,
                data: Buffer.from(encrypted),
                dekId: KeyManagementService.defaultDekId,
            });

            return secret;
        } catch (error) {
            throw new Error(`Failed to create secret: ${error.message}`);
        }
    }

    /**
     * Retrieves and decrypts a secret by name
     * @param {string} identifier - Secret identifier/name
     * @param {boolean} isUUID - true to search by id
     * @returns {Promise<{name: string, data: Uint8Array}>} Decrypted secret data
     * @throws {Error} If secret not found or decryption fails
     */
    async get(identifier, isUUID) {
        if (
            !identifier ||
            typeof identifier !== "string" ||
            identifier.trim() === ""
        ) {
            throw new Error("Secret name cannot be empty");
        }

        let secret;
        try {
            const condition = isUUID
                ? { id: identifier }
                : { name: identifier };
            secret = await Secret.findOne({ where: condition });
        } catch (error) {
            throw new Error(
                `Failed to retrieve secret '${identifier}': ${error.message}`
            );
        }

        if (!secret) {
            throw new ServerError(`Secret '${identifier}' not found`, 404);
        }

        try {
            const { secret: decrypted, header } =
                await SecretEncryptionService.decryptSecret(
                    new Uint8Array(secret.data),
                    secret.dekId
                );

            // Check if dekId is different than current one, if true then re-encrypt with new dek
            if (header.dekId !== KeyManagementService.defaultDekId) {
                this.#scheduleRotation(secret.id, secret.name, decrypted);
            }

            return {
                id: secret.id,
                name: secret.name,
                data: decrypted,
                dekId: secret.dekId,
                createdAt: secret.createdAt,
                updatedAt: secret.updatedAt,
            };
        } catch (error) {
            throw new Error(
                `Failed to decrypt secret '${identifier}': ${error.message}`
            );
        }
    }

    /**
     * Rotate Secret with newest DEK
     * @param {string} secretId - UUID
     * @param {string} secretName
     * @param {Uint8Array} decryptedData
     */
    async #scheduleRotation(secretId, secretName, decryptedData) {
        try {
            await new Promise((resolve) => setTimeout(resolve, 100));

            await this.update(secretId, secretName, decryptedData, true);
            console.log(
                `Successfully rotated secret ${secretId} to DEK ${KeyManagementService.defaultDekId}`
            );
        } catch (error) {
            console.error(`Rotation failed for secret ${secretId}:`, error);
            // No Retry
        }
    }

    /**
     * Retrieves and decrypts a secret by name, returning as string
     * @param {string} identifier - Secret name/identifier
     * @param {boolean} isUUID - true to search by id
     * @returns {Promise<{name: string, data: string}>} Decrypted secret as string
     * @throws {Error} If secret not found or decryption fails
     */
    async getAsString(identifier, isUUID) {
        const secret = await this.get(identifier, isUUID);
        return {
            ...secret,
            data: new TextDecoder().decode(secret.data),
        };
    }

    /**
     * Updates an existing secret
     * @param {string} id - Secret identifier
     * @param {string} name - Secret name
     * @param {string|Uint8Array} newPlaintext - New secret data to encrypt
     * @param {boolean} [isRotation=false] - if true, update lastRotation
     * @returns {Promise<Secret>} The updated secret record
     * @throws {Error} If secret not found or operation fails
     */
    async update(id, name, newPlaintext, isRotation = false) {
        if (!id) {
            throw new Error("Secret id cannot be empty");
        }

        if (!name || typeof name !== "string" || name.trim() === "") {
            throw new Error("Secret name cannot be empty");
        }

        if (!newPlaintext) {
            throw new Error("Plaintext data cannot be empty");
        }

        // Convert string to Uint8Array if needed
        const dataToEncrypt =
            typeof newPlaintext === "string"
                ? new TextEncoder().encode(newPlaintext)
                : newPlaintext;

        try {
            const encrypted = await SecretEncryptionService.encryptSecret(
                dataToEncrypt
            );

            let dataToUpdate = {
                data: Buffer.from(encrypted),
                dekId: KeyManagementService.defaultDekId,
            };

            if (isRotation) {
                dataToUpdate = {
                    ...dataToUpdate,
                    lastRotation: new Date(),
                };
            }

            const [affectedCount, updatedSecrets] = await Secret.update(
                dataToUpdate,
                {
                    where: { id },
                    returning: true,
                }
            );

            if (affectedCount === 0) {
                throw new Error(`Secret '${id}' not found`);
            }

            return updatedSecrets[0];
        } catch (error) {
            throw new Error(
                `Failed to update secret '${id}': ${error.message}`
            );
        }
    }

    /**
     * Deletes a secret by name
     * @param {string} id - Secret name/identifier
     * @returns {Promise<boolean>} True if deleted, false if not found
     */
    async delete(id) {
        if (!id || typeof id !== "string" || id.trim() === "") {
            throw new Error("Secret name cannot be empty");
        }

        try {
            const deletedCount = await Secret.destroy({ where: { id } });
            return deletedCount > 0;
        } catch (error) {
            throw new Error(
                `Failed to delete secret '${id}': ${error.message}`
            );
        }
    }

    /**
     * Lists all available secret names
     * @returns {Promise<Array<{name: string, createdAt: Date}>>} List of secret metadata
     */
    async list() {
        try {
            const secrets = await Secret.findAll({
                attributes: ["id", "name", "dekId", "lastRotation", "createdAt"],
                order: [["name", "ASC"]],
            });
            return secrets.map((s) => ({
                id: s.id,
                name: s.name,
                dekId: s.dekId,
                lastRotation: s.lastRotation,
                createdAt: s.createdAt,
            }));
        } catch (error) {
            throw new Error(`Failed to list secrets: ${error.message}`);
        }
    }
}
