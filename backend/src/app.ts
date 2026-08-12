import express from "express";
import routes from "./routes/";
import { authenticateUser } from "./middleware/validateToken";
import morgan from "morgan";
import path from "path";

const cors = require("cors");

const app = express();

// Loggerit
app.use(morgan("dev"));

// CORS ja JSON
app.use(cors());
app.use(express.json());

// JWT-middleware API-reiteille
// API-reitit (aina ennen frontend-palvelua)

app.use("/api", authenticateUser, routes);


if (process.env.NODE_ENV !== "production") {
  
    const devRoutes = require("./routes/devRoutes").default;
    app.use("/dev", devRoutes);

}


// Palvelee frontendin buildin

const frontendPath =
  process.env.NODE_ENV === "production"
    ? path.join(__dirname, "frontend")
    : path.join(__dirname, "../../frontend/dist");


app.use(express.static(frontendPath));


// SPA fallback — kaikki muut reitit → index.html

app.get(/.*/, (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

export default app;
