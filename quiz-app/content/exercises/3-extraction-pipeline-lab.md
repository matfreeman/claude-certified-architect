---
id: "exercise-3"
title: "Build a Structured Data Extraction Pipeline"
minutes: 50
domains: [4, 5]
taskStatements: ["4.2", "4.3", "4.4", "4.5", "5.5"]
prerequisites: ["0.0", "4.2", "4.3", "4.4", "4.5", "5.5"]
deliverables:
  - "A tool schema with required, optional, nullable, and enum-plus-other fields"
  - "A validation and retry loop with explicit feedback"
  - "A batch-processing design using custom_id correlation"
  - "A human review plan using calibrated confidence signals"
concepts: [structured output, few-shot prompting, validation retry, batches API, confidence calibration]
docLinks:
  - text: "Tool use overview"
    url: "https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview"
  - text: "Batch processing"
    url: "https://platform.claude.com/docs/en/build-with-claude/batch-processing"
  - text: "Prompt engineering overview"
    url: "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview"
completionMode: "self_attest"
---

## Goal

Design an extraction workflow that produces reliable structured outputs at scale and routes uncertain cases to human review.

## Why this matters for the exam

This lab bundles together several exam themes that are easy to know individually but harder to combine in practice:

- when to force tool use
- how schemas prevent syntax failures but not semantic failures
- how retry loops and human review complement each other
- when batch processing is appropriate

## Recommended scenario

Use invoices, forms, policy documents, or structured research notes. The specific source material matters less than the pipeline behavior.

## Suggested steps

1. Define an extraction tool schema with:
   - required fields
   - nullable fields
   - an enum with an `other` branch plus detail text
2. Add few-shot examples for structurally varied inputs.
3. Implement semantic validation checks beyond schema correctness.
4. On validation failure, retry with the failed extraction and precise error feedback.
5. Design a batch-processing workflow that uses `custom_id` for result correlation.
6. Add a human review strategy using field-level or record-level confidence plus sampling.

## Deliverables

- Tool schema
- One example retry payload or retry prompt
- A batch design showing submission, polling, and failure recovery
- A review-routing policy

## Self-review checklist

- Can the schema express "missing" honestly without hallucination?
- Are validation failures fed back specifically enough for correction?
- Are you using the Batches API only for latency-tolerant work?
- Does your review policy account for systematic high-confidence errors?
- Is the extraction flow deterministic where it needs to be?

## Related domains

- Domain 4: few-shot prompting, structured outputs, validation loops, batch processing
- Domain 5: human review and confidence calibration
