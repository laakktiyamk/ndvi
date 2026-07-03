import { Router } from "express";
import userRouter from "./userRouter";
import ndviRouter from "./ndviRouter";
import weatherRouter from "./weatherRouter";
import chatRouter from "./chatRouter";
import geocodeRouter from "./geocodeRouter";
import fieldsRouter from "./fieldsRouter";

const router = Router();

router.use("/user", userRouter);
router.use("/ndvi", ndviRouter);
router.use("/weather", weatherRouter);
router.use("/chat", chatRouter);
router.use("/geocode", geocodeRouter);
router.use("/fields", fieldsRouter);

export default router;
