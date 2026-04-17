// Main application setup and configuration
import express, { Application, Request, Response } from "express";
import cors from "cors";
import globalErrorHandler from "./errors/globalErrorHandler";
import router from "./routes";

const app: Application = express();

// Stripe Webhook - Handle raw body before other middlewares
app.use(
  "/api/payments/webhook",
  express.raw({ type: "application/json" })
);

// CORS Configuration - Allow cross-origin requests from specified origins
app.use(
  cors({
    origin: [
      "https://ecospark-frontend-gules.vercel.app",
      "http://localhost:3000"
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Regular Middlewares - Parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Route - Basic endpoint to verify API is running
app.get("/", (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "EcoSpark Hub API is running 🌿",
  });
});

// All Routes - Mount the main API router
app.use("/api", router);

// 404 Handler - Handle requests to non-existent routes
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Global Error Handler - Catch and handle all errors
app.use(globalErrorHandler);

export default app;