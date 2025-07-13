import { asyncHandler } from "../helpers/asyncHandler.js";
import { DEKService } from "../services/dek.service.js";
import { ServerError } from "../helpers/serverError.js";
import { Validator } from "../validator/validator.js";

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
        const deks = await this.service.getAllDeks(true);
        res.status(200).json(
            deks.map((dek) => ({
                id: dek.id,
                name: dek.name,
                createdAt: dek.createdAt,
                updatedAt: dek.updatedAt,
                key: dek.key.toString("hex"),
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
}
