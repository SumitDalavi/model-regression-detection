import { v4 as uuidv4 } from 'uuid';
import { getGoldenDataset } from '../db/seeder';
import { getDb, saveDb } from '../db/schema';
import { evaluateOutput } from './judge';
import { EvalResult, EvalRun } from '../types';

export async function runEvaluation(promptVersion: string, modelUsed: string, generateOutputFn: (input: string) => Promise<string>): Promise<EvalRun> {
  const dataset = await getGoldenDataset();
  if (dataset.length === 0) {
    throw new Error("Dataset is empty. Run seeder first.");
  }

  const results: EvalResult[] = [];
  let totalFact = 0;
  let totalSem = 0;
  let totalTone = 0;

  for (const tc of dataset) {
    // Generate output using the target model/prompt
    const generated = await generateOutputFn(tc.input);
    
    // Evaluate it
    const evalData = await evaluateOutput(tc, generated);
    
    totalFact += evalData.scores.factual_consistency;
    totalSem += evalData.scores.semantic_similarity;
    totalTone += evalData.scores.tone_formatting;

    results.push({
      test_case_id: tc.id,
      generated_output: generated,
      scores: evalData.scores,
      reasoning: evalData.reasoning
    });
  }

  const runId = uuidv4();
  const aggregateScores = {
    factual_consistency: totalFact / dataset.length,
    semantic_similarity: totalSem / dataset.length,
    tone_formatting: totalTone / dataset.length,
  };

  const evalRun: EvalRun = {
    id: runId,
    timestamp: new Date().toISOString(),
    prompt_version: promptVersion,
    model_used: modelUsed,
    aggregate_scores: aggregateScores,
    results
  };

  // Save to DB
  const db = await getDb();
  
  const runStmt = db.prepare(`INSERT INTO eval_runs (id, timestamp, prompt_version, model_used, factual_consistency, semantic_similarity, tone_formatting) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  runStmt.run([
    runId, 
    evalRun.timestamp, 
    promptVersion, 
    modelUsed, 
    aggregateScores.factual_consistency,
    aggregateScores.semantic_similarity,
    aggregateScores.tone_formatting
  ]);
  runStmt.free();

  const resStmt = db.prepare(`INSERT INTO eval_results (id, run_id, test_case_id, generated_output, factual_consistency, semantic_similarity, tone_formatting, reasoning) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  for (const r of results) {
    resStmt.run([
      uuidv4(),
      runId,
      r.test_case_id,
      r.generated_output,
      r.scores.factual_consistency,
      r.scores.semantic_similarity,
      r.scores.tone_formatting,
      r.reasoning
    ]);
  }
  resStmt.free();

  await saveDb();

  return evalRun;
}
