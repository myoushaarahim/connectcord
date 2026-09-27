import express from "express";
import cors from "cors";

const app = express();

const PORT = 5000;

app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

app.get("/", (req, res) => {
  res.send("ConnectCord backend is running!");
});

app.get("/api/hello", (req, res) => {
  res.json({
    message: "Hello React! This message came from Express.",
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});