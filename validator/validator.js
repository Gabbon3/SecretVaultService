import { ServerError } from "../helpers/serverError.js";

/**
 * Fluent interface for data validation with automatic ServerError throwing
 *
 * @example
 * // Basic string validation
 * Validator.of(req.body.username, 'username')
 *   .string()
 *   .min(5)
 *   .max(20);
 *
 * @example
 * // Custom validation
 * Validator.of(req.params.id, 'id')
 *   .string()
 *   .custom(
 *     val => /^[a-z0-9-]+$/.test(val),
 *     'ID must contain only letters, numbers and hyphens'
 *   );
 *
 * @example
 * // Email validation
 * Validator.of(req.body.email, 'email')
 *   .string()
 *   .email();
 *
 * @example
 * // UUID validation
 * Validator.of(req.params.userId, 'userId')
 *   .uuid();
 */
export class Validator {
    /**
     * @param {any} value - Value to validate
     * @param {string} [fieldName='value'] - Field name for error messages
     */
    constructor(value, fieldName = "value") {
        this.value = value;
        this.fieldName = fieldName;
    }

    /**
     * If value is null or undefined, validation is skipped
     * @returns {this}
     * @throws {ServerError} If validation fails
     * @example
     * Validator.of(null).optional().string().max(5); // it will stop at optional() and don't verify next validations
     */
    optional() {
        if (this.value === undefined || this.value === null) {
            return;
        }
        return this;
    }

    /**
     * Validates the value is a string
     * @returns {this}
     * @throws {ServerError} If validation fails
     * @example
     * Validator.of(123).string(); // Throws "value must be a string"
     */
    string() {
        if (typeof this.value !== "string") {
            throw new ServerError(`${this.fieldName} must be a string`, 400);
        }
        return this;
    }

    /**
     * Validates the value is a number
     * @returns {this}
     * @throws {ServerError} If validation fails
     * @example
     * Validator.of("Hi").number(); // Throws "value must be a number"
     */
    number() {
        if (typeof this.value !== "number") {
            throw new ServerError(`${this.fieldName} must be a number`, 400);
        }
        return this;
    }

    /**
     * Validates the value is a boolean
     * @returns {this}
     * @throws {ServerError} If validation fails
     * @example
     * Validator.of('true').boolean(); // Throws "value must be a boolean"
     */
    boolean() {
        if (typeof this.value !== "boolean") {
            throw new ServerError(`${this.fieldName} must be a boolean`, 400);
        }
        return this;
    }

    /**
     * Validates minimum length/value
     * @param {number} min - Minimum length (strings) or value (numbers)
     * @returns {this}
     * @throws {ServerError} If validation fails
     * @example
     * Validator.of('abc').min(5); // Throws "value must be at least 5 characters"
     * Validator.of(3).min(5); // Throws "value must be at least 5"
     */
    min(min) {
        if (typeof this.value === "string" && this.value.length < min) {
            throw new ServerError(
                `${this.fieldName} must be at least ${min} characters`,
                400
            );
        }
        if (typeof this.value === "number" && this.value < min) {
            throw new ServerError(
                `${this.fieldName} must be at least ${min}`,
                400
            );
        }
        return this;
    }

    /**
     * Validates maximum length/value
     * @param {number} max - Maximum length (strings) or value (numbers)
     * @returns {this}
     * @throws {ServerError} If validation fails
     * @example
     * Validator.of('toolong').max(5); // Throws "value must be at most 5 characters"
     */
    max(max) {
        if (typeof this.value === "string" && this.value.length > max) {
            throw new ServerError(
                `${this.fieldName} must be at most ${max} characters`,
                400
            );
        }
        if (typeof this.value === "number" && this.value > max) {
            throw new ServerError(
                `${this.fieldName} must be at most ${max}`,
                400
            );
        }
        return this;
    }

    /**
     * Validates that the string doesn't contain forbidden characters
     * @param {string|Array<string>} chars - Characters or strings to forbid
     * @param {string} [message] - Custom error message
     * @returns {this}
     * @throws {ServerError} If validation fails
     * @example
     * // Single character
     * Validator.of("pass/word").forbiddenChars('/');
     *
     * @example
     * // Multiple characters
     * Validator.of("user@name").forbiddenChars(['@', '!', '#']);
     *
     * @example
     * // Whole strings
     * Validator.of("no<script>").forbiddenChars('<script>');
     */
    forbiddenChars(chars, message) {
        if (typeof this.value !== "string") return this;

        const forbiddenList = Array.isArray(chars) ? chars : [chars];
        const found = forbiddenList.some((char) => this.value.includes(char));

        if (found) {
            const charsList = forbiddenList.map((c) => `"${c}"`).join(", ");
            throw new ServerError(
                message ||
                    `${this.fieldName} contains forbidden characters: ${charsList}`,
                400
            );
        }
        return this;
    }

    /**
     * Validates email format
     * @returns {this}
     * @throws {ServerError} If validation fails
     * @example
     * Validator.of('invalid').email(); // Throws "value must be a valid email"
     */
    email() {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (typeof this.value !== "string" || !emailRegex.test(this.value)) {
            throw new ServerError(
                `${this.fieldName} must be a valid email`,
                400
            );
        }
        return this;
    }

    /**
     * Validates UUID format
     * @returns {this}
     * @throws {ServerError} If validation fails
     * @example
     * Validator.of('not-a-uuid').uuid(); // Throws "value must be a valid UUID"
     */
    uuid() {
        if (!Validator.isUuid(this.value)) {
            throw new ServerError(`${this.fieldName} must be a valid UUID`, 400);
        }
        return this;
    }

    /**
     * Custom validation function
     * @param {(value: any) => boolean} fn - Validation function
     * @param {string} [message] - Custom error message
     * @returns {this}
     * @throws {ServerError} If validation fails
     * @example
     * Validator.of('foo').custom(val => val === 'bar', 'Value must be "bar"');
     */
    custom(fn, message) {
        if (!fn(this.value)) {
            throw new ServerError(message || `Invalid ${this.fieldName}`, 400);
        }
        return this;
    }

    /**
     * Validates against regex pattern
     * @param {RegExp} pattern - Regex pattern to test
     * @param {string} [message] - Custom error message
     * @returns {this}
     * @throws {ServerError} If validation fails
     * @example
     * Validator.of('123').regex(/^[a-z]+$/, 'Only letters allowed');
     */
    regex(pattern, message) {
        if (typeof this.value !== "string" || !pattern.test(this.value)) {
            throw new ServerError(
                message || `${this.fieldName} has invalid format`,
                400
            );
        }
        return this;
    }

    /**
     * Creates new Validator instance
     * @param {any} value - Value to validate
     * @param {string} [fieldName] - Field name for error messages
     * @returns {Validator}
     * @example
     * Validator.of(req.body.email, 'email').string().email();
     */
    static of(value, fieldName) {
        return new Validator(value, fieldName);
    }

    /**
     * Determines whether the string is a uuid
     * @param {string} uuid 
     * @returns {boolean}
     */
    static isUuid(uuid) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return typeof uuid === "string" && uuidRegex.test(uuid)
    }
}
