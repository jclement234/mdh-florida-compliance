# Saved report fulfillment contract

The account viewer reads `reports` and `report_requirements` through Supabase's publishable client. Existing RLS limits both reads to the authenticated report owner. No payment, entitlement, or report can be issued by this client.

## Trusted fulfillment still to implement

1. Verify the payment provider's signed event on the server and match its product, amount, currency, customer identity and stored order. Never trust a success-page redirect or a browser-supplied paid flag.
2. Process each provider event idempotently. Persist the order's questionnaire and selected location/business before checkout; do not reconstruct them from a later browser request.
3. Select the applicable, published source-checked requirements. Record all unresolved coverage explicitly. Do not sell this preview as a complete determination.
4. Write the report, its immutable requirement snapshots, and entitlement in a database transaction. Mark `reports.status` as `ready` only after every snapshot is stored. Failed fulfillment must be retryable without duplicate reports or entitlements.
5. Send report-ready email only after a successful transaction. Email delivery must also be idempotent and retryable.
6. Handle verified refund/dispute/subscription events and define their access effects before paid launch. The current ownership policies are not an entitlement-based paywall; UI status hiding alone is not access revocation.

## Snapshot format

Each `report_requirements` row records `report_id`, `requirement_id`, the requirement's `version`, and a JSON `snapshot` containing the requirement fields. Include the source as `snapshot.source` with its `title`, `url`, and `agency` as they were at preparation time. Capturing only a source ID is insufficient for historical source attribution.

The renderer reads only these saved snapshots for requirement wording, fee, renewal, applicability, verification date and source. It does not silently fetch current requirement content. A legacy snapshot without a source URL displays a missing-source notice. The report's business and jurisdiction labels currently use catalog display names, falling back to their saved identifiers.

## Current verification boundary

Unit tests cover snapshot rendering, unsafe HTML and URLs, missing sources, zero fees, report states and view-control visibility. A local fabricated fixture validates layout. The production ownership policies were inspected. No production test customer, purchase or report was created. The authenticated report-opening flow, refund access rules, payment fulfillment and email delivery still require end-to-end verification before sales open.
