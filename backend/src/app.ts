import express from "express";
import routes from "./routes/";
import {authenticateUser} from './middleware/validateToken';


const cors = require("cors");
//const logger = require("morgan");
import morgan from "morgan";



// ...

const app = express();

app.use((req, res, next) => {
  console.log(">>> REQUEST HIT:", req.method, req.url);
  next();
});

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});


app.use(morgan("dev"));
//app.use(logger("dev"));


app.use(cors());

app.use(express.json());

app.use(authenticateUser);

app.use("/api", routes);

export default app;



