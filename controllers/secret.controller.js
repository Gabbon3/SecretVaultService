import { asyncHandler } from "../helpers/asyncHandler.js";
import { SecretService } from "../services/secret.service.js";
import { ServerError } from "../helpers/serverError.js";
import { SecretValidator } from "../validator/secret.validator.js";
import { Validator } from "../validator/validator.js";

export class SecretController {
    constructor() {
        this.service = new SecretService();
    }

    /**
     * Creates a new secret
     * @param {Object} req - Express request object
     * @param {Object} req.body - Request body
     * @param {string} req.body.name - Secret name/identifier
     * @param {string} req.body.value - Secret value to encrypt
     * @param {Object} res - Express response object
     */
    create = asyncHandler(async (req, res) => {
        SecretValidator.name(req.body.name);
        SecretValidator.value(req.body.value);

        const { name, value } = req.body;

        const secret = await this.service.create(name, value);
        res.status(201).json({
            id: secret.id,
            name: secret.name,
            createdAt: secret.createdAt,
        });
    });

    /**
     * Retrieves a secret by name
     * @param {Object} req - Express request object
     * @param {Object} req.params - Request parameters
     * @param {string} req.params.name - Secret name
     * @param {Object} res - Express response object
     */
    get = asyncHandler(async (req, res) => {
        SecretValidator.identifier(req.params.identifier);

        const { identifier } = req.params;

        const isUUID = Validator.isUuid(identifier);

        const secret = await this.service.getAsString(identifier, isUUID);
        res.status(200).json(secret);
    });

    /**
     * Updates an existing secret
     * @param {Object} req - Express request object
     * @param {Object} req.params - Request parameters
     * @param {string} req.params.name - Secret name
     * @param {Object} req.body - Request body
     * @param {string} req.body.value - New secret value
     * @param {Object} res - Express response object
     */
    update = asyncHandler(async (req, res) => {
        SecretValidator.id(req.params.id);
        SecretValidator.name(req.body.name);
        SecretValidator.value(req.body.value);

        const { id } = req.params;
        const { name, value } = req.body;

        const updatedSecret = await this.service.update(id, name, value);
        res.status(200).json({
            name: updatedSecret.name,
            updatedAt: updatedSecret.updatedAt,
        });
    });

    /**
     * Deletes a secret by name
     * @param {Object} req - Express request object
     * @param {Object} req.params - Request parameters
     * @param {string} req.params.name - Secret name
     * @param {Object} res - Express response object
     */
    delete = asyncHandler(async (req, res) => {
        SecretValidator.id(req.params.id);

        const { id } = req.params;

        if (!id) {
            throw new ServerError("Secret name is required", 400);
        }

        const isDeleted = await this.service.delete(id);
        if (!isDeleted) {
            throw new ServerError("Secret not found", 404);
        }

        res.status(204).end();
    });

    /**
     * Lists all secret names
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    list = asyncHandler(async (req, res) => {
        const secrets = await this.service.list();
        res.status(200).json(secrets);
    });

    /**
     * Checks if a secret exists
     * @param {Object} req - Express request object
     * @param {Object} req.params - Request parameters
     * @param {string} req.params.name - Secret name
     * @param {Object} res - Express response object
     */
    exists = asyncHandler(async (req, res) => {
        SecretValidator.name(req.body.name);

        const { name } = req.params;

        const secrets = await this.service.list();
        const exists = secrets.some((secret) => secret.name === name);

        res.status(200).json({ exists });
    });
}
