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

        return DEK.create({
            name,
            key: encryptedKey,
            kekId: Config.KMS.defaultKekId
        });
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
        const queryOptions = includeKeys ? {} : { attributes: { exclude: ['key'] } };
        const deks = await DEK.findAll(queryOptions);

        if (includeKeys) {
            for (const dek of deks) {
                dek.key = await KeyManagementService.decryptDEK(dek.key)
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
