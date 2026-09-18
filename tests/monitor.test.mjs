import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {sourceUrl,fingerprint,probeSource} from '../supabase/functions/check-sources/probe.js';
const url='https://www.gainesvillefl.gov/example';
test('every reviewed catalog source is accepted by the monitor',()=>{
 const catalog=JSON.parse(fs.readFileSync(new URL('../data/catalog.json',import.meta.url),'utf8'));
 for(const source of catalog.sources) assert.equal(sourceUrl(source.url).href,new URL(source.url).href,source.id);
});
test('monitor rejects non-government hosts, credentials, ports and insecure protocols',()=>{
 for(const value of ['http://www.gainesvillefl.gov','https://www.gainesvillefl.gov.attacker.com','https://localhost','https://user:secret@www.gainesvillefl.gov','https://www.gainesvillefl.gov:444'])assert.throws(()=>sourceUrl(value));
 assert.equal(sourceUrl(url).href,url);
});
test('monitor sets a timeout and refuses redirects without sending credentials',async()=>{
 await probeSource({url,fingerprint:null},async(input,options)=>{
  assert.equal(input.href,url);assert.equal(options.redirect,'error');assert.ok(options.signal instanceof AbortSignal);
  assert.equal(Object.keys(options.headers).length,1);return new Response('official text');
 });
});
test('first baseline is not a change; unchanged and changed pages are distinguished',async()=>{
 const first=await probeSource({url,fingerprint:null},async()=>new Response('baseline'));
 assert.equal(first.baseline,false);assert.equal(first.changed,false);
 const same=await probeSource({url,fingerprint:first.hash},async()=>new Response('baseline'));
 assert.equal(same.changed,false);
 const changed=await probeSource({url,fingerprint:first.hash},async()=>new Response('revised'));
 assert.equal(changed.changed,true);
});
test('empty or failed responses cannot replace a baseline',async()=>{
 await assert.rejects(()=>fingerprint(new Response('')),/Empty body/);
 await assert.rejects(()=>fingerprint(new Response(null)),/Empty body/);
 await assert.rejects(()=>probeSource({url},async()=>new Response('error',{status:503})),/HTTP 503/);
 await assert.rejects(()=>probeSource({url},async()=>{throw Error('timeout');}),/timeout/);
});
test('streaming size limit cancels oversized bodies even without Content-Length',async()=>{
 let cancelled=false;
 const body=new ReadableStream({pull(c){c.enqueue(new Uint8Array(600000));},cancel(){cancelled=true;}});
 await assert.rejects(()=>fingerprint(new Response(body)),/1 MiB/);assert.equal(cancelled,true);
});
test('SHA-256 fingerprint is independent of chunk boundaries',async()=>{
 const encoder=new TextEncoder();
 const body=new ReadableStream({start(c){c.enqueue(encoder.encode('a'));c.enqueue(encoder.encode('bc'));c.close();}});
 assert.equal(await fingerprint(new Response(body)),await fingerprint(new Response('abc')));
});
