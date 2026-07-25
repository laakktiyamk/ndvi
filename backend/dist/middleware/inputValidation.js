"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginValidation = exports.registerValidation = void 0;
const express_validator_1 = require("express-validator");
/**
 * Validation rules for user registration.
 *
 * @remarks
 * This validation chain ensures:
 * - `email` is properly formatted
 * - `username` is between 3–25 characters
 * - `password` meets minimum security requirements:
 *   - at least 8 characters
 *   - contains lowercase, uppercase, number, and special character
 *
 * These rules are executed before the registration controller runs.
 */
exports.registerValidation = [
    (0, express_validator_1.body)("email")
        .trim()
        .escape()
        .isEmail().withMessage("Invalid email format"),
    (0, express_validator_1.body)("username")
        .trim()
        .escape()
        .isLength({ min: 3, max: 25 }).withMessage("Username must be 3–25 characters long"),
    (0, express_validator_1.body)("password")
        .isLength({ min: 8 }).withMessage("Password must be at least 8 characters long")
        .matches(/[a-z]/).withMessage("Password must contain at least one lowercase letter")
        .matches(/[A-Z]/).withMessage("Password must contain at least one uppercase letter")
        .matches(/[0-9]/).withMessage("Password must contain at least one number")
        .matches(/[#?!&@\$%^*_\-]/).withMessage("Password must contain at least one special character (#?!&@ etc)")
];
/**
 * Validation rules for user login.
 *
 * @remarks
 * This validation chain ensures:
 * - `email` is a valid email format
 * - `password` is provided
 *
 * These rules are executed before the login controller runs.
 */
exports.loginValidation = [
    (0, express_validator_1.body)("email")
        .trim()
        .escape()
        .isEmail().withMessage("Invalid email format"),
    (0, express_validator_1.body)("password")
        .exists().withMessage("Password is required")
];
