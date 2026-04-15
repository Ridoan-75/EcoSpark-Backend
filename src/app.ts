import express, { Application, Request, Response } from "express";
import cors from "cors";
import globalErrorHandler from "./errors/globalErrorHandler";
import router from "./routes";

const app: Application = express();

// ── Stripe Webhook — সবার আগে raw body ──────────────
app.use(
  "/api/payments/webhook",
  express.raw({ type: "application/json" })
);

// ── CORS — এটা সবার আগে রাখো ────────────────────────
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

// ── Regular Middlewares ───────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Health check ──────────────────────────────────────
app.get("/", (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "EcoSpark Hub API is running 🌿",
  });
});

// ── All Routes ────────────────────────────────────────
app.use("/api", router);

// ── 404 Handler ───────────────────────────────────────
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// ── Global Error Handler ──────────────────────────────
app.use(globalErrorHandler);

export default app;