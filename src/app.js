import {createClient} from '@supabase/supabase-js';
import {selectRequirements,reviewGaps} from './checklist.js';
import {renderReportList,renderSavedReport} from './reports.js';
const $=id=>document.getElementById(id);
const notice=text=>{$('notice').textContent=text;};
const config=await fetch('/api/config').then(r=>{if(!r.ok)throw Error('Configuration unavailable');return r.json();});
const db=createClient(config.url,config.key,{auth:{flowType:'pkce'}});
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const [businesses,locations]=await Promise.all([db.from('business_types').select('*').order('name'),db.from('jurisdictions').select('*').eq('authority_level','profile').order('name')]);
if(businesses.error||locations.error)notice('The catalog could not be loaded. Please retry.');
for(const [id,data] of [['business',businesses.data],['location',locations.data]]) $(id).innerHTML=(data??[]).map(r=>`<option value="${escape(r.id)}">${escape(r.name)}</option>`).join('');
$('lookup').addEventListener('submit',async e=>{
 e.preventDefault();
 const button=$('lookup').querySelector('button[type="submit"]');
 if(button.disabled)return;
 button.disabled=true;
 $('results').replaceChildren();$('print').hidden=true;$('checklist-context').hidden=true;$('review-gaps').hidden=true;
 const answers=Object.fromEntries([...document.querySelectorAll('[data-condition]')].map(el=>[el.dataset.condition,el.value]));
 const businessName=$('business').selectedOptions[0]?.textContent??'';
 const locationName=$('location').selectedOptions[0]?.textContent??'';
 const answerSummary=[...document.querySelectorAll('[data-condition]')].map(el=>`${el.parentElement.firstChild.textContent.trim()} ${el.selectedOptions[0].textContent}`);
 notice('Checking sourced records…');
 try {
 const {data,error}=await db.from('requirements').select('*,sources(title,url,agency)').eq('business_type_id',$('business').value).eq('jurisdiction_id',$('location').value).order('id');
 if(error){notice('We could not retrieve requirements. Please retry.');return;}
 const visible=selectRequirements(data,answers);
 $('checklist-context').innerHTML=`<h2>PermitPorch research checklist</h2><p><strong>${escape(businessName)} · ${escape(locationName)}</strong><br>Prepared ${escape(new Date().toLocaleString())}</p><p>${answerSummary.map(escape).join('<br>')}</p><p>Answers describe this lookup only and are not saved to your account. Records excluded by your answers are not independently confirmed exemptions.</p>`;
 $('checklist-context').hidden=false;
 $('review-gaps').innerHTML=`<h2>Still needs review</h2><ul>${reviewGaps(answers).map(gap=>`<li>${escape(gap)}</li>`).join('')}</ul>`;
 $('review-gaps').hidden=false;
 $('results').innerHTML=visible.map(r=>`<article><div class="eyebrow">${escape(r.applicability.replace('_',' '))} · Source checked ${escape(r.verified_at?.slice(0,10))}</div><h3>${escape(r.title)}</h3><p>${escape(r.explanation)}</p><p class="detail">${r.fee_amount===null?escape(r.fee_note):'Listed fee: $'+escape(r.fee_amount)}${r.renewal?' · '+escape(r.renewal):''}</p><a href="${escape(r.sources.url)}" target="_blank" rel="noopener noreferrer">${escape(r.sources.agency)} ↗</a></article>`).join('');
 notice(`${visible.length} source-checked records shown. This is a partial research checklist. Zoning, wastewater, professional-scope and other address-specific checks may still be unresolved. An omitted record does not establish an exemption.`);
 $('print').hidden=false;
 } catch { notice('We could not retrieve requirements. Please retry.'); }
 finally { button.disabled=false; }
});
$('print').onclick=()=>{document.body.classList.remove('printing-report');window.print();};
$('print-report').onclick=()=>{document.body.classList.add('printing-report');window.print();};
window.addEventListener('afterprint',()=>document.body.classList.remove('printing-report'));
$('login').addEventListener('submit',async e=>{
 e.preventDefault();const {error}=await db.auth.signInWithOtp({email:$('email').value,options:{emailRedirectTo:location.origin}});
 $('auth-status').textContent=error?'Sign-in could not be sent. Email delivery or redirect configuration may need attention.':'Check your email for a sign-in link. Open it in this browser.';
});
let accountGeneration=0,reportGeneration=0;
function clearReport(){
 reportGeneration++;$('saved-report').hidden=true;$('report-content').replaceChildren();$('print-report').hidden=true;
}
$('close-report').onclick=clearReport;
$('logout').onclick=async()=>{
 accountGeneration++;clearReport();$('dashboard').replaceChildren();
 const {error}=await db.auth.signOut();
 $('auth-status').textContent=error?'Sign-out could not be completed. Please retry.':'Signed out.';
 await dashboard();
};
async function dashboard(){
 const generation=++accountGeneration;clearReport();$('dashboard').textContent='Loading your account…';
 try {
 const {data:{user}}=await db.auth.getUser();
 if(generation!==accountGeneration)return;
 $('logout').hidden=!user;
 if(!user){$('dashboard').textContent='Sign in to view purchased reports and alerts. Purchases are not open yet.';return;}
 $('auth-status').textContent='Signed in.';
 const {data,error}=await db.from('reports').select('id,status,created_at,business_type_id,jurisdiction_id,business_types(name),jurisdictions(name)').order('created_at',{ascending:false}).limit(50);
 if(generation!==accountGeneration)return;
 if(error){$('dashboard').textContent='Reports could not be loaded. Please refresh to retry.';return;}
 $('dashboard').innerHTML=renderReportList(data);
 }catch{if(generation===accountGeneration)$('dashboard').textContent='Your account could not be loaded. Please refresh to retry.';}
}
$('dashboard').addEventListener('click',async event=>{
 const button=event.target.closest('button[data-report]');if(!button)return;
 clearReport();const generation=reportGeneration,account=accountGeneration;
 $('saved-report').hidden=false;$('report-content').textContent='Loading saved report…';
 try{
  // RLS enforces report ownership on both queries. No service key is used in the client.
  const {data:report,error}=await db.from('reports').select('id,status,created_at,business_type_id,jurisdiction_id,answers,business_types(name),jurisdictions(name)').eq('id',button.dataset.report).single();
  if(generation!==reportGeneration||account!==accountGeneration)return;
  if(error||!report){$('report-content').textContent='This report is unavailable or you no longer have access.';return;}
  if(report.status!=='ready'){$('report-content').innerHTML=renderSavedReport(report,[]);return;}
  const {data:items,error:itemError}=await db.from('report_requirements').select('version,snapshot,requirement_id').eq('report_id',report.id).order('requirement_id');
  if(generation!==reportGeneration||account!==accountGeneration)return;
  if(itemError){$('report-content').textContent='Saved requirements could not be loaded. Close the report and retry.';return;}
  $('report-content').innerHTML=renderSavedReport(report,items);$('print-report').hidden=!items.length;
  $('saved-report').focus();
 }catch{if(generation===reportGeneration&&account===accountGeneration)$('report-content').textContent='The report could not be loaded. Close the report and retry.';}
});
db.auth.onAuthStateChange(()=>{
 accountGeneration++;clearReport();$('dashboard').replaceChildren();
 setTimeout(()=>{void dashboard();},0);
});
await dashboard();
