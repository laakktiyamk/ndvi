"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const routes_1 = __importDefault(require("./routes/"));
const validateToken_1 = require("./middleware/validateToken");
const morgan_1 = __importDefault(require("morgan"));
const cors = require("cors");
const app = (0, express_1.default)();
// Loggerit
app.use((0, morgan_1.default)("dev"));
// CORS ja JSON
app.use(cors());
app.use(express_1.default.json());
// JWT-middleware API-reiteille
// API-reitit (aina ennen frontend-palvelua)
app.use("/api", validateToken_1.authenticateUser, routes_1.default);
if (process.env.NODE_ENV !== "production") {
    const devRoutes = require("./routes/devRoutes").default;
    app.use("/dev", devRoutes);
}
// Palvelee frontendin buildin
/*
const frontendPath =
  process.env.NODE_ENV === "production"
    ? path.join(__dirname, "frontend")
    : path.join(__dirname, "../../frontend/dist");


app.use(express.static(frontendPath));
*/
// SPA fallback — kaikki muut reitit → index.html
//app.get(/.*/, (req, res) => {
//  res.sendFile(path.join(frontendPath, "index.html"));
//});
exports.default = app;
