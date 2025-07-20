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
        this.skipValidation = false;
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
            this.skipValidation = true;
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
        if (this.skipValidation) return this;
        if (typeof this.value !== "string") {
            throw new ServerError(`${this.fieldName} must be a string`, 400);
        }
        return this;
    }

    /**
     * Validates the value is not empty
     * @returns {this}
     * @throws {ServerError} If validation fails
     * @example
     * Validator.of("").string().nonEmpty(); // Throws "value cannot be empty"
     * Validator.of([]).array().nonEmpty(); // Throws "value cannot be empty"
     */
    nonEmpty() {
        if (this.skipValidation) return this;
        if (this.value === undefined || this.value === null) {
            throw new ServerError(
                `${this.fieldName} cannot be null/undefined`,
                400
            );
        }
        if (typeof this.value === "string" && this.value.trim() === "") {
            throw new ServerError(`${this.fieldName} cannot be empty`, 400);
        }
        if (Array.isArray(this.value) && this.value.length === 0) {
            throw new ServerError(`${this.fieldName} cannot be empty`, 400);
        }
        return this;
    }

    /**
     * Validates the value is a number
     * @param {number} [min=null] - min value
     * @param {number} [max=null] - max value 
     * @returns {this}
     * @throws {ServerError} If validation fails
     * @example
     * Validator.of("Hi").number(); // Throws "value must be a number"
     * Validator.of(5).number(6); // Throws "value must be greater than 6"
     * Validator.of(11).number(0, 10); // Throws "value must be lower than 10"
     */
    number(min = null, max = null) {
        if (this.skipValidation) return this;
        this.value = Number(this.value)
        if (typeof this.value !== "number" || isNaN(this.value)) {
            throw new ServerError(`${this.fieldName} must be a number`, 400);
        }
        if (min && this.value < min) {
            throw new ServerError(`${this.fieldName} must be greater than ${min}`, 400);
        }
        if (max && this.value > max) {
            throw new ServerError(`${this.fieldName} must be lower than ${min}`, 400);
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
        if (this.skipValidation) return this;
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
        if (this.skipValidation) return this;
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
        if (this.skipValidation) return this;
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
        if (this.skipValidation) return this;
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
     * Validates the value is an array
     * @param {Object} options
     * @param {number} [options.min=0] - Minimum array length (default: 0)
     * @param {number} [options.max=-1] - Maximum array length (-1 means no limit, default: -1)
     * @param {boolean} [options.unique=false] - If true, validates that the array contains no duplicates (default: false)
     * @returns {this}
     * @throws {ServerError} If validation fails
     * @example
     * Validator.of(input).array(); // Must be array
     * Validator.of(input).array({ min: 1 }); // Non-empty array
     * Validator.of(input).array({ min: 0, max: 10 }); // Non-empty array max 10 items
     * Validator.of(input).array({ unique: true }); // Arrays with distinct elements
     */
    array({ min = 0, max = -1, unique = false } = {}) {
        if (this.skipValidation) return this;
        if (!Array.isArray(this.value)) {
            throw new ServerError(`${this.fieldName} must be an array`, 400);
        }
        // Length validation
        if (max > 0 && this.value.length > max) {
            throw new ServerError(
                `${this.fieldName} must contain max ${max} items`,
                400
            );
        }
        if (this.value.length < min) {
            throw new ServerError(
                `${this.fieldName} must contain at least ${min} items`,
                400
            );
        }
        // Unique validation
        if (unique) {
            const uniqueItems = [...new Set(this.value)];
            if (uniqueItems.length !== this.value.length) {
                throw new ServerError(
                    `${this.fieldName} contains duplicate items`,
                    400
                );
            }
        }
        return this;
    }

    /**
     * Validates each array item using a callback
     * @param {(validator: Validator) => void} fn - Validation function
     * @returns {this}
     * @throws {ServerError} If any item fails validation
     * @example
     * Validator.of(input).each(v => v.string().min(3));
     */
    each(fn) {
        if (this.skipValidation) return this;
        if (!Array.isArray(this.value)) {
            throw new Error(
                "Validator Error! each validation cannot be called to a variable not of type array."
            );
        }
        this.value.forEach((item, index) => {
            try {
                fn(Validator.of(item, `${this.fieldName}[${index}]`));
            } catch (error) {
                throw new ServerError(
                    `Invalid item at position ${index}: ${error.message}`,
                    400
                );
            }
        });
        return this;
    }

    /**
     * Validates the value is a valid date (accepts Date, ISO string, or timestamp)
     * @returns {this}
     * @throws {ServerError} If validation fails
     * @example
     * Validator.of('2023-10-01').date(); // ISO string
     * Validator.of(1696118400000).date(); // Timestamp
     * Validator.of(new Date()).date();    // Date object
     */
    date() {
        if (this.skipValidation) return this;
        const date = new Date(this.value);
        if (isNaN(date.getTime())) {
            throw new ServerError(
                `${this.fieldName} must be a valid date`,
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
        if (this.skipValidation) return this;
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
        if (this.skipValidation) return this;
        if (!Validator.isUuid(this.value)) {
            throw new ServerError(
                `${this.fieldName} must be a valid UUID`,
                400
            );
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
        if (this.skipValidation) return this;
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
        if (this.skipValidation) return this;
        if (typeof this.value !== "string" || !pattern.test(this.value)) {
            throw new ServerError(
                message || `${this.fieldName} has invalid format`,
                400
            );
        }
        return this;
    }

    /**
     * Determines whether the string is a uuid
     * @param {string} uuid
     * @returns {boolean}
     */
    static isUuid(uuid) {
        const uuidRegex =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return typeof uuid === "string" && uuidRegex.test(uuid);
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
}
