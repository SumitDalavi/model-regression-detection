import { detectRegression, sendAlert } from '../src/alerts/detector';
import { getDb } from '../src/db/schema';
import { EvalRun } from '../src/types';

jest.mock('../src/db/schema', () => ({
  getDb: jest.fn(),
}));

describe('Regression Detector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createRun = (id: string, scores: any): EvalRun => ({
    id,
    timestamp: '2023-01-01T00:00:00Z',
    prompt_version: 'v2',
    model_used: 'test-model',
    aggregate_scores: scores,
    results: []
  });

  test('Should return no regression if there is no previous run', async () => {
    (getDb as jest.Mock).mockResolvedValue({
      exec: jest.fn().mockReturnValue([])
    });

    const run = createRun('run-1', { factual_consistency: 0.9, semantic_similarity: 0.9, tone_formatting: 0.9 });
    const result = await detectRegression(run);
    
    expect(result.isRegression).toBe(false);
    expect(result.degradedMetrics.length).toBe(0);
  });

  test('Should return no regression if drop is within threshold', async () => {
    (getDb as jest.Mock).mockResolvedValue({
      exec: jest.fn().mockReturnValue([{
        columns: ['factual_consistency', 'semantic_similarity', 'tone_formatting'],
        values: [[0.95, 0.90, 0.85]]
      }])
    });

    const run = createRun('run-2', { factual_consistency: 0.92, semantic_similarity: 0.88, tone_formatting: 0.82 });
    const result = await detectRegression(run, 0.05);
    
    expect(result.isRegression).toBe(false);
  });

  test('Should return regression if drop exceeds threshold on any metric', async () => {
    (getDb as jest.Mock).mockResolvedValue({
      exec: jest.fn().mockReturnValue([{
        columns: ['factual_consistency', 'semantic_similarity', 'tone_formatting'],
        values: [[0.95, 0.90, 0.85]]
      }])
    });

    const run = createRun('run-3', { factual_consistency: 0.85, semantic_similarity: 0.88, tone_formatting: 0.82 });
    const result = await detectRegression(run, 0.05);
    
    expect(result.isRegression).toBe(true);
    expect(result.degradedMetrics.length).toBe(1);
    expect(result.degradedMetrics[0].metric).toBe('factual_consistency');
    expect(result.degradedMetrics[0].drop).toBeCloseTo(0.10);
  });

  test('Should skip alert if no regression', async () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation();
    await sendAlert({ isRegression: false, degradedMetrics: [] }, createRun('run-1', {}));
    expect(logSpy).not.toHaveBeenCalled();
    logSpy.mockRestore();
  });

  test('Should send alert if regression', async () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation();
    await sendAlert({ 
      isRegression: true, 
      degradedMetrics: [{ metric: 'factual_consistency', previous: 0.95, current: 0.85, drop: 0.10 }] 
    }, createRun('run-1', {}));
    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });
});
