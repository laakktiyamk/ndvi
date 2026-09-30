import { Router } from "express";
import { processAOI, image, images } from "../controllers/ndviController";
import { checkToken } from "../sentinelhub/sentinelhub_token";

const router: Router = Router();

// Protected routes (Require Sentinel Hub token verification)
router.post("/dates", checkToken, processAOI);
//router.post("/activate", checkToken, activate);

// Public routes (ei checkTokenia, koska MongoDB-luku ei tarvitse tokenia)
router.get("/image/:sentinelid", image);
//router.post("/weather", weather);
//router.get("/aois", AOIs);

router.post("/images", images);

export default router;