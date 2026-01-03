import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import db from "./db"; // Knex instance - ONLY database abstraction used

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Routes
app.get("/health", (_req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

// Verify DB connectivity and start server
db.raw("select 1")
  .then(() => {
    console.log("✅ Database connected successfully");

    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("❌ Error during DB initialization:", error);
    process.exit(1);
  });
