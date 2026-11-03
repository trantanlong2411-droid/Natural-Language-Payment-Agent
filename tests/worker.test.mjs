import test from 'node:test';
import assert from 'node:assert/strict';
import {Script} from 'node:vm';
import worker,{BUILD_VERSION} from '../src/worker.mjs';
import {HTML} from '../src/page.mjs';
import {PROOF_HTML} from '../src/proof.mjs';

test('dashboard has explicit parse, validate, confirm and unsigned export sequence',()=>{
 for(const key of ['Parse my instruction','Validate on Pharos Mainnet',
  'Generate unsigned transaction','confirmed','unsignedTransaction',
  'FOLLOW-UP REQUIRED','insufficient','no wallet connection','Send','signingPerformed']){
  assert.match(HTML,new RegExp(key,'i'));
 }
 const script=HTML.match(/<script>([\s\S]*?)<\/script>/);
 assert.ok(script);
 new Script(script[1]);
});
test('proof page maps all four rubric items and never claims a transfer was sent',()=>{
 for(const item of ['01 · PARSE','02 · VERIFY','03 · HUMAN','04 · UNSIGNED']){
  assert.ok(PROOF_HTML.includes(item));
 }
 assert.match(PROOF_HTML,/NEVER connects a wallet/);
});
test('health route declares no broadcast or signing and serves both pages',async()=>{
 const health=await worker.fetch(new Request('https://example.workers.dev/api/health'));
 const h=await health.json();
 assert.equal(h.ok,true);
 assert.equal(h.version,BUILD_VERSION);
 assert.equal(h.sendSupported,false);
 assert.equal(h.signatureSupported,false);
 assert.equal(h.transactionBroadcast,false);
 const homepage=await worker.fetch(new Request('https://example.workers.dev/'));
 assert.match(await homepage.text(),/NATURAL-LANGUAGE/);
 const proof=await worker.fetch(new Request('https://example.workers.dev/proof'));
 assert.match(await proof.text(),/PROOF OF/);
});
test('parse API requests clarification for unresolved alice.eth without calling RPC',async()=>{
 const response=await worker.fetch(new Request('https://example.workers.dev/api/parse',
  {method:'POST',headers:{'content-type':'application/json'},
   body:JSON.stringify({text:'send 100 USDC to alice.eth'})}));
 const j=await response.json();
 assert.equal(response.status,200);
 assert.equal(j.ok,false);
 assert.deepEqual(j.missing,['recipient','sender']);
});
test('prepare route blocks request without confirmation before any RPC access',async()=>{
 const response=await worker.fetch(new Request('https://example.workers.dev/api/prepare',
  {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({text:'send 100 USDC to 0x2222222222222222222222222222222222222222',sender:'0x1111111111111111111111111111111111111111'})}));
 assert.equal(response.status,400);
 const j=await response.json();
 assert.equal(j.ok,false);
 assert.match(j.error,/confirmation/i);
});

test('review page explains locked button and offers a live-funded sample without bypassing validation',()=>{
 assert.match(HTML,/id="blockedHelp"/);
 assert.match(HTML,/Insufficient/);
 assert.match(HTML,/id="sampleFromBlocked"/);
 assert.match(HTML,/function loadSample\(\)/);
 assert.match(HTML,/\$\('sampleFromBlocked'\)\.onclick=loadSample/);
 assert.match(HTML,/\$\('prepare'\)\.disabled=true/);
 assert.match(HTML,/\!latestReview\?\.readyForSignature\|\|\!\$\('confirmed'\)\.checked/);
 assert.match(HTML,/The sample belongs to an unrelated public account/);
});
