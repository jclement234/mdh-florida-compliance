# Orlando county coverage — reviewed September 18, 2026

Status: applied and verified in the database, catalog and recreated workbook.

## Sources
- [Orange County Tax Collector: Business Taxes](https://www.octaxcol.com/taxes/business-taxes/)
- [Obtaining a new receipt](https://www.octaxcol.com/taxes/business-taxes/obtain-new-business-tax-receipt/)

## Requirement
Most businesses in Orange County, including Orlando, need a county business tax receipt. Obtain the applicable municipal receipt first. Check the address boundary, classification, exemptions and assessed fee with the tax collector. Receipts renew annually and are valid through September 30.

Applicability remains conditional. No individual business exemption or fee was determined.

## Applied records
- orlando-grooming-county
- orlando-pressure-washing-county
- orlando-detailing-county
- orlando-handyman-county

These four coverage rows share one county rule. IDs were preserved and database versions advanced from 1 to 2 using db/orlando-county-update.sql. The initial seed was not rerun.

## Verification
- 168 total rows: 106 published verified, 62 researching.
- Anonymous-role query sees 106 rows, including all four Orlando county rows.
- All 18 automated tests pass, including every catalog source against the monitor allowlist.
- check-sources version 3 deployed with JWT verification enabled; readback includes the Orange County host. A live scan and schedule remain unverified.
- Workbook recalculation and formula error scan passed. Saved-file readback matches all 168 IDs, guidance, statuses and sources, plus all 62 pending IDs. Reviewed rendered sheets and the changed source/requirement rows.

## Remaining scope
Address-specific zoning, wastewater, professional scope, employment/entity obligations, payment fulfillment, production email and end-to-end launch checks remain outstanding. Public launch remains disabled pending approval.
