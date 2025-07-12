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
    // KMS
    static KEK = null;
    static DEK = null;
    static DEKID = process.env.DEKID;

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
                name: 'HMAC',
                hash: 'SHA-256'
            },
            false,
            ["sign", "verify"]
        );
        this.KEK = await AES256GCM.importKey(
            HexEncoder.decode(process.env.KEK)
        );
        this.DEK = await AES256GCM.importKey(
            HexEncoder.decode(process.env.DEK)
        );
    }
}
