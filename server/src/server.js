import express from "express";
import { createServer } from "node:http";
import { attachSocketServer } from "./socket/socketServer.js";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import workspaceRoutes from "./routes/workspaceRoutes.js";
import channelRoutes from "./routes/channelRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import connectDB from "./config/database.js";

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = attachSocketServer(httpServer);
app.set("io", io);
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  })
);
app.use(express.json({ limit: "1mb" }));

app.get("/", (req, res) => {
  res.send("ConnectCord backend is running!");
});

app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello React! This message came from Express." });
});

app.use("/api/auth", authRoutes);
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/workspaces/:workspaceId/channels", channelRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/events", eventRoutes);

const startServer = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing. Add it to server/.env.");
    }

    await connectDB();
    httpServer.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Unable to start ConnectCord backend:", error.message);
    process.exit(1);
  }
};

startServer();
