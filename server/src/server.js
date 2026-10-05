import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import connectDB from "./config/database.js";
import User from "./models/User.js";

dotenv.config();

connectDB();

const app = express();

const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.send("ConnectCord backend is running!");
});

app.get("/api/hello", (req, res) => {
  res.json({
    message: "Hello React! This message came from Express.",
  });
});

app.post("/api/users", async (req, res) => {
  const { username, email, password } = req.body;

  const user = await User.create({
    username,
    email,
    password,
  });

  res.json(user);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});