import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT || 3001);
const CLINIC_ID = process.env.CLINIC_ID || 'c101-morumbi';

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Injeta clinic_id em todas as rotas da API
app.use('/api', (req, _res, next) => {
  (req as any).clinicId = CLINIC_ID;
  next();
});

// ── Rotas da API ──────────────────────────────────────────────
import clinicRouter    from './routes/clinic.js';
import usersRouter     from './routes/users.js';
import patientsRouter  from './routes/patients.js';
import appointmentsRouter from './routes/appointments.js';
import recordsRouter   from './routes/records.js';
import auditRouter     from './routes/audit.js';
import remindersRouter from './routes/reminders.js';
import templatesRouter from './routes/templates.js';
import financialRouter from './routes/financial.js';
import { ensureSchema } from './autoMigrate.js';

app.use('/api/clinic',       clinicRouter);
app.use('/api/users',        usersRouter);
app.use('/api/patients',     patientsRouter);
app.use('/api/appointments', appointmentsRouter);
app.use('/api/records',      recordsRouter);
app.use('/api/audit',        auditRouter);
app.use('/api/reminders',    remindersRouter);
app.use('/api/templates',    templatesRouter);
app.use('/api/financial',    financialRouter);

// Endpoint de verificação e disparo de migração/seed do banco
app.all('/api/migrate', async (req, res) => {
  try {
    const force = req.query.force === 'true';
    const result = await ensureSchema(force);
    res.json({
      status: result.error ? 'error' : 'ok',
      details: result,
      message: result.created
        ? 'Schema e seed inicial aplicados com sucesso!'
        : 'Banco de dados já estava inicializado.'
    });
  } catch (e: any) {
    res.status(500).json({ status: 'error', error: e.message });
  }
});

// Health check
app.get('/api/health', async (_req, res) => {
  try {
    const { pool } = await import('./db.js');
    await pool.query('SELECT 1');
    const { rows } = await pool.query("SELECT to_regclass('public.patients') as tbl");
    const schemaReady = Boolean(rows[0]?.tbl);
    res.json({
      status: 'ok',
      db: 'connected',
      schema: schemaReady ? 'ready' : 'pending_migration',
      clinic_id: CLINIC_ID
    });
  } catch (e: any) {
    res.status(503).json({ status: 'error', db: e.message });
  }
});

// ── Serve o frontend React ────────────────────────────────────
// Suporta dist tanto na raiz (/app/dist em produção) quanto no nível superior (../dist em dev com tsx)
const distDir = fs.existsSync(path.join(__dirname, 'dist'))
  ? path.join(__dirname, 'dist')
  : path.join(__dirname, '..', 'dist');

app.use(express.static(distDir));

// SPA fallback — qualquer rota não-API serve o index.html
app.get('*', (_req, res) => {
  const indexPath = path.join(distDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Página não encontrada ou build do frontend ausente.');
  }
});

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`✅ CliniFlow PEP rodando na porta ${PORT}`);
  console.log(`   CLINIC_ID: ${CLINIC_ID}`);
  console.log(`   DB: ${process.env.DATABASE_URL?.replace(/:([^:@]+)@/, ':****@') ?? 'não configurado'}`);

  // Auto-migra se as tabelas ainda não existirem no PostgreSQL
  try {
    const result = await ensureSchema();
    if (result.created) {
      console.log('🎉 Banco de dados auto-migrado e pronto para uso!');
    }
  } catch (err: any) {
    console.error('Falha ao auto-migrar banco de dados:', err?.message || err);
  }
});

// Em produção, se a porta principal for 80, escuta também na 3001 (ou vice-versa) para garantir compatibilidade com qualquer roteamento do Traefik/Coolify
const SECONDARY_PORT = PORT === 80 ? 3001 : (PORT === 3001 && process.env.NODE_ENV === 'production' ? 80 : null);
if (SECONDARY_PORT) {
  try {
    const s2 = app.listen(SECONDARY_PORT, '0.0.0.0', () => {
      console.log(`   (Porta secundária ativa: ${SECONDARY_PORT})`);
    });
    s2.on('error', () => {
      // Ignora erro se a porta secundária já estiver ocupada ou sem privilégios
    });
  } catch {
    // Ignora
  }
}
