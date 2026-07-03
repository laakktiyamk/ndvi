import { Router } from "express";
import * as weatherControllers from "../controllers/weatherController";

const router: Router = Router();

router.post("/", weatherControllers.weather);

router.post("/all", weatherControllers.weatherAll);

export default router;
