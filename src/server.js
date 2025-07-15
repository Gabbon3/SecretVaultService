import express from 'express';
import { database } from './data/database.js';
import { Config } from './config.js';
import { errorHandler } from './middlewares/errorHandler.js';
import './models/associations.js';
import { KeyManagementService } from './crypto/services/keyManagementService.js';
// routes
import secretRouter from './routes/secret.routes.js';
import clientRouter from './routes/client.routes.js';
import dekRouter from './routes/dek.routes.js';
import folderRouter from './routes/folder.routes.js';

/**
 * Globals
 */
// import { webcrypto } from 'node:crypto';
// globalThis.crypto = webcrypto;

/**
 * Inizializzazione app
 */
const app = express();
const router = express.Router();

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
router.use('/dek', dekRouter);
router.use('/folder', folderRouter);
/**
 * Middlewares per gli errori
 */
app.use(errorHandler);
/**
 * Server
 */
try {
    await database.authenticate();
    console.log('☑️ DB');
    // // -- da utilizzare solo quando ci si vuole allineare con il db
    // await database.sync({ force: true });
    // console.log('☑️ Struct');
    // ---
    app.listen(Config.PORT, '0.0.0.0', () => {
        console.log(`☑️ Server`);
    });
} catch (error) {
    console.error('❌ Errore durante l\'avvio del server => ' + error);
}

/**
 * Inizializzo i componenti
 */
await Config.initialize();
await KeyManagementService.initialize();