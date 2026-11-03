import test from 'node:test';
import assert from 'node:assert/strict';
import {Interface,parseUnits} from 'ethers';
import {ERC20,reviewPayment,prepareUnsigned,intentFingerprint} from '../src/engine.mjs';
import {parsePayment,TOKENS} from '../src/parser.mjs';
const from='0x1111111111111111111111111111111111111111';
const to='0x2222222222222222222222222222222222222222';
const text='send 100 USDC to '+to;
const input={text,sender:from};
function mock({chain='0x688',tokens=250000000n,native=10n**18n,failGas=false}={}){
 const methods=[];
 const rpc=async(method,args=[])=>{
  methods.push(method);
  switch(method){
   case 'eth_chainId':return chain;
   case 'eth_blockNumber':return '0x1234';
   case 'eth_getBlockByNumber':return {timestamp:'0x6ad1af00'};
   case 'eth_getBalance':return '0x'+native.toString(16);
   case 'eth_gasPrice':return '0x2540be400';
   case 'eth_getCode':return '0x608060';
   case 'eth_getTransactionCount':return '0x2';
   case 'eth_estimateGas':
    if(failGas)throw Error('execution reverted');
    return '0xc350';
   case 'eth_call':{
    const t=ERC20.parseTransaction({data:args[0].data});
    if(t.name==='symbol')return ERC20.encodeFunctionResult('symbol',['USDC']);
    if(t.name==='decimals')return ERC20.encodeFunctionResult('decimals',[6]);
    if(t.name==='balanceOf')return ERC20.encodeFunctionResult('balanceOf',[tokens]);
    throw Error('Unexpected ERC-20 method');
   }
   default:throw Error('Forbidden method '+method);
  }
 };
 return {rpc,methods};
}
test('live ERC-20 validation generates human-readable review without unsigned transaction',async()=>{
 const m=mock();const r=await reviewPayment(m.rpc,input);
 assert.equal(r.ok,true);assert.equal(r.readyForSignature,true);
 assert.equal(r.review.status,'READY_FOR_USER_CONFIRMATION');
 assert.equal(r.review.amount,'100');assert.equal(r.review.token,'USDC');
 assert.equal(r.review.balance,'250.0');
 assert.equal(r.review.chainId,1672);
 assert.equal(r.review.block,'4660');
 assert.equal(r.review.checks.length,7);
 assert.ok(r.review.checks.every(c=>c.ok));
 assert.match(r.review.summary,/send 100 USDC/);
 assert.equal('unsignedTransaction' in r,false);
 assert.ok(m.methods.includes('eth_estimateGas'));
 assert.ok(!m.methods.some(x=>/^eth_send|sign/i.test(x)));
});
test('user-confirmed prepare creates correct calldata and full unsigned fields',async()=>{
 const first=await reviewPayment(mock().rpc,input);
 const r=await prepareUnsigned(mock().rpc,{...input,confirmed:true,reviewId:first.reviewId});
 assert.equal(r.ok,true);assert.equal(r.signingPerformed,false);
 assert.equal(r.transactionBroadcast,false);
 assert.equal(r.unsignedTransaction.chainId,'0x688');
 assert.equal(r.unsignedTransaction.from,from);
 assert.equal(r.unsignedTransaction.to.toLowerCase(),TOKENS.USDC.contract.toLowerCase());
 assert.equal(r.unsignedTransaction.value,'0x0');
 assert.equal(r.unsignedTransaction.nonce,'0x2');
 assert.equal(r.unsignedTransaction.gas,'0xea60');
 assert.ok(r.unsignedTransaction.data.startsWith('0xa9059cbb'));
 const decoded=ERC20.decodeFunctionData('transfer',r.unsignedTransaction.data);
 assert.equal(decoded[0],to);
 assert.equal(decoded[1],parseUnits('100',6));
 assert.equal('signature' in r.unsignedTransaction,false);
 assert.equal('hash' in r.unsignedTransaction,false);
});
test('cannot produce unsigned transaction before explicit confirmation or when intent changed',async()=>{
 const first=await reviewPayment(mock().rpc,input);
 const unconfirmed=await prepareUnsigned(mock().rpc,{...input,reviewId:first.reviewId});
 assert.equal(unconfirmed.ok,false);
 assert.match(unconfirmed.error,/confirmation/i);
 const changed=await prepareUnsigned(mock().rpc,{...input,text:'send 101 USDC to '+to,
  confirmed:true,reviewId:first.reviewId});
 assert.equal(changed.ok,false);assert.match(changed.error,/Intent changed/);
 assert.notEqual(intentFingerprint(parsePayment('send 101 USDC to '+to,{sender:from}).intent),first.reviewId);
});
test('insufficient token balance blocks preparation and is never labeled funded',async()=>{
 const less=mock({tokens:1000000n});
 const review=await reviewPayment(less.rpc,input);
 assert.equal(review.readyForSignature,false);
 assert.equal(review.review.checks.find(x=>x.check==='sufficient_token_balance').ok,false);
 const result=await prepareUnsigned(mock({tokens:1000000n}).rpc,{...input,confirmed:true,reviewId:review.reviewId});
 assert.equal(result.ok,false);
 assert.equal('unsignedTransaction' in result,false);
});
test('insufficient native PROS balance blocks token payment',async()=>{
 const r=await reviewPayment(mock({native:0n}).rpc,input);
 assert.equal(r.readyForSignature,false);
 assert.equal(r.review.checks.find(x=>x.check==='sufficient_native_gas').ok,false);
});
test('gas estimation error and wrong chain fail safely',async()=>{
 const blocked=await reviewPayment(mock({failGas:true}).rpc,input);
 assert.equal(blocked.readyForSignature,false);
 assert.equal(blocked.review.checks.find(c=>c.check==='gas_estimation').ok,false);
 await assert.rejects(reviewPayment(mock({chain:'0x1'}).rpc,input),/Wrong chain/);
});
test('supports native PROS unsigned transfer with amount plus gas balance check',async()=>{
 const req={text:'send 0.01 PROS to '+to,sender:from};
 const r=await reviewPayment(mock().rpc,req);
 assert.equal(r.ok,true);assert.equal(r.readyForSignature,true);
 const tx=await prepareUnsigned(mock().rpc,{...req,reviewId:r.reviewId,confirmed:true});
 assert.equal(tx.ok,true);assert.equal(tx.unsignedTransaction.to,to);
 assert.equal(tx.unsignedTransaction.value,'0x'+parseUnits('0.01',18).toString(16));
 assert.equal(tx.unsignedTransaction.data,'0x');
 const error=await reviewPayment(mock({native:parseUnits('0.01',18)}).rpc,req);
 assert.equal(error.readyForSignature,false);
});
