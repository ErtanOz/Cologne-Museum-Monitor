import cors from 'cors';
import express from 'express';
import { SERVER_PORT } from './config';
import { syncService } from './syncService';
import { RefreshReason } from '../types';

const app = express();

app.use(cors());
app.use(express.json());

const parseReason = (value: unknown): RefreshReason => {
  if (value === 'manual' || value === 'page_load' || value === 'daily') {
    return value;
  }

  return 'manual';
};

app.get('/api/health', async (_req, res) => {
  const latest = await syncService.getLatest();
  res.json({ ok: true, lastSyncAt: latest.updatedAt, provider: latest.diagnostics.provider });
});

app.get('/api/museums', async (_req, res) => {
  try {
    const latest = await syncService.getLatest();
    res.json({
      data: latest.data,
      diagnostics: latest.diagnostics,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ message });
  }
});

app.get('/api/museums/history', async (req, res) => {
  try {
    const days = Number(req.query.days ?? 365);
    const history = await syncService.getHistory(Number.isFinite(days) ? days : 365);
    res.json({ history });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ message });
  }
});

app.post('/api/museums/refresh', async (req, res) => {
  try {
    const reason = parseReason(req.query.reason ?? req.body?.reason);
    const force = reason === 'manual' || req.query.force === 'true' || req.body?.force === true;
    const result = await syncService.refresh({ reason, force });

    res.json({
      data: result.data,
      diagnostics: result.diagnostics,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ message });
  }
});

app.listen(SERVER_PORT, () => {
  console.log(`[museum-api] listening on http://localhost:${SERVER_PORT}`);
});
