import { ServerError } from "../helpers/serverError.js";

/**
 * Gestione degli errori centralizzata
 * @param {ServerError | Error} error 
 * @param {Request} req 
 * @param {Response} res 
 * @param {NextFunction} next 
 * @returns 
 */
export const errorHandler = async (error, req, res, next) => {
    if (error instanceof ServerError) {
        return res.status(error.httpStatusCode).json({ error: error.message });
    }
    // -- gestione di altri errori generici
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
};