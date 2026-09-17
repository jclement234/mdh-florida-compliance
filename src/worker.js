const headers={'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
export default {
 async fetch(request,env){
  const url=new URL(request.url);
  if(url.pathname==='/api/config') return Response.json({url:env.SUPABASE_URL,key:env.SUPABASE_PUBLISHABLE_KEY},{headers});
  if(url.pathname==='/api/health'){
   try{
    const response=await fetch(`${env.SUPABASE_URL}/rest/v1/business_types?select=id&limit=1`,{headers:{apikey:env.SUPABASE_PUBLISHABLE_KEY},signal:AbortSignal.timeout(5000)});
    await response.body?.cancel();
    return Response.json({database:response.ok?'reachable':'unavailable',launchReady:false,payments:'not_configured',monitoring:'not_active'}, {status:response.ok?200:503,headers});
   }catch{return Response.json({database:'unavailable',launchReady:false},{status:503,headers});}
  }
  if(url.pathname.startsWith('/api/'))return Response.json({error:'Not found'},{status:404,headers});
  return env.ASSETS.fetch(request);
 }
};
