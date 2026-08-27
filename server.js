import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3050;

app.use(express.json());

// API Health Endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    app: 'SmritiNER - Cognitive Therapeutics Platform',
    timestamp: new Date().toISOString(),
    port: PORT,
  });
});

// Serve Static Assets
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath, {
  maxAge: '1d',
  immutable: true,
}));

// SPA Fallback to index.html
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[SmritiNER] Server listening on http://0.0.0.0:${PORT}`);
});
