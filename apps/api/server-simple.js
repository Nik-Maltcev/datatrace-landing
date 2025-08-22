const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Health checks
app.get('/health', (_req, res) => {
  res.status(200).send('OK');
});

app.get('/api/health', (_req, res) => {
  res.status(200).json({ 
    ok: true, 
    version: '2.0', 
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

app.get('/', (_req, res) => {
  res.status(200).json({ 
    message: 'DataTrace API Server', 
    status: 'running',
    version: '2.0'
  });
});

// Простой тестовый endpoint
app.post('/api/test', (req, res) => {
  res.json({ message: 'Test endpoint working', data: req.body });
});

// Запуск сервера
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Simple server running on http://0.0.0.0:${PORT}`);
  console.log(`🏥 Health check: http://0.0.0.0:${PORT}/health`);
});
