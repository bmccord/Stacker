import pino from 'pino';
import path from 'path';
import fs from 'fs';

const LOG_DIR = process.env.LOG_DIR ?? path.join(process.cwd(), 'logs');
const LOG_LEVEL = process.env.LOG_LEVEL ?? 'info';
const IS_DEV = process.env.NODE_ENV !== 'production';

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

function resolveModule(name: string): string {
  try {
    return require.resolve(name);
  } catch {
    return name;
  }
}

const targets: pino.TransportTargetOptions[] = [
  // Console output — pretty in dev, JSON in production
  {
    target: IS_DEV ? resolveModule('pino-pretty') : 'pino/file',
    options: IS_DEV ? { colorize: true } : { destination: 1 },
    level: LOG_LEVEL,
  },
  // Rotating log file — 10MB per file, keep 14 files (140MB max)
  {
    target: resolveModule('pino-roll'),
    options: {
      file: path.join(LOG_DIR, 'app.log'),
      size: '10m',
      limit: { count: 14 },
    },
    level: LOG_LEVEL,
  },
];

const transports = pino.transport({ targets });

export const logger = pino({ level: LOG_LEVEL }, transports);

/**
 * Read log entries from the log file, with optional filtering.
 * Returns the most recent entries first.
 */
export function readLogs(options: {
  limit?: number;
  offset?: number;
  level?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}): { entries: LogEntry[]; total: number } {
  const { limit = 100, offset = 0, level, search, startDate, endDate } = options;

  // Read all log files and merge entries
  const logFiles = fs.readdirSync(LOG_DIR)
    .filter(f => f.startsWith('app.') && f.endsWith('.log'))
    .sort()
    .reverse();

  const allEntries: LogEntry[] = [];

  for (const file of logFiles) {
    const filePath = path.join(LOG_DIR, file);
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.trim().split('\n').filter(Boolean);
      for (const line of lines) {
        try {
          const entry = JSON.parse(line) as LogEntry;
          allEntries.push(entry);
        } catch {
          // Skip malformed lines
        }
      }
    } catch {
      // Skip unreadable files
    }
  }

  // Sort by timestamp descending (most recent first)
  allEntries.sort((a, b) => {
    const ta = new Date(a.time).getTime();
    const tb = new Date(b.time).getTime();
    return tb - ta;
  });

  // Apply filters
  let filtered = allEntries;

  if (level) {
    const levelNum = pino.levels.values[level] ?? 30;
    filtered = filtered.filter(e => e.level >= levelNum);
  }

  if (search) {
    const searchLower = search.toLowerCase();
    filtered = filtered.filter(e =>
      e.msg?.toLowerCase().includes(searchLower) ||
      JSON.stringify(e).toLowerCase().includes(searchLower)
    );
  }

  if (startDate) {
    const start = new Date(startDate).getTime();
    filtered = filtered.filter(e => new Date(e.time).getTime() >= start);
  }

  if (endDate) {
    const end = new Date(endDate).getTime();
    filtered = filtered.filter(e => new Date(e.time).getTime() <= end);
  }

  const total = filtered.length;
  const entries = filtered.slice(offset, offset + limit);

  return { entries, total };
}

export interface LogEntry {
  level: number;
  time: string;
  msg: string;
  [key: string]: unknown;
}

/** Convert pino numeric level to label */
export function levelLabel(level: number): string {
  if (level <= 10) return 'trace';
  if (level <= 20) return 'debug';
  if (level <= 30) return 'info';
  if (level <= 40) return 'warn';
  if (level <= 50) return 'error';
  return 'fatal';
}

export const LOG_LEVELS = ['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent'] as const;
