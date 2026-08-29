> **NOTE:** This repository is an archival lab or partial prototype. It is not actively maintained and should not be used as a reference for production-grade deployments or performance benchmarks.


# Model Regression Detection System

> **A CI/CD-style pipeline that continuously evaluates LLM-powered features against a golden dataset to detect quality regressions and alert your team before bad outputs reach users.**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20-green?logo=nodedotjs)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

---

## 🎯 The Problem This Solves

When deploying LLM applications, tweaking a system prompt or changing a model version (e.g., from `gpt-4o` to `gpt-4o-mini`) can have unintended butterfly effects. An "improvement" for one edge case often breaks three others. 

Standard software unit tests fail here because LLM outputs are non-deterministic and semantic. 

This system acts as a CI/CD integration. When a prompt changes, it runs a batch evaluation over a curated "Golden Dataset". It uses an LLM-as-a-judge (simulating frameworks like RAGAS or DeepEval) to score the new outputs on:
1. **Factual Consistency**
2. **Semantic Similarity**
3. **Tone and Formatting**

If the aggregate scores drop by a configurable threshold (e.g., > 5%) compared to the previous known-good baseline, the system instantly triggers an alert (mocked to Slack) and fails the pipeline.

## 🏗️ Architecture

- **Language**: TypeScript 5.3 + Node.js 20
- **Evaluator**: Custom LLM-as-a-judge using OpenAI `gpt-4o-mini` with JSON mode.
- **Database**: `sql.js` (SQLite compiled to WebAssembly) for robust, file-based persistence without native C++ compilation headaches.
- **API**: Express for receiving CI/CD webhook triggers.

## 🚀 Quick Start

### 1. Install & Configure
```bash
git clone https://github.com/SumitDalavi/model-regression-detection.git
cd model-regression-detection
npm install
```
Ensure you create a `.env` file containing your `OPENAI_API_KEY`.

### 2. Start the Server
```bash
npm run start
```
*On first boot, the SQLite database will initialize and populate a sample Golden Dataset.*

### 3. Trigger a Test Evaluation (Good Prompt)
```bash
curl -X POST http://localhost:3000/v1/eval/trigger \
     -H "Content-Type: application/json" \
     -d '{"prompt_version": "v1.0.0-stable", "model_used": "gpt-4o-mini"}'
```
*This establishes your baseline run in the database.*

### 4. Trigger a Regression (Bad Prompt)
```bash
curl -X POST http://localhost:3000/v1/eval/trigger \
     -H "Content-Type: application/json" \
     -d '{"prompt_version": "v1.1.0-bad-update", "model_used": "gpt-4o-mini"}'
```
*Because the prompt version contains "bad", the internal test mock will use an actively malicious system prompt. The LLM-as-a-judge will detect the plummeting factual consistency and trigger the Slack alert block!*

## 🧪 Tests

```bash
npm test
```
The test suite covers the mathematical thresholds of the regression detection engine, ensuring that drops correctly trigger alerts and ignore minor, expected variances.

## 👨‍💻 Author

**Sumit Dalavi** — Senior DevSecOps / Platform Engineer  
[GitHub](https://github.com/SumitDalavi) · [LinkedIn](https://in.linkedin.com/in/sumit-dalavi-762838129)


## CI & Reliability Updates (August 2026)

- **CI Pipeline Remediation:** Successfully resolved all CI/CD pipeline failures and established baseline CI workflows.
- **Specific Fix:** Added and configured robust GitHub Actions workflows for automated testing, linting, and formatting.
- **Status:** 🟩 Passing
