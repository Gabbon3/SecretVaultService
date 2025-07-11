export class HexEncoder {
    /**
     * Codifica un Uint8Array in una stringa esadecimale
     * @param {Uint8Array} data - Dati da codificare
     * @returns {string} Stringa esadecimale
     */
    static encode(data) {
        return Buffer.from(data).toString('hex');
    }

    /**
     * Decodifica una stringa esadecimale in Uint8Array
     * @param {string} hexString - Stringa esadecimale da decodificare
     * @returns {Uint8Array} Dati decodificati
     * @throws {Error} Se la stringa non è un esadecimale valido
     */
    static decode(hexString) {
        if (!/^[0-9a-fA-F]*$/.test(hexString)) {
            throw new Error('La stringa non è un esadecimale valido');
        }
        if (hexString.length % 2 !== 0) {
            throw new Error('La stringa esadecimale deve avere una lunghezza pari');
        }
        return new Uint8Array(Buffer.from(hexString, 'hex'));
    }
}