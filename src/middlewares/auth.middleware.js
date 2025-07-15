import { asyncHandler } from "../helpers/asyncHandler.js";
import { ClientService } from "../services/client.service.js";
import { ServerError } from "../helpers/serverError.js";
import { JWT } from "../auth/jsonwebtoken.js";
import { Config } from "../config.js";

/**
 * Middleware di autorizzazione che verifica:
 * 1. Presenza e validità del token JWT
 * 2. Stato attivo del client
 * 3. Eventuali ruoli o permessi richiesti
 * 
 * @param {Object} options - Opzioni di configurazione
 * @param {string[]} [options.roles] - Ruoli richiesti (almeno uno)
 * @param {string[]} [options.permissions] - Permessi richiesti (almeno uno)
 * @param {boolean} [options.requireAllPermissions=false] - Se true, richiede tutti i permessi specificati
 * @returns {Function} Middleware Express
 * 
 * @example
 * // Richiede uno di questi ruoli
 * router.get('/admin', Authorize({ roles: ['admin', 'superadmin'] }), adminController);
 * 
 * // Richiede almeno uno di questi permessi
 * router.post('/secrets', Authorize({ permissions: ['secrets:write', 'secrets:admin'] }), secretsController);
 * 
 * // Richiede TUTTI i permessi specificati
 * router.delete('/users', Authorize({ 
 *   permissions: ['users:delete', 'users:admin'],
 *   requireAllPermissions: true 
 * }), usersController);
 */
export const Authorize = (options = {}) => {
    return asyncHandler(async (req, res, next) => {
        const authHeader = req.headers.authorization;
        
        // Verifica presenza token
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new ServerError('Authentication required', 401);
        }

        const service = new ClientService();
        const token = authHeader.split(' ')[1];
        const { isValid, payload } = await JWT.verify(token, Config.JWT_SIGN_KEY);

        // Verifica validità token
        if (!isValid || !payload) {
            throw new ServerError('Invalid or expired token', 401);
        }

        // Verifica stato client
        const client = await service.getClientById(payload.clientId);
        if (!client || !client.isActive) {
            throw new ServerError('Client account is inactive', 401);
        }

        // Estrai ruoli e permessi dal payload
        const clientRoles = payload.roles || [];
        const clientPermissions = payload.permissions || [];
        
        // Verifica ruoli se specificati
        if (options.roles && options.roles.length > 0) {
            const hasRole = options.roles.some(role => 
                clientRoles.includes(role)
            );
            
            if (!hasRole) {
                throw new ServerError(`Required roles: ${options.roles.join(', ')}`, 403);
            }
        }

        // Verifica permessi se specificati
        if (options.permissions && options.permissions.length > 0) {
            if (options.requireAllPermissions) {
                // Richiede TUTTI i permessi specificati
                const hasAllPermissions = options.permissions.every(permission => 
                    clientPermissions.includes(permission)
                );
                
                if (!hasAllPermissions) {
                    throw new ServerError(`Required all permissions: ${options.permissions.join(', ')}`, 403);
                }
            } else {
                // Richiede almeno UN permesso specificato
                const hasAnyPermission = options.permissions.some(permission => 
                    clientPermissions.includes(permission)
                );
                
                if (!hasAnyPermission) {
                    throw new ServerError(`Required any of these permissions: ${options.permissions.join(', ')}`, 403);
                }
            }
        }

        // Aggiungi informazioni del client alla request
        req.client = {
            id: payload.clientId,
            name: client.name,
            roles: clientRoles,
            permissions: clientPermissions,
            isActive: client.isActive
        };

        next();
    });
};