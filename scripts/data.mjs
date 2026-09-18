import fs from 'node:fs/promises';
const businesses=[['grooming','Mobile Pet Grooming'],['pressure-washing','Pressure Washing'],['detailing','Mobile Auto Detailing'],['handyman','Handyman Services']].map(([id,name])=>({id,name}));
const locations=[['gainesville','Gainesville / Alachua County'],['orlando','Orlando'],['jacksonville','Jacksonville / Duval'],['tampa','Tampa'],['miami','City of Miami'],['miami-dade','Unincorporated Miami-Dade']].map(([id,name])=>({id,name,authority_level:'profile'}));
const sourceRows=[
 ['dba','Fictitious name registration','https://dos.fl.gov/sunbiz/start-business/efile/fl-fictitious-name-registration','Florida Department of State'],
 ['tax','Tax registration','https://floridarevenue.com/taxes/eservices/Pages/registration.aspx','Florida Department of Revenue'],
 ['contractor','Contractor scope, section 489.117','https://www.flsenate.gov/Laws/Statutes/2026/489.117','Florida Legislature'],
 ['repair','Motor vehicle repair registration','https://www.fdacs.gov/Business-Services/Motor-Vehicle-Repair','FDACS'],
 ['gainesville','Local business tax','https://www.gainesvillefl.gov/Government-Pages/Government/Departments/Financial-Services/Local-Business-Tax','City of Gainesville'],
 ['alachua','County business tax repeal','https://www.alachuacollector.com/local-business-tax/','Alachua County Tax Collector'],
 ['orlando','Business tax receipt and certificate of use','https://www.orlando.gov/Building-Development/Permits-Inspections/Other/Get-a-Permit-for-Your-Business/Get-a-Business-Tax-Receipt','City of Orlando'],
 ['jacksonville','Local business tax receipt','https://taxcollector.jacksonville.gov/taxes/local-business-tax','Duval County Tax Collector'],
 ['tampa','Business tax','https://www.tampa.gov/business-tax','City of Tampa'],
 ['miami','Business licensing','https://www.miami.gov/Business-Licenses/Business-Licensing','City of Miami'],
 ['miami-dade','Local business tax receipt','https://mdctaxcollector.gov/services/local-business-tax-receipt','Miami-Dade Tax Collector']
].map(([id,title,url,agency])=>({id,title,url,agency,checked_at:'2026-09-17T00:00:00Z'}));
const records=[];
sourceRows.push({id:'orange-county',title:'Orange County business taxes',url:'https://www.octaxcol.com/taxes/business-taxes/',agency:'Orange County Tax Collector',checked_at:'2026-09-18T00:00:00Z'});
for(const l of locations) for(const b of businesses){
 const add=(slot,title,explanation,source,condition=null,applicability='conditional',fee=null,renewal=null)=>records.push({id:`${l.id}-${b.id}-${slot}`,business_type_id:b.id,jurisdiction_id:l.id,title,explanation,source_id:source,condition_key:condition,applicability:source?applicability:'unknown',verification_status:source?'verified':'researching',verified_at:source?'2026-09-17T00:00:00Z':null,fee_amount:fee,fee_note:fee===null?'Confirm applicable fees with agency':null,renewal,published:!!source});
 add('dba','Fictitious name registration','If you trade under a name other than your legal name, check registration requirements and exemptions before use. Registration does not establish trademark rights.','dba','uses_dba','conditional',50,'Five years; expires December 31 in final year');
 add('tax','Sales and use tax registration','Register before selling taxable goods or services. Taxability depends on the actual activity; this record does not classify every service as taxable.','tax','taxable_sales');
 if(b.id==='grooming') add('scope','Grooming versus veterinary activities','Confirm the boundary between grooming and regulated veterinary services with DBPR. Current source verification is pending.',null);
 else if(b.id==='detailing') add('scope','Motor vehicle repair registration','Paid repair of customer vehicles triggers FDACS registration, including mobile repair. Confirm classification if services extend beyond cleaning.','repair','vehicle_repair');
 else add('scope','Contractor scope review','Section 489.117 limits local licensing for work outside regulated contractor categories and names handyman services and pressure washing. Work within a regulated category still requires the appropriate license.','contractor','regulated_work');
 if(l.id==='miami-dade') add('local','Municipal boundary check','This profile is for unincorporated addresses. Verify the actual address boundary before applying city requirements.',null);
 else add('local','Local business tax receipt',l.id==='orlando'?'Check city BTR requirements. The mobile-business Certificate of Use exception does not itself waive the BTR.':l.id==='jacksonville'?'The county tax collector requires an LBTR for most businesses, including home-based and one-person operations. Beach municipalities and Baldwin may impose an additional municipal tax.':l.id==='gainesville'?'Submit the initial city business-tax affidavit packet and applicable supporting documents. Confirm classification, exemption eligibility, and assessed fees.':'Check the city business-tax receipt process for the exact business address and activity.',l.id,null,'conditional');
 if(l.id==='gainesville') add('county','County business tax receipt','Alachua County has repealed its county local business tax. City requirements remain separate.','alachua',null,'not_required',0);
 else if(l.id==='miami'||l.id==='miami-dade') add('county','Miami-Dade county business tax','Check the county receipt process in addition to applicable municipal approvals. Unincorporated businesses must also address county zoning/use approval.','miami-dade');
 else if(l.id==='jacksonville') add('county','Additional municipal tax boundary','If the business is in Jacksonville Beach, Atlantic Beach, Neptune Beach, or Baldwin, also check that municipality. The Jacksonville profile must not imply those taxes are covered.','jacksonville','separate_municipality');
 else if(l.id==='orlando') {
  add('county','Orange County business tax receipt','Most businesses in Orange County, including the City of Orlando, need a county business tax receipt. Obtain the applicable city receipt before applying for the county receipt. Confirm the address boundary, classification, exemption eligibility and assessed fee with the tax collector.','orange-county',null,'conditional',null,'Annual; valid through September 30');
  records.at(-1).verified_at='2026-09-18T00:00:00Z';
 }
 else add('county','County business tax review','County requirements and exemptions have not yet been verified for this profile. Confirm with the county tax collector.',null);
 add('zoning','Home base, zoning and vehicle parking','Confirm address-specific home occupation, customer visits, equipment storage, commercial vehicle parking, and use approvals with local planning staff.',null,'home_based');
 add('waste','Wastewater and disposal review','Confirm the handling of wash water, chemicals and waste with the relevant utility/environmental authority before discharge. Local requirements remain unverified.',null,'wash_water');
}
const data={businesses,locations,sources:sourceRows,records,methodology:'Recreated from the prior chat scope. 168 coverage rows = four business types × six profiles × seven checks. Repeated statewide rules are not distinct laws. Verified means the cited official guidance was checked, not that a business is certified compliant. Researching rows are not published in the public requirements API. Coverage is incomplete.'};
await fs.mkdir('data',{recursive:true});await fs.writeFile('data/catalog.json',JSON.stringify(data,null,2));
const q=v=>v===null?'NULL':typeof v==='boolean'?String(v):typeof v==='number'?String(v):`'${String(v).replaceAll("'","''")}'`;
const insert=(table,rows)=>`insert into public.${table} (${Object.keys(rows[0]).join(',')}) values\n${rows.map(r=>'('+Object.values(r).map(q).join(',')+')').join(',\n')};\n`;
await fs.writeFile('db/seed.sql',insert('business_types',businesses)+insert('jurisdictions',locations)+insert('sources',sourceRows)+insert('requirements',records));
console.log(JSON.stringify({rows:records.length,verified:records.filter(r=>r.published).length,researching:records.filter(r=>!r.published).length}));
