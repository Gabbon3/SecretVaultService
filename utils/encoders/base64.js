export class Base64Encoder {
    /**
     * Codifica un Uint8Array in una stringa Base64 standard
     * @param {Uint8Array} data - Dati da codificare
     * @returns {string} Stringa Base64
     */
    static encode(data) {
        return Buffer.from(data).toString('base64');
    }

    /**
     * Codifica un Uint8Array in una stringa Base64 URL-safe
     * @param {Uint8Array} data - Dati da codificare
     * @returns {string} Stringa Base64 URL-safe
     */
    static encodeURLSafe(data) {
        return Buffer.from(data)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');
    }

    /**
     * Decodifica una stringa Base64 in Uint8Array
     * @param {string} base64String - Stringa Base64 da decodificare
     * @returns {Uint8Array} Dati decodificati
     * @throws {Error} Se la stringa non è un Base64 valido
     */
    static decode(base64String) {
        // Gestisce sia Base64 standard che URL-safe
        const paddedString = base64String
            .replace(/-/g, '+')
            .replace(/_/g, '/');
        
        // Aggiunge il padding mancante se necessario
        const padLength = (4 - (paddedString.length % 4)) % 4;
        const properlyPadded = paddedString + '='.repeat(padLength);

        try {
            return new Uint8Array(Buffer.from(properlyPadded, 'base64'));
        } catch (e) {
            throw new Error('La stringa non è un Base64 valido');
        }
    }

    /**
     * Verifica se una stringa è un Base64 valido
     * @param {string} str - Stringa da verificare
     * @returns {boolean} True se è un Base64 valido
     */
    static isValid(str) {
        if (typeof str !== 'string') return false;
        
        const base64Regex = /^[A-Za-z0-9+/=]+$/;
        const urlSafeRegex = /^[A-Za-z0-9_-]+$/;
        
        return base64Regex.test(str) || urlSafeRegex.test(str);
    }
}