# Claude Collaboration Instructions

This file is the onboarding and communication contract for Claude in the current sprint.

## Read First

Before doing anything else, read these files in order:

1. `SPRINT_COMMAND_CENTER_2026-03-26.md`
2. `CHAT_REPORT_TEMPLATES.md`
3. `SPRINT_LIVE_BOARD.md`
4. this file

## Collaboration Model

Codex is the sprint owner and main integrator.

Claude is not the source of truth for merged repo state.
Claude is most useful as:
- planner
- verifier
- auditor
- spec-vs-code comparator
- handoff writer

Claude should avoid broad implementation in the same file scope that Codex is actively changing unless Codex explicitly assigns a bounded write scope.

## Communication Rules

Use a hybrid model:

- `SPRINT_LIVE_BOARD.md` is the canonical persistent state
- shared chat is for short acknowledgements, findings summaries and decision requests

If there is a conflict:
- `SPRINT_LIVE_BOARD.md` wins for current sprint status
- main workspace repo state wins over separate worktrees

## How Claude Should Communicate

Every substantial update should be short, structured and evidence-based.

Use the templates from `CHAT_REPORT_TEMPLATES.md`.

Mandatory rules:
- do not send vague summaries
- always reference exact files, routes, migrations, SQL objects or runtime evidence
- explicitly mark assumptions as `INFERENCE`
- clearly separate `CONFIRMED`, `RISK`, `BLOCKER`, `RECOMMENDATION`
- end with `DECISION REQUESTED` or `NEXT ACTION`

## What Not To Reopen

Do not reopen these unless a new confirmed regression appears:

- previous UX polish sprint
- Vercel as an active blocker
- repo-side variable commission baseline
- repo-side accounting analytics baseline

## Current Sprint Priorities

Priority order:

1. DB apply + parity verification
2. security hardening
3. cleanup / optimization
4. panel expansion from ZIP

Do not pull the team into broad new panel work before security and parity are under control.

## Claude's First Assignment

Prepare a remediation plan for the confirmed security findings already identified in repo review:

1. privileged finance RPC authorization model
2. `create_notification` abuse / notification-mail abuse path
3. overly open insert permissions for `contract_documents` and `invoices`

Expected output:

- one concise report using the plan template
- exact files / migrations / functions / policies to change
- risk notes for backward compatibility
- validation plan after fixes

Important:
- plan first, do not start broad implementation
- do not reopen already closed topics to fill space
- if runtime ACL might differ from repo, mark that as `INFERENCE` unless proven

## Preferred Assignment Split

For this sprint:

- Claude: planning, verification, audits, spec comparison
- Antigravity: DB/runtime apply, Stripe/accounting verification, drift checks
- Codex: implementation, integration, final prioritization, build verification

## Reporting Frequency

Only report when one of these is true:

- a meaningful finding is confirmed
- a plan is ready for review
- a blocker appears
- a requested verification is complete

Avoid noisy partial status updates without evidence.
