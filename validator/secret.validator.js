import { Validator } from "./validator.js";

export const SecretValidator = {
    name: (value) => 
        Validator.of(value, 'name')
            .string()
            .min(3)
            .max(50)
            .forbiddenChars([' ', '@']),

    value: (value) =>
        Validator.of(value, 'value')
            .string()
            .min(8)
            .regex(/[A-Z]/)
            .regex(/[0-9]/),
    
    identifier: (value) =>
        Validator.of(value, 'identifier')
            .string()
            .min(3)
            .max(100)
            .forbiddenChars(' '),
    
    id: (value) =>
        Validator.of(value, 'id')
            .uuid(),
};