import { isLiveOpenAIKey, detectMode } from '../src/credential-mode';
import { evaluateOutput } from '../src/evaluator/judge';
import { TestCase } from '../src/types';

describe('PCL Credential Mode & Judge Fallback', () => {
  const originalEnv = process.env.OPENAI_API_KEY;

  afterEach(() => {
    process.env.OPENAI_API_KEY = originalEnv;
  });

  test('isLiveOpenAIKey should correctly detect mock vs live', () => {
    expect(isLiveOpenAIKey(undefined)).toBe(false);
    expect(isLiveOpenAIKey('')).toBe(false);
    expect(isLiveOpenAIKey('sk-dummy-12345')).toBe(false);
    expect(isLiveOpenAIKey('sk-1234567890123456789012345')).toBe(true);
  });

  test('detectMode should report mock when key is missing or dummy', () => {
    delete process.env.OPENAI_API_KEY;
    expect(detectMode()).toEqual({ openai: 'mock', database: 'mock' });

    process.env.OPENAI_API_KEY = 'sk-dummy-val';
    expect(detectMode()).toEqual({ openai: 'mock', database: 'mock' });
  });

  test('evaluateOutput should return deterministic mock evaluation without crashing when key is absent', async () => {
    delete process.env.OPENAI_API_KEY;
    const testCase: TestCase = {
      id: 'tc-1',
      input: 'Translate hello',
      golden_output: 'Bonjour'
    };

    const resGood = await evaluateOutput(testCase, 'Bonjour');
    expect(resGood.scores.factual_consistency).toBe(0.9);
    expect(resGood.reasoning).toContain('[MOCK]');

    const resBad = await evaluateOutput(testCase, 'This is terrible, wrong answer');
    expect(resBad.scores.factual_consistency).toBe(0.1);
  });
});
