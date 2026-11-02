# Content status

Generated from the datasets on 2 November 2026. Regenerate after adding content:

```bash
node tools/validate.mjs   # prints the current authored/mapped counts
```

A chapter can be **mapped** (exists in `papers.json` with section, topics and indicative marks) without being **authored** (having a record in a knowledge file). Mapped-but-unauthored chapters are navigable and render an explicit empty state — no placeholder facts are invented.

## Summary

| Level | Mapped | Authored |
|---|---|---|
| Foundation | 41 | 41 |
| Intermediate Group I | 48 | 48 |
| Intermediate Group II | 42 | 18 |
| Final | 67 | 9 |
| **Total** | **198** | **116** |

## By paper

| Paper | Name | Level | Mapped | Authored | Status |
|---|---|---|---|---|---|
| 1 | Fundamentals of Business Laws and Business Communication | foundation | 12 | 12 | complete |
| 2 | Fundamentals of Financial and Cost Accounting | foundation | 12 | 12 | complete |
| 3 | Fundamentals of Business Mathematics and Statistics | foundation | 9 | 9 | complete |
| 4 | Fundamentals of Business Economics and Management | foundation | 8 | 8 | complete |
| 5 | Business Laws and Ethics | intermediate | 13 | 13 | complete |
| 6 | Financial Accounting | intermediate | 13 | 13 | complete |
| 7 | Direct and Indirect Taxation | intermediate | 10 | 10 | complete |
| 8 | Cost Accounting | intermediate | 12 | 12 | complete |
| 9 | Operations Management and Strategic Management | intermediate | 11 | 4 | partial |
| 10 | Corporate Accounting and Auditing | intermediate | 10 | 5 | partial |
| 11 | Financial Management and Business Data Analytics | intermediate | 11 | 5 | partial |
| 12 | Management Accounting | intermediate | 10 | 4 | partial |
| 13 | Corporate and Economic Laws | final | 10 | 1 | partial |
| 14 | Strategic Financial Management | final | 9 | 2 | partial |
| 15 | Direct Tax Laws and International Taxation | final | 9 | 1 | partial |
| 16 | Strategic Cost Management | final | 10 | 1 | partial |
| 17 | Cost and Management Audit | final | 9 | 1 | partial |
| 18 | Corporate Financial Reporting | final | 11 | 2 | partial |
| 19 | Indirect Tax Laws and Practice | final | 6 | 1 | partial |
| 20 | Elective Paper (20A / 20B / 20C) | final | 3 | 0 | mapped only |

## Unauthored chapters

### Paper 9 — Operations Management and Strategic Management

- `p09-c01` — Introduction to Operations Management (section A)
- `p09-c02` — Operations Planning (section A)
- `p09-c03` — Designing Operational Systems and Control (section A)
- `p09-c05` — Productivity Management and Quality Management (section A)
- `p09-c07` — Economics of Maintenance and Spares Management (section A)
- `p09-c08` — Introduction to Strategic Management (section B)
- `p09-c11` — Digital Strategy (section B)

### Paper 10 — Corporate Accounting and Auditing

- `p10-c04` — Accounts of Banking, Electricity and Insurance Companies (section A)
- `p10-c05` — Accounting Standards relevant to Companies (section A)
- `p10-c08` — Auditing of Different Types of Undertakings (section B)
- `p10-c09` — Audit Report, Certificates and Assurance (section B)
- `p10-c10` — Internal Control, Internal Audit and Audit Sampling (section B)

### Paper 11 — Financial Management and Business Data Analytics

- `p11-c01` — Fundamentals of Financial Management (section A)
- `p11-c02` — Institutions and Instruments in Financial Markets (section A)
- `p11-c07` — Financing Decisions of a Firm (section A)
- `p11-c09` — Data Processing, Organisation, Cleaning and Validation (section B)
- `p11-c10` — Data Presentation — Visualisation and Graphics (section B)
- `p11-c11` — Data Analysis and Modelling (section B)

### Paper 12 — Management Accounting

- `p12-c01` — Introduction to Management Accounting (section A)
- `p12-c02` — Activity Based Costing (section B)
- `p12-c06` — Standard Costing and Variance Analysis (section D)
- `p12-c07` — Forecasting, Budgeting and Budgetary Control (section E)
- `p12-c09` — Responsibility Accounting (section G)
- `p12-c10` — Decision Theory (section H)

### Paper 13 — Corporate and Economic Laws

- `p13-c01` — Companies Act, 2013 — Advanced (section A)
- `p13-c03` — Corporate Governance and Social Responsibility (section A)
- `p13-c04` — SEBI Act and Securities Regulation (section B)
- `p13-c05` — Competition Act, 2002 (section B)
- `p13-c06` — Foreign Exchange Management Act, 1999 (section B)
- `p13-c07` — Banking and Insurance Regulation (section B)
- `p13-c08` — MSME Development Act and Industrial Regulation (section B)
- `p13-c09` — Cyber Laws and IT Act, 2000 (section B)
- `p13-c10` — Prevention of Money Laundering and Anti-Corruption (section B)

### Paper 14 — Strategic Financial Management

- `p14-c01` — Advanced Investment Decisions (section A)
- `p14-c02` — Leasing, Hire Purchase and Project Finance (section A)
- `p14-c03` — Security Analysis (section B)
- `p14-c06` — Financial Risk Management (section C)
- `p14-c07` — International Financial Management (section D)
- `p14-c08` — Foreign Exchange Risk Management (section D)
- `p14-c09` — Digital Finance (section E)

### Paper 15 — Direct Tax Laws and International Taxation

- `p15-c01` — Assessment of Various Entities (section A)
- `p15-c02` — Corporate Taxation and Business Restructuring (section A)
- `p15-c03` — TDS, TCS, Advance Tax and Refunds (section A)
- `p15-c04` — Assessment, Appeals, Penalties and Offences (section A)
- `p15-c05` — Tax Planning, Avoidance and GAAR (section A)
- `p15-c06` — Income Computation and Disclosure Standards (section A)
- `p15-c07` — Double Taxation Avoidance Agreements (section B)
- `p15-c09` — BEPS, Equalisation Levy and International Cooperation (section B)

### Paper 16 — Strategic Cost Management

- `p16-c01` — Strategic Cost Management Framework (section A)
- `p16-c02` — Activity Based Management and Value Analysis (section A)
- `p16-c04` — Throughput and Lean Cost Management (section A)
- `p16-c05` — Pricing Decisions and Strategic Profitability (section A)
- `p16-c06` — Performance Measurement and Strategic Control (section A)
- `p16-c07` — Linear Programming and Optimisation (section B)
- `p16-c08` — Transportation and Assignment (section B)
- `p16-c09` — Queuing, Simulation and Decision Trees (section B)
- `p16-c10` — Project Management and Network Techniques (section B)

### Paper 17 — Cost and Management Audit

- `p17-c02` — Cost Audit Planning and Execution (section A)
- `p17-c03` — Cost Accounting Standards and Cost Audit Practice (section A)
- `p17-c04` — Management Audit (section B)
- `p17-c05` — Audit of Business Functions (section B)
- `p17-c06` — Internal Control and Internal Audit (section C)
- `p17-c07` — Operational Audit (section C)
- `p17-c08` — Forensic Audit (section D)
- `p17-c09` — Anti-Money Laundering and Compliance (section D)

### Paper 18 — Corporate Financial Reporting

- `p18-c01` — Ind AS Framework and Presentation (section A)
- `p18-c02` — Ind AS on Assets and Liabilities (section A)
- `p18-c03` — Ind AS on Revenue, Leases and Financial Instruments (section A)
- `p18-c04` — Valuation of Shares and Business Valuation (section B)
- `p18-c05` — NBFC Accounting and Reporting (section B)
- `p18-c07` — Corporate Restructuring (section C)
- `p18-c09` — Advanced Consolidation Issues (section D)
- `p18-c10` — Recent Developments in Financial Reporting (section E)
- `p18-c11` — Government Accounting in India (section F)

### Paper 19 — Indirect Tax Laws and Practice

- `p19-c01` — GST — Supply, Levy and Exemptions (section A)
- `p19-c03` — GST — Procedure, Returns and Assessments (section A)
- `p19-c04` — GST — Appeals, Offences and Advance Ruling (section A)
- `p19-c05` — Customs — Levy, Valuation and Procedures (section B)
- `p19-c06` — Customs — Duty Drawback, Refund and Litigation (section B)

### Paper 20 — Elective Paper (20A / 20B / 20C)

- `p20-c01` — 20A — Strategic Performance Management and Business Valuation (section A)
- `p20-c02` — 20B — Risk Management in Banking and Insurance (section A)
- `p20-c03` — 20C — Entrepreneurship and Startup (section A)

## Authoring convention

Every authored chapter record uses this shape (only `id` and `status` are required, but a chapter without substance should stay `outline`):

```json
{
  "id": "p06-c01",
  "status": "complete",
  "summary": "Two or three sentences on what the chapter is really testing.",
  "keyTerms": [{ "term": "Accrual concept", "definition": "…" }],
  "formulas": [{ "name": "…", "expression": "…", "note": "…", "example": "…" }],
  "examples": [{ "title": "…", "problem": "…", "solution": "…", "lesson": "…" }],
  "questions": [{
    "id": "p06-c01-q1", "q": "…", "type": "problem", "marks": 5,
    "difficulty": "medium", "answer": "worked answer", "tags": ["depreciation"]
  }],
  "revisionNotes": ["…"],
  "pitfalls": ["…"],
  "linkedConcepts": ["c-double-entry"]
}
```

Rules followed throughout:

1. **No invented statutory figures.** Rates, limits and thresholds are omitted or marked “verify current figure”.
2. **Answers are worked, not sketched.** A question without a usable answer does not ship.
3. **Concept links use ids from `data/concepts.json`.** The validator checks them.
4. **Question ids are globally unique** (`<chapter>-q<n>`).
5. **No ICMAI question papers are reproduced.** Questions are written for this system.

## Priority for the remaining work

1. Group II (P9–P12) — 24 chapters — because it is rank 2 after Group I.
2. Final (P13–P20) — 58 chapters — only once Intermediate is cleared, per the hierarchy.
3. Add question banks to chapters that are authored as outlines.
