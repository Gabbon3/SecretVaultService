import { asyncHandler } from "../helpers/asyncHandler.js";
import { ClientService } from "../services/client.service.js";
import { ServerError } from "../helpers/serverError.js";

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
        const { name, secret, roles, permissions } = req.body;
        
        if (!name || !secret) {
            throw new ServerError('Name and secret are required', 400);
        }

        const client = await this.service.createClient(name, secret, roles, permissions);
        
        res.status(201).json({
            id: client.id,
            name: client.name,
            createdAt: client.createdAt,
            roles: client.roles.split(',').filter(r => r),
            permissions: client.permissions.split(',').filter(p => p)
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
        const { clientId, secret } = req.body;
        
        if (!clientId || !secret) {
            throw new ServerError('Client ID and secret are required', 400);
        }

        const { token, client } = await this.service.authenticate(clientId, secret);
        
        res.status(200).json({
            token,
            client: {
                id: client.id,
                name: client.name,
                roles: client.roles.split(',').filter(r => r),
                permissions: client.permissions.split(',').filter(p => p),
                createdAt: client.createdAt
            },
            expiresIn: '1h'
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
        const { clientId } = req.params;
        
        const isRevoked = await this.service.revokeClient(clientId);
        
        if (!isRevoked) {
            throw new ServerError('Client not found', 404);
        }

        res.status(204).end();
    });

    /**
     * Validates a client token (for health checks)
     * @param {Object} req - Express request
     * @param {Object} req.headers - Request headers
     * @param {string} req.headers.authorization - Bearer token
     * @param {Object} res - Express response
     */
    validate = asyncHandler(async (req, res) => {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new ServerError('Authentication required', 401);
        }

        const token = authHeader.split(' ')[1];
        const { isValid, payload } = await this.service.validateToken(token);

        if (!isValid || !payload) {
            throw new ServerError('Invalid or expired token', 401);
        }

        res.status(200).json({
            isValid: true,
            clientId: payload.clientId,
            expiresAt: payload.exp ? new Date(payload.exp * 1000) : null
        });
    });

    /**
     * Gets client info (requires valid token)
     * @param {Object} req - Express request
     * @param {Object} req.client - Authenticated client info from middleware
     * @param {Object} res - Express response
     */
    getClientInfo = asyncHandler(async (req, res) => {
        const client = await this.service.getClientById(req.client.id);
        
        if (!client) {
            throw new ServerError('Client not found', 404);
        }

        res.status(200).json({
            id: client.id,
            name: client.name,
            isActive: client.isActive,
            roles: client.roles.split(',').filter(r => r),
            permissions: client.permissions.split(',').filter(p => p),
            createdAt: client.createdAt,
            lastUsedAt: client.lastUsedAt
        });
    });
}