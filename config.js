import 'dotenv/config';

export class Config {
    // Server
    static PORT = process.env.PORT || 3000;
    // Database
    static DB_HOST = process.env.DB_HOST;
    static DB_NAME = process.env.DB_NAME;
    static DB_USER = process.env.DB_USER;
    static DB_PASSWORD = process.env.DB_PASSWORD;
    // Auth
    static JWT_SIGN_KEY = Buffer.from(process.env.JWT_SIGN_KEY);
    // KMS
    static KEK = process.env.KEK;
    static DEK = process.env.DEK;
    static DEKID = process.env.DEKID;
}