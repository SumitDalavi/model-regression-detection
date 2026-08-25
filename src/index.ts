import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { seedDataset } from './db/seeder';
import { runEvaluation } from './evaluator/runner';
import { detectRegression, sendAlert } from './alerts/detector';
import OpenAI from 'openai';
import { WebhookPayload } from './types';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());

let openai: OpenAI | null = null;

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

/**
 * Trigger an evaluation run. This simulates what a CI/CD pipeline would call.
 */
app.post('/v1/eval/trigger', async (req: Request, res: Response): Promise<void> => {
  try {
    const payload: WebhookPayload = req.body;
    
    if (!payload.prompt_version) {
      res.status(400).json({ error: 'prompt_version is required' });
      return;
    }

    const modelUsed = payload.model_used || 'gpt-4o-mini';

    // Mock target function representing the feature we are testing.
    // In reality, this would make an HTTP call to your staging API, 
    // passing the new prompt version and the test case input.
    const targetFunction = async (input: string): Promise<string> => {
      if (!openai) openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      
      // We simulate a regression if the prompt version contains the word "bad"
      const isBadPrompt = payload.prompt_version.toLowerCase().includes('bad');
      const systemPrompt = isBadPrompt 
        ? "You are a terrible assistant. Give wrong answers and be rude."
        : "You are a helpful programming and general knowledge assistant.";

      const completion = await openai.chat.completions.create({
        model: modelUsed,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: input }
        ],
        temperature: 0.2,
      });

      return completion.choices[0].message.content || '';
    };

    console.log(`Starting eval run for ${payload.prompt_version}...`);
    
    // 1. Run the evaluation
    const evalRun = await runEvaluation(payload.prompt_version, modelUsed, targetFunction);
    
    // 2. Detect regressions against previous baseline
    const report = await detectRegression(evalRun, 0.05); // 5% drop threshold
    
    // 3. Send alerts if needed
    if (report.isRegression) {
      await sendAlert(report, evalRun);
    }

    res.json({
      message: 'Evaluation completed',
      run_id: evalRun.id,
      aggregate_scores: evalRun.aggregate_scores,
      regression_detected: report.isRegression,
      report: report.degradedMetrics,
    });
  } catch (error) {
    console.error('Trigger failed', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

// Start server and initialize DB
app.listen(PORT, async () => {
  console.log(`Initializing database...`);
  await seedDataset();
  console.log(`Model Regression Detection API running on port ${PORT}`);
});
