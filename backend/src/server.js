import "dotenv/config";
import cors from "cors";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import lobbyRoutes from "./routes/lobbyRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import { registerGameSocket } from "./sockets/gameSocket.js";

const app = express();
const server = http.createServer(app);
const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
const allowedOrigins = new Set([clientUrl, "http://localhost:5173", "http://127.0.0.1:5173"]);
const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(new Error("Origin tidak diizinkan oleh CORS"));
  },
  credentials: true
};

const io = new Server(server, {
  cors: corsOptions
});

app.set("io", io);
app.use(cors(corsOptions));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok", app: "SambungKata API" }));
app.use("/api/auth", authRoutes);
app.use("/api/lobbies", lobbyRoutes);
app.use("/api/users", userRoutes);

registerGameSocket(io);

const start = async () => {
  await connectDB();
  const port = process.env.PORT || 5000;
  server.listen(port, () => console.log(`SambungKata API listening on ${port}`));
};

start().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
