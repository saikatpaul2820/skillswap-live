import express from 'express';
import fs from 'fs';
import http from 'http';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import apiRouter from './server/routes.js';
import { signalingService } from './server/signaling.js';
import { db } from './server/db.js';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const server = http.createServer(app);

  // Initialize Database (connects to MongoDB Atlas if MONGODB_URI is provided, or local file)
  await db.initMongo();

  // Initialize real-time WebRTC signaling WebSocket server on /ws
  signalingService.init(server);

  // Body parsing middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'SkillSwap API',
      timestamp: new Date().toISOString()
    });
  });

  // REST API router
  app.use('/api', apiRouter);

  // Catch-all for undefined /api routes so they return JSON 404, never index.html
  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.method} ${req.originalUrl}` });
  });

  // Vite middleware for dev or static serving in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    // Fallback HTML handler for SPA in dev mode
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      // Never return HTML for API requests or WebSocket paths
      if (url.startsWith('/api') || url.startsWith('/ws')) {
        return res.status(404).json({ error: `Not found: ${url}` });
      }
      try {
        const indexPath = path.resolve(process.cwd(), 'index.html');
        let template = fs.readFileSync(indexPath, 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (err) {
        vite.ssrFixStacktrace(err as Error);
        next(err);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/ws')) {
        return res.status(404).json({ error: `Not found: ${req.originalUrl}` });
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Global Express error handler - always return JSON for API errors
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled Express error:', err);
    if (res.headersSent) {
      return next(err);
    }
    res.status(err.status || 500).json({
      error: err.message || 'Internal server error',
    });
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`SkillSwap Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();