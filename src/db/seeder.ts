import { v4 as uuidv4 } from 'uuid';
import { getDb, saveDb } from './schema';
import { TestCase } from '../types';

const INITIAL_DATASET: Omit<TestCase, 'id'>[] = [
  {
    input: "Explain the difference between mutable and immutable objects in Python.",
    golden_output: "Mutable objects can be changed after they are created (e.g., lists, dictionaries, sets), while immutable objects cannot be changed (e.g., strings, tuples, integers). Modifying an immutable object creates a new object in memory.",
    metadata: { category: "python", difficulty: "easy" }
  },
  {
    input: "What is the capital of Australia?",
    golden_output: "The capital of Australia is Canberra.",
    metadata: { category: "geography", difficulty: "easy" }
  },
  {
    input: "Write a SQL query to find the second highest salary from an Employee table.",
    golden_output: "SELECT MAX(salary) FROM Employee WHERE salary < (SELECT MAX(salary) FROM Employee);",
    metadata: { category: "sql", difficulty: "medium" }
  }
];

export async function seedDataset() {
  const db = await getDb();
  
  // Check if dataset exists
  const res = db.exec(`SELECT COUNT(*) as count FROM golden_datasets`);
  if (res[0].values[0][0] > 0) {
    return; // Already seeded
  }

  const stmt = db.prepare(`INSERT INTO golden_datasets (id, input, golden_output, metadata) VALUES (?, ?, ?, ?)`);
  
  for (const tc of INITIAL_DATASET) {
    stmt.run([uuidv4(), tc.input, tc.golden_output, JSON.stringify(tc.metadata)]);
  }
  stmt.free();

  await saveDb();
}

export async function getGoldenDataset(): Promise<TestCase[]> {
  const db = await getDb();
  const res = db.exec(`SELECT id, input, golden_output, metadata FROM golden_datasets`);
  
  if (res.length === 0) return [];

  return res[0].values.map((row: any) => ({
    id: row[0],
    input: row[1],
    golden_output: row[2],
    metadata: JSON.parse(row[3])
  }));
}
