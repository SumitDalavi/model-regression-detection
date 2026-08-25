import { getDb } from '../db/schema';
import { EvalRun } from '../types';

export interface RegressionReport {
  isRegression: boolean;
  degradedMetrics: { metric: string; previous: number; current: number; drop: number }[];
}

export async function detectRegression(currentRun: EvalRun, thresholdDrop: number = 0.05): Promise<RegressionReport> {
  const db = await getDb();

  // Get the most recent run BEFORE the current run (to establish a baseline)
  const res = db.exec(`
    SELECT factual_consistency, semantic_similarity, tone_formatting 
    FROM eval_runs 
    WHERE id != '${currentRun.id}' 
    ORDER BY timestamp DESC 
    LIMIT 1
  `);

  if (res.length === 0) {
    // No previous run to compare against
    return { isRegression: false, degradedMetrics: [] };
  }

  const prev = {
    factual_consistency: res[0].values[0][0] as number,
    semantic_similarity: res[0].values[0][1] as number,
    tone_formatting:     res[0].values[0][2] as number,
  };

  const current = currentRun.aggregate_scores;
  const degradedMetrics = [];

  const metrics: (keyof typeof current)[] = ['factual_consistency', 'semantic_similarity', 'tone_formatting'];

  for (const m of metrics) {
    const drop = prev[m] - current[m];
    if (drop >= thresholdDrop) {
      degradedMetrics.push({
        metric: m,
        previous: prev[m],
        current: current[m],
        drop,
      });
    }
  }

  return {
    isRegression: degradedMetrics.length > 0,
    degradedMetrics,
  };
}

export async function sendAlert(report: RegressionReport, run: EvalRun) {
  if (!report.isRegression) return;

  const msg = `🚨 *MODEL REGRESSION DETECTED* 🚨
Prompt Version: \`${run.prompt_version}\`
Model: \`${run.model_used}\`

Degraded Metrics:
${report.degradedMetrics.map(d => `- *${d.metric}*: dropped by ${(d.drop * 100).toFixed(1)}% (${(d.previous * 100).toFixed(1)}% -> ${(d.current * 100).toFixed(1)}%)`).join('\n')}

_Please revert the prompt/model change immediately._`;

  console.log("\n================ [SLACK ALERT MOCK] ================\n");
  console.log(msg);
  console.log("\n====================================================\n");

  // In production, this would be an HTTP POST to a Slack/Teams webhook
  /*
  await fetch(process.env.SLACK_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: msg })
  });
  */
}
