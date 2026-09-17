import {createClient} from 'npm:@supabase/supabase-js@2.116.0';
const allowed=new Set(['dos.fl.gov','floridarevenue.com','www.flsenate.gov','www.fdacs.gov','www.gainesvillefl.gov','www.alachuacollector.com','www.orlando.gov','taxcollector.jacksonville.gov','www.tampa.gov','www.miami.gov','mdctaxcollector.gov']);
async function fingerprint(response:Response){
 const reader=response.body?.getReader();if(!reader)throw Error('Empty body');
 const chunks:Uint8Array[]=[];let size=0;
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>1048576)throw Error('Source exceeds 1 MiB review limit');chunks.push(value);}}finally{await reader.cancel();}
 const content=new Uint8Array(size);let offset=0;for(const part of chunks){content.set(part,offset);offset+=part.length;}
 return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',content))).map(b=>b.toString(16).padStart(2,'0')).join('');
}
Deno.serve(async(req:Request)=>{
 if(req.method!=='POST')return new Response('Method not allowed',{status:405});
 const secret=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
 if(!secret)return new Response('Monitor is not configured',{status:503});
 // Only the trusted scheduler may run a full source check. Ordinary customer JWTs are insufficient.
 const supplied=req.headers.get('authorization')??'';
 const digest=async(s:string)=>new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)));
 const [actual,expected]=await Promise.all([digest(supplied),digest(`Bearer ${secret}`)]);
 let difference=0;for(let i=0;i<expected.length;i++)difference|=expected[i]^actual[i];
 if(difference!==0)return new Response('Unauthorized',{status:401});
 const db=createClient(Deno.env.get('SUPABASE_URL')!,secret,{auth:{persistSession:false}});
 const {data:sources,error}=await db.from('sources').select('id,url,fingerprint').limit(100);
 if(error)return new Response('Source catalog unavailable',{status:503});
 const results=[];
 for(const source of sources){
  try{
   const url=new URL(source.url);if(url.protocol!=='https:'||!allowed.has(url.hostname)||url.port||url.username||url.password)throw Error('Source URL requires review');
   const response=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(12000),headers:{'User-Agent':'MDH-Source-Check/1.0'}});
   if(!response.ok){await response.body?.cancel();throw Error(`HTTP ${response.status}`);}
   const hash=await fingerprint(response),changed=source.fingerprint!==null&&hash!==source.fingerprint;
   const check=await db.from('source_checks').insert({source_id:source.id,http_status:response.status,fingerprint:hash,changed,review_status:changed?'pending':'reviewed',notes:source.fingerprint?'Content fingerprint comparison only; no legal interpretation.':'Initial baseline only.'});
   if(check.error)throw Error('Could not persist check');
   const update=await db.from('sources').update({fingerprint:hash,checked_at:new Date().toISOString()}).eq('id',source.id);if(update.error)throw Error('Could not persist baseline');
   // Content change is only a review signal; no requirement text or customer alert is generated automatically.
   results.push({source_id:source.id,status:changed?'review_required':'checked'});
  }catch(error){const message=error instanceof Error?error.message:'Source check failed';await db.from('source_checks').insert({source_id:source.id,review_status:'failed',notes:message});results.push({source_id:source.id,status:'failed'});}
 }
 return Response.json({results});
});
