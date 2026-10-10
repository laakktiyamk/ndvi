"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userAuthController_1 = require("../controllers/userAuthController");
const inputValidation_1 = require("../middleware/inputValidation");
const router = (0, express_1.Router)();
// tämä tänne vain kokeeksi kuuluu ndvi-rotes.ts
//const { checkToken } = require('../sentinelhub/sentinelhub_token');
//import { checkToken } from '../sentinelhub/sentinelhub_token';
/* -----------------------------
   Authentication
------------------------------*/
/**
 * POST /register
 *
 * Registers a new user.
 *
 * @remarks
 * - Uses validation middleware to ensure proper input.
 * - The controller handles hashing, saving, and duplicate checks.
 *
 * @route POST /users/register
 */
router.post("/register", inputValidation_1.registerValidation, userAuthController_1.registerUser);
/**
 * POST /login
 *
 * Authenticates a user and returns a JWT token.
 *
 * @remarks
 * - Uses validation middleware to ensure proper input.
 * - The controller handles password verification and token creation.
 *
 * @route POST /users/login
 */
router.post("/login", inputValidation_1.loginValidation, userAuthController_1.loginUser);
exports.default = router;
