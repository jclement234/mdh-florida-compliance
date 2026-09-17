import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/worker.js';
test('health fails closed when database request fails',async()=>{
 const original=globalThis.fetch;globalThis.fetch=async()=>{throw Error('offline');};
 try {const r=await worker.fetch(new Request('https://example.com/api/health'),{SUPABASE_URL:'https://example.com',SUPABASE_PUBLISHABLE_KEY:'public'});assert.equal(r.status,503);assert.equal((await r.json()).launchReady,false);}finally{globalThis.fetch=original;}
});
test('health does not claim launch readiness for a reachable database',async()=>{
 const original=globalThis.fetch;globalThis.fetch=async()=>new Response('[]');
 try {const r=await worker.fetch(new Request('https://example.com/api/health'),{SUPABASE_URL:'https://example.com',SUPABASE_PUBLISHABLE_KEY:'public'});assert.equal(r.status,200);assert.equal((await r.json()).launchReady,false);}finally{globalThis.fetch=original;}
});
test('unknown API routes do not fall through to application HTML',async()=>{
 const r=await worker.fetch(new Request('https://example.com/api/admin'),{});assert.equal(r.status,404);
});
