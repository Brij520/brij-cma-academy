# Sources and verification log

Every factual claim that can change — syllabus structure, exam dates, statutory positions, certification costs — records what it is based on and when it was checked. This file is the audit trail; the app surfaces the same dates in each dataset's `meta`.

## Verified 2 November 2026

| Claim | Source | How it is used |
|---|---|---|
| ICMAI Syllabus 2022 is the current curriculum; 20 papers across Foundation, Intermediate and Final; section-level marks weights; Final includes case studies; Paper 20 is an elective (20A/20B/20C) | ICMAI curriculum document (`icmai.co.in/upload/Students/Syllabus2022/Curriculum_2022.pdf`) | `data/academics/papers.json` — paper names, codes, sections and weights. Paper structure is confirmed; per-chapter mark splits are derived and labelled indicative. |
| December 2026 examinations: 10–17 December 2026, 14:00–17:00; Intermediate Group I on 10, 12, 14 and 16 December (Paper 5 on 10th, Paper 6 on 12th, Paper 7 on 14th, Paper 8 on 16th); results by 5 February 2027 | ICMAI timetable as reported by multiple exam-tracking sites | `data/exam-intel.json.examCalendar` and `data/priority.json.examWindows`, both carrying `verifiedOn` and a "verify against the official timetable" note. |
| Income-tax Act, 2025 (Act 30 of 2025) received assent on 21 August 2025 and is in force from 1 April 2026; it repeals the 1961 Act via s.536, but the 1961 Act continues to govern tax years up to FY 2025-26; "tax year" replaces previous year/assessment year; renumbered provisions (115BAC→202, 87A→156, 111A→196, 112A→198, 80C→123, 80CCD→124, 80D→126, 80E→129, 80G→133, TDS→393) | Commentary on the 2025 Act from tax publishers and law firms | `data/academics/knowledge/p07.json.amendmentWatch` and the Paper 7 chapter summaries. **No slab rates, rebate bands or monetary limits are encoded** — they are Finance-Act dependent and are marked "verify current figure". |

## Deliberately not encoded

| Item | Why |
|---|---|
| Income-tax slab rates, 87A rebate band, surcharge and cess rates | Change every Finance Act. Encoding them would make the system confidently wrong within a year. The chapter teaches the mechanism and tells you to verify the number. |
| HRA exemption percentages, perquisite valuations, CII tables | Same reason. `p07.json` frames such questions conditionally ("if CII is 376") so the method is examinable without asserting a current figure. |
| GST rate schedules | Rate rationalisation is frequent; the chapter teaches classification, time and place of supply, ITC mechanics and documentation instead of listing rates. |
| Certification fees | `certifications.json` records a **cost band** (`free`, `free-audit`, `low`, `moderate`, `high`, `variable`) plus a note and the official page. Every entry is `verifyBeforeUse: true`; the UI repeats the instruction. |
| ICMAI question papers and suggested answers | The Institute's intellectual property. Practice questions are written for this system; `exam-intel.json.meta.integrity.copyright` states the position. |

## Sources by module

- **Syllabus and papers** — ICMAI Syllabus 2022 curriculum and published chapter-weightage discussions for Intermediate and Final. Chapter *titles* follow the syllabus; chapter *marks* are the section weight split evenly and labelled indicative.
- **Financial reporting and accounting** — Ind AS / AS framework concepts and Schedule III presentation, taught at the level the syllabus requires. No standard is quoted as statutory text; the app labels formulas as teaching forms.
- **Cost and management accounting** — standard costing, marginal costing, CVP, relevant costing and decision rules; the formula database links each formula to the chapter that uses it.
- **Financial markets** — market structure, instruments and valuation concepts. Every market dataset carries the education-not-advice disclaimer and a rule against presenting simulated returns as indicative of future performance.
- **Data and AI** — tool capabilities and limitations, with a written guardrail per automation project (no confidential data, human review on output, evaluation before deployment).
- **Career and certification** — role expectations drawn from public job descriptions and professional-body syllabi, expressed as typical ranges. No salary figure is presented as a commitment.

## Maintenance rule

When you edit a dataset that contains a date, a rate or a legal position:

1. Update the value.
2. Update that file's `meta.lastReviewed`.
3. Add a line to the table above with the source and the date checked.
4. Run `node tools/validate.mjs`.

If you cannot name the source, do not encode the number.
