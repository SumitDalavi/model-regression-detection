# Model Regression Detection System

[![CI Pipeline](https://github.com/SumitDalavi/model-regression-detection/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/SumitDalavi/model-regression-detection/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/SumitDalavi/model-regression-detection?color=0969da&label=release&logo=github)](https://github.com/SumitDalavi/model-regression-detection/releases)
[![Release Workflow](https://github.com/SumitDalavi/model-regression-detection/actions/workflows/release.yml/badge.svg)](https://github.com/SumitDalavi/model-regression-detection/actions/workflows/release.yml)
[![GHCR Container](https://img.shields.io/badge/ghcr.io-v0.2.0-blue?logo=docker&logoColor=white)](https://github.com/SumitDalavi/model-regression-detection/pkgs/container/model-regression-detection)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)](https://www.python.org)
[![SBOM](https://img.shields.io/badge/SBOM-SPDX%202.3-blueviolet?logo=spdx)](https://github.com/SumitDalavi/model-regression-detection/releases/tag/v0.2.0)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

> **A CI/CD-style pipeline that continuously evaluates LLM-powered features against a golden dataset to detect quality regressions and alert your team before bad outputs reach users.**

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

## 🔒 Release & Security Verification

The project includes an automated DevSecOps release pipeline (`.github/workflows/release.yml`) triggered on semantic version tags (`v*.*.*`).

Each release automatically:
1. Executes test suite gates.
2. Builds the container image.
3. Performs vulnerability scanning via Trivy.
4. Generates an SPDX SBOM (`sbom.spdx.json`) using Anchore Syft.
5. Publishes a GitHub Release with attached SBOM.

### Verifying the Release
```bash
# Verify release via GitHub CLI
gh release view v0.2.0 --repo SumitDalavi/model-regression-detection

# Download and inspect SBOM
gh release download v0.2.0 --repo SumitDalavi/model-regression-detection --pattern "sbom.spdx.json"
cat sbom.spdx.json | jq .
```

## 🚀 Progressive Credential Loading & Execution Tiers

This project implements **Progressive Credential Loading (PCL)**, allowing it to run immediately out-of-the-box without external dependencies while seamlessly upgrading as credentials are provided.

### Tier 1: Zero-Config Mock Mode (Default)
Ideal for CI, testing, and rapid local evaluation.
- **Execution:** Run with default configuration (`cp .env.example .env`). Zero API keys, databases, or cloud credentials required.
- **Fallback Behavior:** In-memory caches, deterministic offline heuristics, mock vector embeddings, and local mock storage are automatically used.
- **Health Verification:** Endpoints report `{"mode": "mock"}` for unconfigured dependencies.

### Tier 2: Local Development with Live Services
Connect specific external services while keeping others mocked.
- **Execution:** Provide credentials in `.env` for the services you want active (e.g., `OPENAI_API_KEY`).
- **Progressive Upgrade:** The runtime inspects environment variables on boot and dynamically promotes only configured modules to live mode.
- **Safe Fallback:** Any missing credentials automatically remain on mock fallbacks with no crashes or missing service errors.

### Tier 3: Production Hardened
Enterprise deployment with production-grade backends, security scans, and container distributions.
- **OCI Container Image:** Pre-built, multi-arch image on GitHub Container Registry:
  ```bash
  docker pull ghcr.io/sumitdalavi/model-regression-detection:v0.2.0
  ```
- **Production Orchestration:** Mount secrets via Kubernetes Secrets or cloud secret managers with atomic config reload support.
- **Release Verification:** Checksums and SPDX SBOM available on [GitHub Releases](https://github.com/SumitDalavi/model-regression-detection/releases).

## 📚 Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Runbook](docs/runbook.md)
- [Decisions](docs/decisions.md)
- [Changelog](docs/changelog.md)

## 👨‍💻 Author

**Sumit Dalavi** — Senior DevSecOps / Platform Engineer  
[GitHub](https://github.com/SumitDalavi) · [LinkedIn](https://in.linkedin.com/in/sumit-dalavi-762838129)

---
*Built with a focus on robust patterns, not toy demos.*
