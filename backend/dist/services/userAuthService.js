"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findUserByEmail = findUserByEmail;
exports.registerUserInDb = registerUserInDb;
exports.validatePassword = validatePassword;
exports.createJwtToken = createJwtToken;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../mongo/models/User");
/**
 * Finds a user by their email address.
 *
 * @remarks
 * This function is typically used during login and registration
 * to check whether a user already exists.
 *
 * @param email - The email address to search for.
 *
 * @returns The user document if found, otherwise `null`.
 */
async function findUserByEmail(email) {
    return User_1.User.findOne({ email });
}
/**
 * Registers a new user in the database.
 *
 * @remarks
 * This function:
 * - hashes the password using bcrypt
 * - creates a new user document
 * - saves it to MongoDB
 *
 * Email uniqueness is enforced by the schema.
 *
 * @param email - The user's email address.
 * @param password - The user's plaintext password.
 * @param username - The user's chosen username.
 *
 * @returns The newly created user document.
 */
async function registerUserInDb(email, password, username) {
    const hashed = await bcryptjs_1.default.hash(password, 10);
    const newUser = new User_1.User({
        email,
        password: hashed,
        username
    });
    return newUser.save();
}
/**
 * Validates a plaintext password against a stored bcrypt hash.
 *
 * @remarks
 * Used during login to verify user credentials.
 *
 * @param password - The plaintext password provided by the user.
 * @param hashed - The stored bcrypt hash from the database.
 *
 * @returns `true` if the password matches, otherwise `false`.
 */
async function validatePassword(password, hashed) {
    return bcryptjs_1.default.compare(password, hashed);
}
/**
 * Creates a signed JWT token for an authenticated user.
 *
 * @remarks
 * The token includes:
 * - `_id`
 * - `username`
 *
 * and is signed using the server's secret key.
 *
 * The token expires in **1 hour**.
 *
 * @param user - The user object containing `_id` and `username`.
 *
 * @returns A signed JWT token string.
 */
function createJwtToken(user) {
    return jsonwebtoken_1.default.sign({
        _id: user._id,
        username: user.username
    }, process.env.SECRET, { expiresIn: "1h" });
}
