import express from 'express';
import cookieSession from 'cookie-session';
import { registerRoutes } from '../server/routes.js';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Initialize cookie-based session for stateless Vercel environments
app.use(cookieSession({
  name: 'session',
  keys: [process.env.SESSION_SECRET || "intuition_ai_dev_secret"],
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  secure: process.env.NODE_ENV === "production"
}));

// Ensure routes are registered before handling any requests
let routesReady = false;
let initPromise = registerRoutes(app).then(() => {
  routesReady = true;
  
  // Custom error handler (must be registered after routes)
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });
});

export default async function handler(req: express.Request, res: express.Response) {
  try {
    if (!routesReady) {
      await initPromise;
    }
    return app(req, res);
  } catch (error: any) {
    console.error("Vercel Runtime Exception:", error);
    res.status(500).json({ 
      error: "Vercel Runtime Exception", 
      message: error.message, 
      stack: error.stack 
    });
  }
}
