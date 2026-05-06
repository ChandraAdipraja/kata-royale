import "dotenv/config";
import cors from "cors";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import { connectDB } from "./config/db.js";
import passport from "./config/passport.js";
import authRoutes from "./routes/authRoutes.js";
import lobbyRoutes from "./routes/lobbyRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import { registerGameSocket } from "./sockets/gameSocket.js";

const app = express();
const server = http.createServer(app);

const defaultOrigins = ["http://localhost:5173", "http://127.0.0.1:5173"];

const envOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(",").map((origin) => origin.trim())
  : [];

const allowedOrigins = [...new Set([...defaultOrigins, ...envOrigins])];

const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`Origin ${origin} tidak diizinkan oleh CORS`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

const io = new Server(server, {
  cors: corsOptions,
  transports: ["websocket", "polling"],
});

app.set("io", io);

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json());
app.use(passport.initialize());

app.get("/", (_req, res) => {
  res.json({
    status: "ok",
    app: "Kata Royale API",
    message: "Backend is running",
  });
});

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    app: "SambungKata API",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/lobbies", lobbyRoutes);
app.use("/api/users", userRoutes);

registerGameSocket(io);

const start = async () => {
  await connectDB();

  const port = process.env.PORT || 5000;

  server.listen(port, "0.0.0.0", () => {
    console.log(`SambungKata API listening on port ${port}`);
    console.log("Allowed origins:", allowedOrigins);
  });
};

start().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
