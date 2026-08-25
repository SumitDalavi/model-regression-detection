export interface TestCase {
  id: string;
  input: string;
  golden_output: string;
  metadata?: Record<string, any>;
}

export interface EvalResult {
  test_case_id: string;
  generated_output: string;
  scores: {
    factual_consistency: number; // 0.0 to 1.0
    semantic_similarity: number; // 0.0 to 1.0
    tone_formatting: number;     // 0.0 to 1.0
  };
  reasoning: string;
}

export interface EvalRun {
  id: string;
  timestamp: string;
  prompt_version: string;
  model_used: string;
  aggregate_scores: {
    factual_consistency: number;
    semantic_similarity: number;
    tone_formatting: number;
  };
  results: EvalResult[];
}

export interface WebhookPayload {
  prompt_version: string;
  model_used?: string;
  trigger_reason?: string;
}
