import crypto from 'crypto';

export class AES256GCM {
    /**
     * Cifra i dati usando AES-256-GCM
     * @param {Uint8Array} data - Dati da cifrare
     * @param {Uint8Array} key - Chiave di cifratura (32 byte)
     * @param {Uint8Array|null} aad - Dati aggiuntivi autenticati (opzionale)
     * @returns {Promise<Uint8Array>} Dati cifrati nel formato [nonce (12 byte), encrypted data, auth tag (16 byte)]
     */
    static async encrypt(data, key, aad = null) {
        if (key.length !== 32) {
            throw new Error('La chiave AES-256-GCM deve essere di 32 byte (256 bit)');
        }

        // Genera un nonce casuale di 12 byte (96 bit) - raccomandato per GCM
        const nonce = crypto.randomBytes(12);
        
        // Crea il cipher
        const cipher = crypto.createCipheriv('aes-256-gcm', key, nonce, {
            authTagLength: 16 // Lunghezza standard dell'authentication tag per GCM
        });

        // Aggiungi AAD se fornito
        if (aad) {
            cipher.setAAD(aad);
        }

        // Cifra i dati
        const encrypted = Buffer.concat([
            cipher.update(data),
            cipher.final()
        ]);

        // Ottieni l'authentication tag
        const authTag = cipher.getAuthTag();

        // Combina nonce, dati cifrati e auth tag in un unico buffer
        return new Uint8Array(Buffer.concat([nonce, encrypted, authTag]));
    }

    /**
     * Decifra i dati usando AES-256-GCM
     * @param {Uint8Array} encryptedData - Dati cifrati nel formato [nonce (12 byte), encrypted data, auth tag (16 byte)]
     * @param {Uint8Array} key - Chiave di cifratura (32 byte)
     * @param {Uint8Array|null} aad - Dati aggiuntivi autenticati (opzionale)
     * @returns {Promise<Uint8Array>} Dati decifrati
     * @throws {Error} Se l'autenticazione fallisce o i dati sono malformati
     */
    static async decrypt(encryptedData, key, aad = null) {
        if (key.length !== 32) {
            throw new Error('La chiave AES-256-GCM deve essere di 32 byte (256 bit)');
        }

        // Estrai nonce (primi 12 byte)
        if (encryptedData.length < 12 + 16) {
            throw new Error('Dati cifrati malformati: troppo corti per contenere nonce e auth tag');
        }
        
        const nonce = encryptedData.slice(0, 12);
        
        // Estrai auth tag (ultimi 16 byte)
        const authTag = encryptedData.slice(encryptedData.length - 16);
        
        // Estrai i dati cifrati (tutto tranne nonce e auth tag)
        const encrypted = encryptedData.slice(12, encryptedData.length - 16);

        // Crea il decipher
        const decipher = crypto.createDecipheriv('aes-256-gcm', key, nonce, {
            authTagLength: 16
        });

        // Aggiungi AAD se fornito
        if (aad) {
            decipher.setAAD(aad);
        }

        // Imposta l'authentication tag
        decipher.setAuthTag(authTag);

        try {
            // Decifra i dati
            const decrypted = Buffer.concat([
                decipher.update(encrypted),
                decipher.final()
            ]);
            
            return new Uint8Array(decrypted);
        } catch (err) {
            throw new Error('Autenticazione fallita: i dati potrebbero essere stati alterati o la chiave è errata');
        }
    }
}