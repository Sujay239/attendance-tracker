import express from 'express';
import cors from 'cors';
import { apiRouter } from './routes';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    app: 'Attendance & Time Balance Tracker',
    author: 'sujay kumar kotal',
    timestamp: new Date().toISOString(),
  });
});

// Mount API routes
app.use('/api', apiRouter);

export const server = app.listen(PORT, () => {
  console.log(`[TimeTrack API] Running at http://localhost:${PORT}/api`);
});

export default app;
