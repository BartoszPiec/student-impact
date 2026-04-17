# Settings Discovery Plan

This file defines the next discovery batch for a real admin settings module.

## Why This Batch Exists

The current repo has no canonical settings schema.
Before any `/app/admin/settings` UI exists, we need to answer what is actually configurable,
where the source of truth should live, and which settings are product-safe to expose.

## Goal

Identify whether a real admin settings module can start without speculative UI work.

## What Must Be Audited

### 1. Commission Controls

Questions:
- which values are currently hardcoded vs stored in DB
- whether `default_commission_rate()` should remain static or become config-backed
- whether `offers.commission_rate` and `contracts.commission_rate` imply editable defaults

### 2. Notification Controls

Questions:
- which notification behaviors are currently code-driven only
- whether any notification toggles have an obvious config home already
- whether exposing notification settings would require a new schema

### 3. Document / Invoice Policy Controls

Questions:
- which finance/legal rules are intentionally hardcoded in migrations or helpers
- which of them are not appropriate for settings UI
- whether any document settings are operational rather than policy-critical

### 4. Platform Toggles

Questions:
- are there any existing environment-driven or code-driven toggles that are good candidates
- would they belong in DB config, env, or not be exposed at all

## Expected Output

Claude should classify each candidate as one of:
- `READY FOR SETTINGS`
- `NEEDS NEW SCHEMA`
- `SHOULD STAY CODE-ONLY`

## Desired Decision

At the end of discovery, we want one of two outcomes:
- `GO SETTINGS MVP`
- `DEFER SETTINGS`

## Guardrails

- do not build settings UI before the model is defined
- do not convert security-sensitive policy into editable UI without a strong reason
- prefer a small, explicit settings scope over a generic config dump
