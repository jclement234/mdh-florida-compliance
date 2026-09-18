# Orlando county coverage — reviewed September 18, 2026

Status: evidence reviewed; proposed update NOT applied to production data or the workbook.

## Sources
- [Orange County Tax Collector: Business Taxes](https://www.octaxcol.com/taxes/business-taxes/)
- [Obtaining a new receipt](https://www.octaxcol.com/taxes/business-taxes/obtain-new-business-tax-receipt/)

## Proposed requirement
Title: Orange County business tax receipt

Most businesses in Orange County, including the City of Orlando, need a county business tax receipt. Obtain the applicable city receipt before applying for the county receipt. Confirm the address boundary, classification, exemption eligibility and assessed fee with the tax collector.

Applicability: conditional. Fee: confirm with agency. Renewal: annual; receipts are valid through September 30. An individual business's exemption or classification has not been determined.

## Existing coverage rows
- orlando-grooming-county
- orlando-pressure-washing-county
- orlando-detailing-county
- orlando-handyman-county

Four coverage rows share this county guidance; they are not four distinct laws. If all four pending rows are updated successfully, expected totals are 106 source-checked and 62 researching out of 168. Current production totals remain 102 and 66.

## Application checklist
1. Add source ID orange-county to the generator with the September 18 review date. Preserve all older source dates.
2. Replace only the four listed pending rows, preserving their IDs and version history.
3. Use an idempotent, bounded data update, not the initial seed.
4. Verify the four rows, history, RLS visibility and totals.
5. Regenerate the workbook and verify formulas, source formatting and review-queue counts.
6. Add www.octaxcol.com to the monitor allowlist and its tests before monitoring it.
7. Verify repository/deployment consistency before claiming completion.

## Remaining scope
This closes only the general county-receipt research gap for the Orlando profile. Address-specific zoning, wastewater, professional scope, employment/entity obligations, payment fulfillment, production email and end-to-end launch checks remain outstanding. Current local file-edit permissions do not cover the original build directory; this research note is preserved via the authorized GitHub connector. No database, workbook, or public-launch setting changed.
