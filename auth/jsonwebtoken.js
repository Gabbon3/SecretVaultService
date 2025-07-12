import { SignJWT, jwtVerify } from "jose";

export class JWT {
    /**
     * Signs a payload and returns a JWT
     * @param {Object} payload - Data to include in the token
     * @param {CryptoKey} key - HMAC-SHA256 CryptoKey
     * @param {number} [expiresIn] - Expiration time in seconds
     * @returns {Promise<string>} The signed JWT
     */
    static async sign(payload, key, expiresIn) {
        const signJWT = new SignJWT(payload).setProtectedHeader({
            alg: "HS256",
        });

        if (expiresIn) {
            signJWT.setExpirationTime(
                Math.floor(Date.now() / 1000) + expiresIn
            );
        }

        return await signJWT.sign(key);
    }

    /**
     * Verifies a JWT and returns the validation result
     * @param {string} token - JWT to verify
     * @param {CryptoKey} key - HMAC-SHA256 CryptoKey
     * @returns {Promise<{isValid: boolean, payload?: JWTPayload}>} Verification result
     */
    static async verify(token, key) {
        try {
            const { payload } = await jwtVerify(token, key);
            return { isValid: true, payload };
        } catch (error) {
            return { isValid: false };
        }
    }
}