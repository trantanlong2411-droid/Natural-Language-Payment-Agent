import test from 'node:test';
import assert from 'node:assert/strict';
import {parsePayment,TOKENS} from '../src/parser.mjs';
const from='0x1111111111111111111111111111111111111111';
const to='0x2222222222222222222222222222222222222222';
test('parses the task example but asks for name resolution and sender',()=>{
 const p=parsePayment('send 100 USDC to alice.eth');
 assert.equal(p.ok,false);assert.deepEqual(p.missing,['recipient','sender']);
 assert.match(p.question,/verified 0x wallet address/);
});
test('the same example becomes a complete intent only with verified 0x addresses',()=>{
 const p=parsePayment('Send 100 USDC to alice.eth',{sender:from,resolvedRecipient:to});
 assert.equal(p.ok,true);assert.equal(p.intent.amount,'100');
 assert.equal(p.intent.symbol,'USDC');assert.equal(p.intent.recipient,to);
 assert.equal(p.intent.sender,from);assert.equal(p.intent.chainId,1672);
 assert.equal(p.intent.tokenAddress.toLowerCase(),TOKENS.USDC.contract.toLowerCase());
});
test('free text with literal recipient address parses without a name mapping',()=>{
 const p=parsePayment('please transfer 0.0123 WPROS to '+to+' on Pharos',{sender:from});
 assert.equal(p.ok,true);assert.equal(p.intent.symbol,'WPROS');
 assert.equal(p.intent.amount,'0.0123');
});
test('unrecognized assets and missing fields request clarification',()=>{
 const missing=parsePayment('send 20 USDC to '+to);
 assert.deepEqual(missing.missing,['sender']);
 const bad=parsePayment('send 10 DOGE to '+to,{sender:from});
 assert.deepEqual(bad.missing,['token']);
 assert.match(bad.question,/Supported Pharos assets/);
});
test('rejects malformed addresses, overdetailed amounts and ambiguous multiple commands',()=>{
 assert.equal(parsePayment('send 1.0000001 USDC to '+to,{sender:from}).ok,false);
 assert.equal(parsePayment('send 100 USDC to '+to+' and 3 USDC to '+from,{sender:from}).ok,false);
 assert.equal(parsePayment('send 1e3 USDC to '+to,{sender:from}).ok,false);
 assert.equal(parsePayment('send 0 USDC to '+to,{sender:from}).ok,false);
 assert.equal(parsePayment('send 1 USDC to '+to,{sender:to}).ok,false);
 const mismatch=parsePayment('send 10 USDC to '+to,{sender:from,resolvedRecipient:from});
 assert.match(mismatch.question,/disagrees/);
});
