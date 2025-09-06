import "dotenv/config";
import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";

// Import modularized components
import authRoutes from "./src/routes/auth";
import syncRoutes from "./src/routes/sync";
import jobRoutes from "./src/routes/jobs";
import { backgroundJobService } from "./src/services/backgroundJobService";
import { errorHandler } from "./src/middleware/errorHandler";

// Environment variables validation
const port = process.env.PORT || 3000;

const app: Application = express();

// CORS configuration for mobile app
app.use(
  cors({
    origin: true, // Allow all origins during development
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(
    `${new Date().toISOString()} - ${req.method} ${req.url} - IP: ${req.ip}`
  );
  next();
});

app.get("/", (req: Request, res: Response) => {
  res.send("Let's rock!");
});

// Use modularized routes
app.use("/auth", authRoutes);
app.use("/api/sync", syncRoutes);
app.use("/api/jobs", jobRoutes);

// Error handling middleware (should be last)
app.use(errorHandler);

app.listen(port, () => {
  console.log(`app listening on port ${port}`);

  // Start the background job processor
  console.log("🚀 Starting background job processor...");
  backgroundJobService.startProcessor();
});
