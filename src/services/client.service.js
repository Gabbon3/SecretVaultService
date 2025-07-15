import argon2 from 'argon2';

import { Config } from '../config.js';
import { Client } from '../models/client.js';
import { ServerError } from '../helpers/serverError.js';
import { JWT } from '../auth/jsonwebtoken.js';

export class ClientService {

    /**
     * Creates a new API client
     * @param {string} name - Client name/identifier
     * @param {string} secret - Plain text secret
     * @param {string[]} [roles] - Array of roles
     * @param {string[]} [permissions] - Array of permissions
     * @returns {Promise<Client>} The created client record
     * @throws {ServerError} If creation fails
     */
    async createClient(name, secret, roles = [], permissions = []) {
        if (!name || !secret) {
            throw new ServerError('Name and secret are required', 400);
        }

        try {
            const hashedSecret = await argon2.hash(secret, {
                type: argon2.argon2id
            });
            
            const client = await Client.create({
                name,
                hashedSecret,
                roles: roles.join(','),
                permissions: permissions.join(',')
            });

            return client;
        } catch (error) {
            if (error.name === 'SequelizeUniqueConstraintError') {
                throw new ServerError('Client name already exists', 409);
            }
            throw new ServerError(`Failed to create client: ${error.message}`, 500);
        }
    }

    /**
     * Authenticates a client and generates a JWT
     * @param {string} name - Client name
     * @param {string} secret - Client secret
     * @returns {Promise<{token: string, client: Client}>} JWT token and client info
     * @throws {ServerError} If authentication fails
     */
    async authenticate(name, secret) {
        if (!name || !secret) {
            throw new ServerError('Id and secret are required', 400);
        }

        const client = await Client.findOne({ where: { name: name } });
        if (!client || !client.isActive) {
            throw new ServerError('Invalid client credentials', 401);
        }

        try {
            const isValid = await argon2.verify(client.hashedSecret, secret);
            if (!isValid) {
                throw new ServerError('Invalid client credentials', 401);
            }
        } catch (error) {
            throw new ServerError('Invalid client credentials', 401);
        }

        // Update last used timestamp
        await client.update({ lastUsedAt: new Date() });

        // Generate JWT
        const token = await JWT.sign(
            { 
                clientId: client.id,
                roles: client.roles.split(',').filter(r => r),
                permissions: client.permissions.split(',').filter(p => p)
            },
            Config.JWT_SIGN_KEY,
            Config.JWT_LIFETIME,
        );

        return {
            token,
            client: {
                id: client.id,
                name: client.name,
                roles: client.roles,
                permissions: client.permissions,
                createdAt: client.createdAt
            }
        };
    }

    /**
     * Revokes a client (disables it)
     * @param {string} clientId - Client ID to revoke
     * @returns {Promise<boolean>} True if client was revoked, false if not found
     * @throws {ServerError} If operation fails
     */
    async revokeClient(clientId) {
        try {
            const [affectedRows] = await Client.update(
                { isActive: false },
                { where: { id: clientId } }
            );
            
            return affectedRows > 0;
        } catch (error) {
            throw new ServerError(`Failed to revoke client: ${error.message}`, 500);
        }
    }

    /**
     * Gets client by ID
     * @param {string} clientId - Client ID
     * @returns {Promise<Client|null>} Client record or null if not found
     */
    async getClientById(clientId) {
        return await Client.findByPk(clientId);
    }
}