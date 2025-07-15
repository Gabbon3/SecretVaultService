import { asyncHandler } from "../helpers/asyncHandler.js";
import { DEKService } from "../services/dek.service.js";
import { ServerError } from "../helpers/serverError.js";
import { Validator } from "../validator/validator.js";
import { KeyManagementService } from "../crypto/services/keyManagementService.js";

export class DEKController {
    constructor() {
        this.service = new DEKService();
    }

    /**
     * Creates a new Data Encryption Key (DEK)
     * @param {Object} req - Express request
     * @param {string} req.body.name - Unique key identifier
     * @param {Object} res - Express response
     */
    create = asyncHandler(async (req, res) => {
        Validator.of(req.body.name, "name")
            .string()
            .min(1)
            .max(100)
            .regex(/^[a-z0-9-_]+$/i);

        const dek = await this.service.generateDek(req.body.name);
        res.status(201).json({
            id: dek.id,
            name: dek.name,
            createdAt: dek.createdAt,
        });
    });

    /**
     * Retrieves a DEK by ID (decrypted)
     * @param {Object} req - Express request
     * @param {string} req.params.id - DEK ID
     * @param {Object} res - Express response
     */
    get = asyncHandler(async (req, res) => {
        Validator.of(req.params.id, "id").number().min(1);

        const dek = await this.service.getDek(Number(req.params.id));
        res.status(200).json({
            id: dek.id,
            name: dek.name,
            key: dek.key.toString("hex"),
        });
    });

    /**
     * Lists all DEKs (without keys)
     * @param {Object} req - Express request
     * @param {Object} res - Express response
     */
    list = asyncHandler(async (req, res) => {
        Validator.of(req.params.includeKeys, 'includeKeys')
            .optional()
            .number()
            .min(0)
            .max(1)

        const deks = await this.service.getAllDeks(req.params.includeKeys === '1');
        res.status(200).json(
            deks.map((dek) => ({
                id: dek.id,
                name: dek.name,
                kekId: dek.kekId,
                createdAt: dek.createdAt,
                updatedAt: dek.updatedAt,
                key: dek.key ? dek.key.toString("hex") : null,
            }))
        );
    });

    /**
     * Deletes a DEK by ID
     * @param {Object} req - Express request
     * @param {string} req.params.id - DEK ID
     * @param {Object} res - Express response
     */
    delete = asyncHandler(async (req, res) => {
        Validator.of(req.params.id, "id").number().min(1);

        const deleted = await this.service.deleteDek(Number(req.params.id));

        if (!deleted) {
            throw new ServerError("DEK not found", 404);
        }

        res.status(204).end();
    });

    /**
     * Lists all DEKs encrypted with a specific KEK
     * @param {Object} req - Express request
     * @param {string} req.query.kekId - KEK identifier to filter by
     * @param {Object} res - Express response
     */
    getByKek = asyncHandler(async (req, res) => {
        Validator.of(req.params.kekId, "kekId").string().min(1).max(100);
        // 1 to include keys, 0 to not include keys
        Validator.of(req.params.includeKeys, "includeKeys")
            .optional()
            .number()
            .min(0)
            .max(1);

        const includeKeys = req.params.includeKeys === "1";
        const deks = await this.service.getDeksByKek(
            req.params.kekId,
            includeKeys
        );

        res.status(200).json(
            deks.map((dek) => ({
                id: dek.id,
                name: dek.name,
                kekId: dek.kekId,
                version: dek.version,
                isActive: dek.isActive,
                createdAt: dek.createdAt,
                updatedAt: dek.updatedAt,
                ...(includeKeys && { key: dek.key.toString("hex") }),
            }))
        );
    });

    /**
     * Rotates all DEKs to use a new KEK
     * @param {Object} req - Express request
     * @param {string} req.body.newKekId - New KEK identifier
     * @param {string} [req.body.oldKekId] - Optional old KEK identifier to filter
     * @param {Object} res - Express response
     */
    rotateToNewKek = asyncHandler(async (req, res) => {
        Validator.of(req.body.newKekId, "newKekId")
            .string()
            .min(1)
            .max(100);

        Validator.of(req.body.oldKekId, "oldKekId")
            .optional()
            .string()
            .min(1)
            .max(100);

        const { dekRotation } = await KeyManagementService.rotateToNewKek(
            req.body.newKekId,
            req.body.oldKekId
        );

        res.status(200).json({
            success: true,
            stats: {
                total: dekRotation.total,
                success: dekRotation.success,
                failures: dekRotation.failures.length,
            },
            ...(dekRotation.failures.length > 0 && {
                failures: dekRotation.failures,
            }),
        });
    });
}
