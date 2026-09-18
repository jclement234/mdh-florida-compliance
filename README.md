# PermitPorch — Florida business requirements

Research preview built on the existing Cloudflare Worker and Supabase project. Not approved for paid launch.

## Build and deploy

Use Node 22+ and pnpm 11.19.0. Run `pnpm install --frozen-lockfile`, `pnpm test`, and `pnpm build`. Cloudflare's existing main-branch trigger runs `npx wrangler deploy`; Wrangler runs the configured build first. Public workers.dev access remains disabled pending launch review.

`wrangler.jsonc` includes only the Supabase publishable key, never a service-role key. Client queries are governed by RLS. Customer reports, subscriptions and entitlements are read-only to their owners and writable only by a trusted backend.

## Data and schema

`db/schema.sql` is the foundation applied to project `dspijzrbqynkfhscjvwt` via migration `mdh_production_foundation`. A subsequent migration revokes public execution of the platform-created `rls_auto_enable()` helper. Do not rerun the foundation over an existing database.

Run `node scripts/data.mjs` to recreate `data/catalog.json` and `db/seed.sql`. The seed is an initial import, not an idempotent update script. Import once only; future updates must preserve record IDs and history.

168 coverage rows = four business types × six location profiles × seven checks. 102 source-checked rows repeat guidance from 11 official sources; 66 rows remain in research. This is not 168 distinct laws. Research rows are withheld by RLS. The workbook is a recreation, not a recovered original.

## Verified checks

- Cloudflare deployment dry-run succeeds.
- RLS tests: anonymous users see only 102 published rows and cannot read reports or write requirements.
- Two temporary customer fixtures confirm owners see only their own report; authenticated users cannot issue entitlements. All fixtures rolled back.
- Workbook coverage formulas respond to edited verification status; formula scan and visual inspection passed.
- Supabase security advisor has no warnings after helper permission fix. Two INFO findings are expected: internal source checks/history have RLS and intentionally no client policies.

## Remaining launch gates

- Verify Supabase Auth site URL, allowed redirects and actual email delivery. No end-to-end email sign-in has passed yet.
- Connect Stripe and implement verified webhooks, payment entitlement issuance/refunds and paid report delivery before enabling checkout.
- Configure transactional email and scheduled source monitoring. The `check-sources` Edge Function is deployed with JWT verification plus service-role-only authorization, a government-host allowlist, timeout and response-size limits. It has not been invoked end to end or scheduled. Content changes create review signals, never automatic legal edits or customer alerts.
- Finish research for location-specific zoning, wastewater, scope, county and municipal exceptions. Add employee/entity questions before calling reports complete.
- Choose the final brand/domain, finish legal/support policies and obtain public-launch approval.

The preview intentionally identifies itself as incomplete and never claims a business is compliant.

## Checklist preview update — September 18, 2026

PermitPorch is the working customer-facing name; the existing repository and infrastructure names are retained. The questionnaire captures entity type, employee plans, home operations and wash-water activity. These answers surface explicit research gaps; they do not establish additional verified requirements. Printed checklists retain the business, location, preparation time and answers. Answers are not persisted. Unknown answers retain conditional records; only an explicit no filters a conditional record.

Validation: six unit tests pass; browser lookup against the live public catalog returns records with context and review gaps. The client bundle builds successfully. Domain, business email, Stripe onboarding, end-to-end authentication, paid fulfillment and scheduled monitoring remain outstanding.
