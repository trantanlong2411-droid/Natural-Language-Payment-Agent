import assert from 'node:assert/strict';
import {Interface,id,getAddress,formatUnits,parseUnits} from 'ethers';
import {mkdir,writeFile} from 'node:fs/promises';
import {CHAIN,ERC20,reviewPayment,prepareUnsigned} from '../src/engine.mjs';
let requestId=0;
const rpc=async(method,params=[])=>{
 const res=await fetch(CHAIN.rpc,{method:'POST',headers:{'content-type':'application/json'},
  body:JSON.stringify({jsonrpc:'2.0',id:++requestId,method,params}),signal:AbortSignal.timeout(15000)});
 if(!res.ok)throw Error('RPC HTTP '+res.status);
 const v=await res.json();
 if(v.error)throw Error(method+': '+v.error.message);
 if(v.result===undefined||v.result===null)throw Error(method+' returned no result');
 return v.result;
};
const call=async(method,args=[])=>{
 const data=ERC20.encodeFunctionData(method,args);
 const response=await rpc('eth_call',[{to:CHAIN.usdc,data},'latest']);
 return ERC20.decodeFunctionResult(method,response)[0];
};
const chainId=BigInt(await rpc('eth_chainId',[]));
assert.equal(chainId,1672n,'Expected Pharos Pacific Mainnet 1672');
const tip=BigInt(await rpc('eth_blockNumber',[]));
const bytecode=await rpc('eth_getCode',[CHAIN.usdc,'latest']);
assert.ok(bytecode?.length>4,'Circle USDC code not present');
const [symbol,decimals]=await Promise.all([call('symbol'),call('decimals')]);
assert.equal(String(symbol).toUpperCase(),'USDC');
assert.equal(Number(decimals),6);
const report={schema:'pharos-natural-payment-real-rpc-contract-audit-v1',
 observedAtUtc:new Date().toISOString(),chainId:1672,tipBlock:tip.toString(),
 rpc:CHAIN.rpc,contract:CHAIN.usdc,symbol:String(symbol),decimals:Number(decimals),
 deployedCode:true,source:'Actual read-only Pharos RPC',
 noSigning:true,noBroadcast:true,candidate:null,scan:{windows:0,candidatesChecked:0,errors:[]}};
console.log('OFFICIAL_CIRCLE_USDC_ONCHAIN_VERIFIED',JSON.stringify({chainId:1672,block:tip.toString(),
 contract:CHAIN.usdc,symbol:String(symbol),decimals:Number(decimals)}));
const seen=new Set(),min=100000000n,topic=id('Transfer(address,address,uint256)');
outer:for(let i=0;i<18;i++){
 const high=tip-BigInt(i*900),low=high>899n?high-899n:0n;
 let logs;
 try{logs=await rpc('eth_getLogs',[{address:CHAIN.usdc,
  fromBlock:'0x'+low.toString(16),toBlock:'0x'+high.toString(16),
  topics:[topic]}]);
  report.scan.windows++;
 }catch(e){report.scan.errors.push(String(e.message||e).slice(0,90));continue;}
 for(const entry of [...logs].reverse()){
  if(!entry?.topics||entry.topics.length!==3||BigInt(entry.data||'0x0')<min)continue;
  const who=getAddress('0x'+entry.topics[2].slice(-40));
  if(seen.has(who.toLowerCase()))continue;
  seen.add(who.toLowerCase());
  if(report.scan.candidatesChecked++>70)break outer;
  try{
   const [contractCode,native,tokenBal]=await Promise.all([
    rpc('eth_getCode',[who,'latest']),
    rpc('eth_getBalance',[who,'latest']),
    call('balanceOf',[who])
   ]);
   if(contractCode!=='0x'||BigInt(native)<1000000000000000n||BigInt(tokenBal)<min)continue;
   report.candidate={address:who,usdcRaw:BigInt(tokenBal).toString(),
    usdcBalance:formatUnits(tokenBal,6),prosBalance:formatUnits(native,18),
    lastObservedTransferTx:entry.transactionHash,verifiedEOA:true,verifiedAtUtc:new Date().toISOString()};
   break outer;
  }catch(e){report.scan.errors.push(String(e.message||e).slice(0,95))}
 }
}
if(report.candidate){
 const intent={text:'send 100 USDC to 0x2222222222222222222222222222222222222222',
  sender:report.candidate.address};
 const actual=await reviewPayment(rpc,intent);
 report.positiveLiveReview={
  status:actual.review?.status||'NO_REVIEW',ready:actual.readyForSignature===true,
  reviewId:actual.reviewId,summary:actual.review?.summary||null,
  checks:actual.review?.checks||[],sourceBlock:actual.review?.block||null
 };
 if(!actual.readyForSignature){
  report.positiveDraftError='Public sender has USDC/PROS, but transfer preflight did not pass. No draft fabricated.';
  console.log('READ_ONLY_DRAFT_BLOCKED',JSON.stringify(report.positiveLiveReview));
 }else{
  const output=await prepareUnsigned(rpc,{...intent,reviewId:actual.reviewId,confirmed:true});
  assert.equal(output.ok,true,'Expected positive unsigned transaction result');
  assert.equal(output.signingPerformed,false);
  assert.equal(output.transactionBroadcast,false);
  const tx=output.unsignedTransaction;
  assert.equal(tx.chainId,'0x688');
  assert.equal(tx.from.toLowerCase(),report.candidate.address.toLowerCase());
  assert.equal(tx.to.toLowerCase(),CHAIN.usdc.toLowerCase());
  assert.equal(tx.value,'0x0');
  assert.ok(tx.gas&&tx.gasPrice&&tx.nonce);
  const [dest,amount]=ERC20.decodeFunctionData('transfer',tx.data);
  assert.equal(dest,'0x2222222222222222222222222222222222222222');
  assert.equal(amount,parseUnits('100',6));
  assert.ok(!('signature' in tx||'hash' in tx));
  report.positiveLiveUnsigned={transaction:tx,review:output.review,
   actionPattern:output.actionPattern,signingPerformed:false,transactionBroadcast:false,
   projectControlsSender:false};
  console.log('LIVE_MAINNET_POSITIVE_UNSIGNED_DRAFT_VERIFIED',JSON.stringify({
   sender:report.candidate.address,block:output.review.block,token:'USDC',amount:'100',
   onchainBalance:output.review.balance,gasReserve:output.review.gasReservePROS,
   recipient:dest,selector:tx.data.slice(0,10),
   signed:false,broadcast:false,rawProof:'proof/live-rpc-contract-audit.json'
  }));
 }
}
await mkdir('proof',{recursive:true});
await writeFile('proof/live-rpc-contract-audit.json',JSON.stringify(report,null,2)+'\n');
console.log('MAINNET_RPC_AUDIT_SUCCESS',JSON.stringify({
 chainId:1672,contract:CHAIN.usdc,block:tip.toString(),
 sampleEOAFound:Boolean(report.candidate),candidate:report.candidate,positiveUnsignedVerified:Boolean(report.positiveLiveUnsigned),
 windows:report.scan.windows,checked:report.scan.candidatesChecked,output:'proof/live-rpc-contract-audit.json'}));
