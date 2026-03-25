import express from 'express';
import session from 'express-session';
import memoryStore from 'memorystore';
import { registerRoutes } from '../server/routes';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const MemoryStore = memoryStore(session);
app.use(session({
  store: new MemoryStore({ checkPeriod: 86400000 }),
  secret: process.env.SESSION_SECRET || "intuition_ai_dev_secret",
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === "production" }
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
  if (!routesReady) {
    await initPromise;
  }
  return app(req, res);
}
