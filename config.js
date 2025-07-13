import "dotenv/config";
import { AES256GCM } from "./crypto/symmetric/aes256gcm.js";
import { HexEncoder } from "./utils/encoders/hex.js";

export class Config {
    static initialized = false;
    // Server
    static PORT = process.env.PORT || 3000;
    // Database
    static DB_HOST = process.env.DB_HOST;
    static DB_NAME = process.env.DB_NAME;
    static DB_USER = process.env.DB_USER;
    static DB_PASSWORD = process.env.DB_PASSWORD;
    // Auth
    static JWT_SIGN_KEY = null;
    // Google KMS
    static KMS = {
        projectId: process.env.GCLOUD_PROJECT_ID,
        defaultKekId: process.env.KMS_KEK_ID,
        kek1: {
            locationId: process.env.GCLOUD_LOCATION_ID,
            keyRingId: process.env.KMS_KEYRING_ID,
            keyId: 'kek1'
        },
        kek2: {
            locationId: process.env.GCLOUD_LOCATION_ID,
            keyRingId: process.env.KMS_KEYRING_ID,
            keyId: 'kek2'
        }
    };

    /**
     * Inizializza le variabili
     */
    static async initialize() {
        if (this.initialized) return;
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
