import {createClient} from '@supabase/supabase-js';
import {selectRequirements,reviewGaps} from './checklist.js';
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
$('print').onclick=()=>window.print();
$('login').addEventListener('submit',async e=>{
 e.preventDefault();const {error}=await db.auth.signInWithOtp({email:$('email').value,options:{emailRedirectTo:location.origin}});
 $('auth-status').textContent=error?'Sign-in could not be sent. Email delivery or redirect configuration may need attention.':'Check your email for a sign-in link. Open it in this browser.';
});
$('logout').onclick=async()=>{await db.auth.signOut();await dashboard();};
async function dashboard(){
 const {data:{user}}=await db.auth.getUser();$('logout').hidden=!user;
 if(!user){$('dashboard').textContent='Sign in to view purchased reports and alerts. Purchases are not open yet.';return;}
 $('auth-status').textContent='Signed in.';
 const {data,error}=await db.from('reports').select('id,status,created_at').order('created_at',{ascending:false});
 $('dashboard').textContent=error?'Reports could not be loaded.':data.length?data.map(r=>`${r.created_at.slice(0,10)} — ${r.status}`).join('\n'):'No purchased reports yet. The free research checklist is available above.';
}
await dashboard();
db.auth.onAuthStateChange(()=>{setTimeout(()=>{void dashboard();},0);});
