import { Config } from "../config.js";
import { KeyManagementService } from "../crypto/services/keyManagementService.js";
import { DEK } from "../models/dek.js";

export class DEKService {
    /**
     * Generates a new DEK and stores it encrypted
     * @param {string} name - Unique identifier for the key
     * @returns {Promise<DEK>} The created DEK record
     */
    async generateDek(name) {
        const rawKey = crypto.getRandomValues(new Uint8Array(32));

        const encryptedKey = await KeyManagementService.encryptDEK(rawKey);

        const dek = await DEK.create({
            name,
            key: encryptedKey,
            kekId: Config.KMS.defaultKekId
        });

        KeyManagementService.loadNewKey(dek.id, rawKey);

        return dek;
    }

    /**
     * Retrieves a decrypted DEK by name
     * @param {number} id - Key identifier
     * @returns {Promise<DEK>} Decrypted key
     */
    async getDek(id) {
        const dek = await DEK.findOne({ where: { id } });
        if (!dek) throw new Error("DEK not found");

        dek.key = await KeyManagementService.decryptDEK(dek.key);

        return dek;
    }

    /**
     * Retrives all decrypted DEKs
     * @param {boolean} [includeKeys=false] - If true, keys are decrypted and included
     * @returns {Promise<Array<DEK>>}
     */
    async getAllDeks(includeKeys = false) {
        let queryOptions = { order: [['id', 'DESC']] }
        if (!includeKeys) {
            queryOptions = {
                ...queryOptions,
                attributes: { exclude: ['key'] }
            };
        }
        const deks = await DEK.findAll(queryOptions);

        if (includeKeys) {
            for (const dek of deks) {
                dek.key = await KeyManagementService.decryptDEK(dek.key)
            }
        }

        return deks;
    }

    /**
     * Gets all DEKs encrypted with a specific KEK
     * @param {string} kekId - The KEK identifier
     * @param {boolean} includeKeys - Whether to include decrypted keys
     * @returns {Promise<Array<DEK>>}
     */
    async getDeksByKek(kekId, includeKeys = false) {
        const queryOptions = {
            where: { kekId },
            order: [['id', 'DESC']]
        };

        if (!includeKeys) {
            queryOptions.attributes = { exclude: ['key'] };
        }

        const deks = await DEK.findAll(queryOptions);

        if (includeKeys) {
            for (const dek of deks) {
                dek.key = await KeyManagementService.decryptDEK(dek.key);
            }
        }

        return deks;
    }

    /**
     * Delete DEK
     * @param {number} id - Key Identifier
     * @returns {boolean}
     */
    async deleteDek(id) {
        const deletedRows = await DEK.destroy({ where: { id } });
        return deletedRows > 0;
    }
}
