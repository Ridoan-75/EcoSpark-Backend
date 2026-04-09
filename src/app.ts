import express, { Application, Request, Response } from "express";
import cors from "cors";
import globalErrorHandler from "./errors/globalErrorHandler";
import router from "./routes";

const app: Application = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Health check
app.get("/", (req: Request, res: Response) => {
  res.json({ success: true, message: "EcoSpark Hub API is running 🌿" });
});

// All routes
app.use("/api", router);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Global error handler
app.use(globalErrorHandler);

export default app;