import fs from 'fs';
import path from 'path';
import { DB } from '@/types';

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

export function readDb(): DB {
  if (!fs.existsSync(DB_PATH)) {
    const empty: DB = { users: [], quizzes: [], attempts: [] };
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(empty, null, 2));
    return empty;
  }
  const parsed = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
  return {
    users: parsed.users ?? [],
    quizzes: parsed.quizzes ?? [],
    attempts: parsed.attempts ?? [],
  };
}

export function writeDb(db: DB) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}
