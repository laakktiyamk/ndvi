import { Router } from "express";
import * as ndviControllers from "../controllers/ndviController"; // voitais ottaa erikseen controllerit {list, activate, image, weather, AOIs} jos halutaan
import { checkToken } from "../sentinelhub/sentinelhub_token";

const router: Router = Router();

// Routes
// Protected routes (Require Sentinel Hub token verification)
router.post("/dates", checkToken, ndviControllers.dates);
//router.post("/activate", checkToken, ndviControllers.activate);

// Public or alternative routes (Do not require the checkToken middleware) because reading from MongoDB does not require a valid Sentinel Hub token
router.get("/image/:sentinelid", ndviControllers.image);
//router.post("/weather", ndviControllers.weather);
router.get("/aois", ndviControllers.AOIs);

router.post("/images", ndviControllers.images);

export default router;
