import express from 'express';
import { database } from './data/database.js';
import { Config } from './config.js';
import { errorHandler } from './middlewares/errorHandler.js';
import './models/associations.js';
import { KeyManagementService } from './crypto/services/keyManagementService.js';
// routes
import secretRouter from './routes/secret.routes.js';
import clientRouter from './routes/client.routes.js';

/**
 * Inizializzazione app
 */
const app = express();
const router = express.Router();
/**
 * Inizializzo i componenti
 */
KeyManagementService.initialize();
/**
 * MIDDLEWARES
 * qui ci sono i middleware che verranno utilizzati in tutte le routes
 */
app.use(express.json());
/**
 * ROUTES
 */
app.use('/api', router);
router.use('/secret', secretRouter);
router.use('/client', clientRouter);
/**
 * Middlewares per gli errori
 */
app.use(errorHandler);

try {
    await database.authenticate();
    console.log('☑️ DB');
    // -- da utilizzare solo quando ci si vuole allineare con il db
    // await database.sync({ force: true });
    console.log('☑️ Struct');
    // ---
    app.listen(Config.PORT, '0.0.0.0', () => {
        console.log(`☑️ Server`);
    });
} catch (error) {
    console.error('❌ Errore durante l\'avvio del server => ' + error);
}