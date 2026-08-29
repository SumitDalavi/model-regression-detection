# Architecture: Model Regression Detection System
> Maturity: Full Prototype

## System Diagram
The following Mermaid.js sequence diagram maps the core workflow and interactions:

```mermaid
sequenceDiagram
Developer->>GitHub: Push prompt change
GitHub->>Action: Trigger eval
Action->>EvalEngine: Run golden dataset
EvalEngine->>Model: Query
EvalEngine->>Slack: Alert if regression > 3%
```

## Component Breakdown
- **Core Technology**: Python, RAGAS, DeepEval, SQLite
- **Design Paradigm**: Emphasizes high availability, fault tolerance, and security.
