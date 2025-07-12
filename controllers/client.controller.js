import { asyncHandler } from "../helpers/asyncHandler.js";
import { ClientService } from "../services/client.service.js";
import { ServerError } from "../helpers/serverError.js";
import { Validator } from "../validator/validator.js";

export class ClientController {
    constructor() {
        this.service = new ClientService();
    }
    /**
     * Registers a new API client
     * @param {Object} req - Express request
     * @param {Object} req.body - Request body
     * @param {string} req.body.name - Client name
     * @param {string} req.body.secret - Client secret
     * @param {string[]} [req.body.roles] - Client roles
     * @param {string[]} [req.body.permissions] - Client permissions
     * @param {Object} res - Express response
     */
    register = asyncHandler(async (req, res) => {
        Validator.of(req.body.name, "name").string().max(100);
        Validator.of(req.body.secret, "secret").string().max(100);

        Validator.of(req.body.roles, "roles")
            .optional()
            .array({ max: 10, unique: true })
            .each((v) => v.string().min(1).max(20));

        Validator.of(req.body.permissions, "permissions")
            .optional()
            .array({ max: 10, unique: true  })
            .each((v) => v.string().min(1).max(20));

        const { name, secret, roles, permissions } = req.body;

        if (!name || !secret) {
            throw new ServerError("Name and secret are required", 400);
        }

        const client = await this.service.createClient(
            name,
            secret,
            roles,
            permissions
        );

        res.status(201).json({
            id: client.id,
            name: client.name,
            createdAt: client.createdAt,
            roles: client.roles.split(",").filter((r) => r),
            permissions: client.permissions.split(",").filter((p) => p),
        });
    });

    /**
     * Authenticates a client and returns a JWT
     * @param {Object} req - Express request
     * @param {Object} req.body - Request body
     * @param {string} req.body.clientId - Client ID
     * @param {string} req.body.secret - Client secret
     * @param {Object} res - Express response
     */
    login = asyncHandler(async (req, res) => {
        Validator.of(req.body.clientId, "clientId").uuid();
        Validator.of(req.body.secret, "secret").string().max(100);

        const { clientId, secret } = req.body;

        if (!clientId || !secret) {
            throw new ServerError("Client ID and secret are required", 400);
        }

        const { token, client } = await this.service.authenticate(
            clientId,
            secret
        );

        res.status(200).json({
            token,
            client: {
                id: client.id,
                name: client.name,
                roles: client.roles.split(",").filter((r) => r),
                permissions: client.permissions.split(",").filter((p) => p),
                createdAt: client.createdAt,
            },
            expiresIn: "1h",
        });
    });

    /**
     * Revokes a client (admin only)
     * @param {Object} req - Express request
     * @param {Object} req.params - Request params
     * @param {string} req.params.clientId - Client ID to revoke
     * @param {Object} res - Express response
     */
    revoke = asyncHandler(async (req, res) => {
        Validator.of(req.body.clientId, "clientId").uuid();

        const { clientId } = req.params;

        const isRevoked = await this.service.revokeClient(clientId);

        if (!isRevoked) {
            throw new ServerError("Client not found", 404);
        }

        res.status(204).end();
    });

    /**
     * Gets client info (requires valid token)
     * @param {Object} req - Express request
     * @param {Object} req.client - Authenticated client info from middleware
     * @param {Object} res - Express response
     */
    getClientInfo = asyncHandler(async (req, res) => {
        Validator.of(req.params.clientId, "clientId").uuid();

        const client = await this.service.getClientById(req.body.clientId);

        if (!client) {
            throw new ServerError("Client not found", 404);
        }

        res.status(200).json({
            id: client.id,
            name: client.name,
            isActive: client.isActive,
            roles: client.roles.split(",").filter((r) => r),
            permissions: client.permissions.split(",").filter((p) => p),
            createdAt: client.createdAt,
            lastUsedAt: client.lastUsedAt,
        });
    });
}
