-- Reviewed official Orange County guidance, September 18, 2026.
-- Bounded update; preserves IDs and lets history trigger version the four rows.
begin;
insert into public.sources (id,title,url,agency,checked_at) values ('orange-county','Orange County business taxes','https://www.octaxcol.com/taxes/business-taxes/','Orange County Tax Collector','2026-09-18T00:00:00Z') on conflict (id) do nothing;
update public.requirements set title='Orange County business tax receipt',explanation='Most businesses in Orange County, including the City of Orlando, need a county business tax receipt. Obtain the applicable city receipt before applying for the county receipt. Confirm the address boundary, classification, exemption eligibility and assessed fee with the tax collector.',source_id='orange-county',condition_key=NULL,applicability='conditional',verification_status='verified',verified_at='2026-09-18T00:00:00Z',fee_amount=NULL,fee_note='Confirm applicable fees with agency',renewal='Annual; valid through September 30',published=true
where id in ('orlando-grooming-county','orlando-pressure-washing-county','orlando-detailing-county','orlando-handyman-county') and verification_status='researching' and source_id is null and published=false;
commit;
