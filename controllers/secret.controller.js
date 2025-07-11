import { asyncHandler } from "../helpers/asyncHandler.js";
import { SecretService } from "../services/secret.service.js";
import { ServerError } from "../helpers/serverError.js";

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
        const { name, value } = req.body;
        
        if (!name || !value) {
            throw new ServerError('Name and value are required', 400);
        }

        const secret = await this.service.create(name, value);
        res.status(201).json({
            id: secret.id,
            name: secret.name,
            createdAt: secret.createdAt
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
        const { id } = req.params;
        
        if (!id) {
            throw new ServerError('Secret id is required', 400);
        }

        const secret = await this.service.getAsString(id);
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
        const { id } = req.params;
        const { name, value } = req.body;
        
        if (!name || !value) {
            throw new ServerError('Name and value are required', 400);
        }

        const updatedSecret = await this.service.update(id, name, value);
        res.status(200).json({
            name: updatedSecret.name,
            updatedAt: updatedSecret.updatedAt
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
        const { name } = req.params;
        
        if (!name) {
            throw new ServerError('Secret name is required', 400);
        }

        const isDeleted = await this.service.delete(name);
        if (!isDeleted) {
            throw new ServerError('Secret not found', 404);
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
        const { name } = req.params;
        
        if (!name) {
            throw new ServerError('Secret name is required', 400);
        }

        const secrets = await this.service.list();
        const exists = secrets.some(secret => secret.name === name);
        
        res.status(200).json({ exists });
    });
}