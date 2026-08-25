import OpenAI from 'openai';
import { TestCase } from '../types';

let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

const EVAL_PROMPT = `You are an expert evaluator grading an LLM's response against a golden reference answer.
Compare the "Generated Output" to the "Golden Output" for the given "Input".

You must score the Generated Output on three criteria, each on a scale of 0.0 to 1.0 (where 1.0 is perfect):
1. factual_consistency: Does the generated output contradict the golden output in any way? (1.0 = no contradictions, 0.0 = completely contradictory).
2. semantic_similarity: Does the generated output convey the exact same core meaning and intent as the golden output?
3. tone_formatting: Does the generated output follow the same tone, brevity, and format as the golden output?

Provide a brief reasoning, and then return the scores in strict JSON format.

{
  "reasoning": "...",
  "scores": {
    "factual_consistency": 0.9,
    "semantic_similarity": 0.8,
    "tone_formatting": 1.0
  }
}
`;

export async function evaluateOutput(
  testCase: TestCase, 
  generatedOutput: string
): Promise<{ scores: { factual_consistency: number, semantic_similarity: number, tone_formatting: number }, reasoning: string }> {
  
  const userMessage = `Input: ${testCase.input}\n\nGolden Output: ${testCase.golden_output}\n\nGenerated Output: ${generatedOutput}`;

  try {
    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: EVAL_PROMPT },
        { role: 'user', content: userMessage }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error("Empty response from OpenAI");
    
    const parsed = JSON.parse(content);
    return {
      scores: parsed.scores,
      reasoning: parsed.reasoning
    };
  } catch (error) {
    console.error("Evaluation failed", error);
    // Fallback on failure
    return {
      scores: { factual_consistency: 0, semantic_similarity: 0, tone_formatting: 0 },
      reasoning: `Evaluation error: ${(error as Error).message}`
    };
  }
}
