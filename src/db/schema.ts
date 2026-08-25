import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';

const DB_FILE = path.join(process.cwd(), 'regression_eval.sqlite');

let dbInstance: any = null;

export async function getDb() {
  if (dbInstance) return dbInstance;

  const SQL = await initSqlJs();
  
  if (fs.existsSync(DB_FILE)) {
    const filebuffer = fs.readFileSync(DB_FILE);
    dbInstance = new SQL.Database(filebuffer);
  } else {
    dbInstance = new SQL.Database();
  }

  // Initialize schema
  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS golden_datasets (
      id TEXT PRIMARY KEY,
      input TEXT NOT NULL,
      golden_output TEXT NOT NULL,
      metadata TEXT
    );

    CREATE TABLE IF NOT EXISTS eval_runs (
      id TEXT PRIMARY KEY,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      prompt_version TEXT NOT NULL,
      model_used TEXT NOT NULL,
      factual_consistency REAL,
      semantic_similarity REAL,
      tone_formatting REAL
    );

    CREATE TABLE IF NOT EXISTS eval_results (
      id TEXT PRIMARY KEY,
      run_id TEXT,
      test_case_id TEXT,
      generated_output TEXT NOT NULL,
      factual_consistency REAL,
      semantic_similarity REAL,
      tone_formatting REAL,
      reasoning TEXT,
      FOREIGN KEY(run_id) REFERENCES eval_runs(id),
      FOREIGN KEY(test_case_id) REFERENCES golden_datasets(id)
    );
  `);

  return dbInstance;
}

export async function saveDb() {
  if (!dbInstance) return;
  const data = dbInstance.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_FILE, buffer);
}
