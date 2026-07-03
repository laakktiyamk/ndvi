import { Router } from "express";

import { registerUser, loginUser } from "../controllers/userAuthController";
import { registerValidation, loginValidation } from "../middleware/inputValidation";

const router = Router();


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
router.post("/register", registerValidation, registerUser);

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
router.post("/login", loginValidation, loginUser);


export default router;
