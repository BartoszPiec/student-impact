# Private Proposals Phase Plan

## Objective
Add a new, controlled entry path into the existing service-order engine:
- student initiates a private proposal
- only to a company that has already worked with that student
- company reviews the proposal inside the existing service-order negotiation flow
- accepted proposal converges into the same downstream path:
  - contract
  - deliverables
  - escrow
  - invoices

This is not a second settlement workflow.

## Repo-Grounded Foundation

### Already working
- `service_packages` is the stable student-side offer catalog
- `service_orders` is the workflow source of truth
- `request_snapshot` and `quote_snapshot` already structure the negotiation context
- student dashboard exists at `/app/services/dashboard`
- company order management exists at `/app/company/orders`
- accepted service orders already reach:
  - contract creation
  - deliverables
  - escrow entry

### Current limitation
The current service-order path is company-initiated:
- company starts from package inquiry / order form
- student replies with a quote
- company accepts, counters, or rejects

Private proposals need the inverse:
- student starts
- company receives
- then both still use the same negotiation loop

## Product Rule
Private proposals are allowed only when there is prior cooperation between:
- this student
- this company

Recommended eligibility evidence:
- at least one existing `contracts` row linking:
  - `student_id`
  - `company_id`
- and preferably status in a real cooperation set such as:
  - `active`
  - `completed`
  - `awaiting_funding`

The exact status filter should be confirmed before implementation.

## Current Architecture Constraint
`conversations` are still looked up by:
- `package_id`
- `company_id`
- `student_id`
- `type = 'inquiry'`

This is already somewhat fragile for repeated orders.
Private proposals increase that risk materially.

Therefore, before or inside this phase, we should strongly prefer attaching chat directly by:
- `service_order_id` on `conversations`

This does not need to be the first UI batch, but it is the most important workflow safety note.

## Recommended Minimal Scope

### Batch A — data + workflow foundation
Add only the minimum metadata required for proposal origin and safe routing.

Recommended additive columns on `service_orders`:
- `entry_point text`
  - `company_request`
  - `student_private_proposal`
- `initiated_by text`
  - `company`
  - `student`

Optional but recommended in the same phase:
- `service_order_id uuid` on `conversations`

Why this is enough:
- `company_id` already tells us the target company
- `student_id` already tells us the proposing student
- `package_id` already tells us which service package the proposal is based on
- `request_snapshot` can carry proposal brief content

### Batch B — student send flow
Add a student-side compose flow from an existing service package.

Minimal UX:
- from `/app/services/my`
- or per-package action from the student service card
- CTA:
  - `Zaproponuj firmie`

Student flow:
1. select one of the eligible companies
2. fill proposal brief
3. submit

### Batch C — company receive flow
Do not create a separate company inbox domain if we can avoid it.

Minimal approach:
- private proposals land directly inside `/app/company/orders`
- clearly marked as:
  - source badge
  - `Prywatna propozycja od studenta`

Company should then use the same pattern already proven in `Company Order Management v1`:
- accept
- counter
- reject
- enter deliverables after acceptance

## Proposal Brief Shape

Do not reuse the current company-order-form snapshot as-is without extending the type.

We should support a second `request_snapshot.source` variant:

### Existing
- `company_order_form`

### New
- `student_private_proposal`

Recommended fields for the new variant:
- `package_id`
- `package_title`
- `target_company_id`
- `target_company_name` optional display convenience
- `proposal_goal`
- `expected_result`
- `scope_summary`
- `estimated_timeline_days` optional
- `proposed_amount`
- `message`
- `submitted_at`

This allows the company detail page to render a structured proposal rather than a text blob.

## Important Reuse Rule
After company acceptance:
- keep using `quote_snapshot`
- keep using `ensure_contract_for_service_order()`
- keep using the existing deliverables and escrow path

Do not:
- create a new proposal-only contract type
- create a proposal-only invoice type
- create a separate payout or checkout workflow

## Suggested UI Surfaces

### Student side
- `/app/services/my`
  - new action: `Zaproponuj firmie`
- new compose page:
  - `/app/services/proposals/new?packageId=...`

### Company side
- reuse `/app/company/orders`
- reuse `/app/company/orders/[id]`
- add a visible source badge and slightly different framing copy

## Main Risks

### Risk 1 — chat ambiguity
If `conversations` stay attached only by package/company/student triple,
repeated proposals can point to the wrong thread.

### Risk 2 — eligibility leakage
If prior-cooperation rule is enforced only in UI, a student could target arbitrary companies.
This rule must be server-side.

### Risk 3 — data model drift
If private proposals create a parallel record type instead of converging into `service_orders`,
we reintroduce a split workflow and duplicate later finance logic.

## Minimal Safe Implementation Order
1. audit and confirm eligibility rule from current DB reality
2. add source metadata to `service_orders`
3. extend snapshot typing for `student_private_proposal`
4. add student compose page
5. surface private proposals inside existing company orders pages
6. only then consider `conversations.service_order_id` hardening if not already folded into the same batch

## Not In Scope For First Pass
- mass outbound proposals
- proposals to companies with no prior cooperation
- separate billing rules
- separate proposal analytics domain
- proposal marketplace feed

## Recommended First Implementable Batch
### `Private Proposals Foundation v1`

Minimal target:
- additive metadata on `service_orders`
- student compose flow
- company receives proposal in existing company orders UI
- proposal converts into the existing negotiation loop

This is the highest-ROI version that stays aligned with the architecture we just stabilized.
