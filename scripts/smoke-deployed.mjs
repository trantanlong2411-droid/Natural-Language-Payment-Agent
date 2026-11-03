import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {Interface,id,getAddress,parseUnits} from 'ethers';
import {BUILD_VERSION} from '../src/worker.mjs';
import {ERC20,CHAIN} from '../src/engine.mjs';
const base=(process.env.PAYMENT_AGENT_URL||'https://natural-language-payment-agent.trantanlong2411.workers.dev').replace(/\/$/,'');
const sleep=n=>new Promise(r=>setTimeout(r,n));
async function endpoint(path,body){
 const res=await fetch(base+path,{
  method:body?'POST':'GET',headers:body?{'content-type':'application/json'}:{},
  body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(95000)
 });
 const txt=await res.text();let j;
 try{j=JSON.parse(txt)}catch{throw Error('Non JSON Worker response: '+res.status+' '+txt.slice(0,180))}
 return {status:res.status,data:j};
}
let count=0;
async function rpc(method,params=[]){
 const res=await fetch(CHAIN.rpc,{method:'POST',headers:{'content-type':'application/json'},
  body:JSON.stringify({jsonrpc:'2.0',id:++count,method,params}),signal:AbortSignal.timeout(16000)});
 if(!res.ok)throw Error('RPC HTTP '+res.status);
 const v=await res.json();
 if(v.error)throw Error(method+': '+v.error.message);
 return v.result;
}
const from='0x1111111111111111111111111111111111111111';
const to='0x2222222222222222222222222222222222222222';
const instruction='send 100 USDC to '+to;
const knownZero={text:instruction,sender:from};
async function discoverSender(min=100000000n){
 const tip=BigInt(await rpc('eth_blockNumber',[])),topic=id('Transfer(address,address,uint256)');
 const visited=new Set();let checked=0,windows=0;
 for(let i=0;i<22;i++){
  const high=tip-BigInt(i*950),low=high>949n?high-949n:0n;
  let logs;
  try{logs=await rpc('eth_getLogs',[{
   address:CHAIN.usdc,
   fromBlock:'0x'+low.toString(16),toBlock:'0x'+high.toString(16),
   topics:[topic]
  }]);windows++}catch(e){console.log('TRANSFER_LOG_WINDOW_UNAVAILABLE',i,String(e.message).slice(0,90));continue}
  for(const event of logs.slice().reverse()){
   if(!event.topics||event.topics.length<3)continue;
   if(BigInt(event.data||'0x0')<min)continue;
   const who=getAddress('0x'+event.topics[2].slice(-40));
   if(visited.has(who.toLowerCase())||who.toLowerCase()===to.toLowerCase())continue;
   visited.add(who.toLowerCase());
   if(++checked>90)return {sender:null,windows,checked};
   try{
    const [code,bal,gas]=await Promise.all([
     rpc('eth_getCode',[who,'latest']),
     rpc('eth_call',[{to:CHAIN.usdc,data:ERC20.encodeFunctionData('balanceOf',[who])},'latest']),
     rpc('eth_getBalance',[who,'latest'])
    ]);
    if(code!=='0x'||BigInt(gas||'0x0')<1000000000000000n)continue;
    const [usdc]=ERC20.decodeFunctionResult('balanceOf',bal);
    if(usdc>=min)return {sender:who,usdcRaw:usdc.toString(),
     gasWei:String(BigInt(gas)),windows,checked,fromTx:event.transactionHash};
   }catch(e){console.log('CANDIDATE_UNAVAILABLE',who,String(e.message).slice(0,60))}
  }
 }
 return {sender:null,windows,checked};
}
assert.equal(CHAIN.id,1672);
const all={schema:'pharos-natural-payment-live-proof-v1',website:base,
 testAtUtc:new Date().toISOString(),chainId:1672,
 note:'Independently exercised deployed Cloudflare Worker and actual Pharos RPC. No user keys or transfers.'};
let health;
for(let i=0;i<26;i++){
 try{const r=await endpoint('/api/health');health=r.data;
  if(health.ok===true&&health.version===BUILD_VERSION)break;
  console.log('WAIT_FOR_DEPLOY',i+1,'Worker:',health.version,'Need:',BUILD_VERSION);
 }catch(e){console.log('WAIT_FOR_DEPLOY',i+1,String(e.message).slice(0,120))}
 await sleep(5000);
}
assert.equal(health?.version,BUILD_VERSION,'Cloudflare Worker version not deployed');
assert.equal(health.chainId,1672);
assert.equal(health.signatureSupported,false);
assert.equal(health.transactionBroadcast,false);
all.health=health;
const clarify=await endpoint('/api/parse',{text:'send 100 USDC to alice.eth'});
assert.equal(clarify.data.ok,false);assert.deepEqual(clarify.data.missing,['recipient','sender']);
all.clarification=clarify.data;
const blocked=await endpoint('/api/review',knownZero);
assert.equal(blocked.status,200);
assert.equal(blocked.data.ok,true);
assert.equal(blocked.data.readyForSignature,false);
assert.equal(blocked.data.review.chainId,1672);
assert.equal(blocked.data.review.token,'USDC');
assert.equal(blocked.data.review.tokenAddress.toLowerCase(),CHAIN.usdc.toLowerCase());
assert.equal(blocked.data.review.tokenInfo.verifiedCode,true);
assert.ok(blocked.data.review.checks.some(x=>x.check==='sufficient_token_balance'&&!x.ok));
assert.equal('unsignedTransaction' in blocked.data,false);
all.unfundedReject=blocked.data;
const denied=await endpoint('/api/prepare',{...knownZero,reviewId:blocked.data.reviewId});
assert.equal(denied.status,400);assert.equal(denied.data.ok,false);
assert.equal(denied.data.transactionBroadcast,undefined);
all.unconfirmedReject=denied.data;

all.discoveredPublicSender=await discoverSender();
console.log('LIVE_FUNDED_SENDER_SCAN',JSON.stringify(all.discoveredPublicSender));
if(all.discoveredPublicSender.sender){
 const request={text:instruction,sender:all.discoveredPublicSender.sender};
 const summary=await endpoint('/api/review',request);
 assert.equal(summary.status,200);
 assert.equal(summary.data.ok,true);
 assert.equal(summary.data.readyForSignature,true,'Candidate has sufficient USDC & gas but application refused review');
 assert.equal(summary.data.review.checks.length,7);
 assert.ok(summary.data.review.checks.every(x=>x.ok));
 const r=summary.data.review;
 assert.ok(BigInt(r.balanceRaw)>=parseUnits('100',6));
 assert.equal(r.tokenAddress.toLowerCase(),CHAIN.usdc.toLowerCase());
 assert.equal(r.chainId,1672);
 const draft=await endpoint('/api/prepare',{...request,reviewId:summary.data.reviewId,confirmed:true});
 assert.equal(draft.status,200);assert.equal(draft.data.ok,true);
 assert.equal(draft.data.signingPerformed,false);assert.equal(draft.data.transactionBroadcast,false);
 const tx=draft.data.unsignedTransaction;
 assert.equal(tx.from.toLowerCase(),r.from.toLowerCase());
 assert.equal(tx.to.toLowerCase(),CHAIN.usdc.toLowerCase());
 assert.equal(tx.chainId,'0x688');assert.equal(tx.value,'0x0');
 assert.ok(tx.data.startsWith('0xa9059cbb'));
 const decoded=ERC20.decodeFunctionData('transfer',tx.data);
 assert.equal(decoded[0],to);
 assert.equal(decoded[1],parseUnits('100',6));
 assert.ok(tx.gas&&tx.gasPrice&&tx.nonce);
 assert.ok(!('r' in tx||'s' in tx||'signature' in tx||'hash' in tx));
 all.verifiedLiveReview=summary.data;
 all.unsignedDraft=draft.data;
 console.log('LIVE_UNSIGNED_USDC_TRANSFER_VERIFIED',JSON.stringify({
  block:r.block,from:r.from,recipient:r.recipient,token:r.token,
  balance:r.balance,gasReserve:r.gasReservePROS,nonce:r.nonce,
  unsignedDataSelector:tx.data.slice(0,10),unsigned:true,signed:false,broadcast:false
 }));
}else{
 console.log('NO_LIVE_FUNDED_EOA_FOUND','Not fabricating a funded sender or a signed transaction.');
}
all.finishedAtUtc=new Date().toISOString();
await mkdir('proof',{recursive:true});
await writeFile('proof/live-payment-evidence.json',JSON.stringify(all,null,2)+'\n');
console.log('NATURAL_PAYMENT_AGENT_LIVE_SUCCESS',JSON.stringify({
 chainId:1672,block:blocked.data.review.block,contractVerified:true,
 clarificationVerified:true,insufficientBalanceBlocked:true,
 fundedSenderFound:Boolean(all.discoveredPublicSender.sender),
 unsignedDraftReady:Boolean(all.unsignedDraft),sent:false,output:'proof/live-payment-evidence.json'
}));
