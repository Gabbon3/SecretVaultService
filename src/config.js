import "dotenv/config";
import { HexEncoder } from "./utils/encoders/hex.js";
import { AES256GCM } from "./crypto/symmetric/aes256gcm.js";
import { kmsConfig } from '../kms-config.js';

export class Config {
    static initialized = false;
    static DEV = process.env.DEV == 'true';
    static KEK = null;
    // Server
    static PORT = process.env.PORT || 3000;
    // Database
    static DB_HOST = process.env.DB_HOST;
    static DB_NAME = process.env.DB_NAME;
    static DB_USER = process.env.DB_USER;
    static DB_PASSWORD = process.env.DB_PASSWORD;
    // Auth
    static JWT_SIGN_KEY = null;
    static JWT_LIFETIME = process.env.JWT_LIFETIME;
    // Google KMS
    static KMS = {
        ...kmsConfig,
        projectId: process.env.GCLOUD_PROJECT_ID
    };

    /**
     * Inizializza le variabili
     */
    static async initialize() {
        if (this.initialized) return;
        // ---
        if (this.DEV) {
            this.KEK = await AES256GCM.importKey(HexEncoder.decode(process.env.KEK));
        }
        // ---
        this.JWT_SIGN_KEY = await crypto.subtle.importKey(
            "raw",
            HexEncoder.decode(process.env.JWT_SIGN_KEY),
            {
                name: "HMAC",
                hash: "SHA-256",
            },
            false,
            ["sign", "verify"]
        );
    }
}
