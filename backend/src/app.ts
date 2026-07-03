import express from "express";
import routes from "./routes/";
//import {authenticateUser} from './middleware/validateToken';

const cors = require("cors");
const logger = require("morgan");

const app = express();

app.use(cors());

app.use(logger("dev"));

app.use(express.json());
//app.use(authenticateUser);

app.use("/api", routes);

export default app;
