export class ServerError extends Error {
    constructor(message, httpStatusCode = 500) {
        super(message);
        this.httpStatusCode = httpStatusCode;
    }
}