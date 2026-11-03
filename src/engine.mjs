import {Interface,parseUnits,formatUnits,keccak256,toUtf8Bytes} from 'ethers';
import {parsePayment,TOKENS} from './parser.mjs';

export const CHAIN={id:1672,name:'Pharos Pacific Mainnet',rpc:'https://rpc.pharos.xyz',
 explorer:'https://pharosscan.xyz',native:'PROS'};
export const ERC20=new Interface([
 'function balanceOf(address) view returns(uint256)',
 'function decimals() view returns(uint8)',
 'function symbol() view returns(string)',
 'function transfer(address,uint256) returns(bool)'
]);
const quantity=n=>'0x'+BigInt(n).toString(16);
const zero='0x0000000000000000000000000000000000000000';
const positiveHex=x=>typeof x==='string'&&/^0x[0-9a-fA-F]+$/.test(x);
const asBig=(x,label)=>{if(!positiveHex(x))throw Error('Invalid RPC '+label);return BigInt(x)};
const observedAt=()=>new Date().toISOString();

export function intentFingerprint(intent){
 // A matching draft identifier only binds client intent. It is not authentication.
 const canonical=[1672,intent.sender.toLowerCase(),intent.recipient.toLowerCase(),
  intent.symbol,intent.tokenAddress?.toLowerCase()||'native',intent.amount];
 return keccak256(toUtf8Bytes(JSON.stringify(canonical)));
}
async function read(rpc,to,method,args,block){
 const data=ERC20.encodeFunctionData(method,args);
 const value=await rpc('eth_call',[{to,data},block]);
 if(typeof value!=='string'||!value.startsWith('0x')||value==='0x')throw Error('Missing contract response: '+method);
 return ERC20.decodeFunctionResult(method,value)[0];
}
function publicSummary(intent,balance,limit,gasCost){
 return `You are preparing to send ${intent.amount} ${intent.symbol} from ${intent.sender} to ${intent.recipient} on Pharos Mainnet (chain 1672). Verified on-chain balance: ${balance} ${intent.symbol}; required: ${intent.amount} ${intent.symbol}. Estimated maximum gas reserve at the observed price: ${gasCost} PROS. No funds have moved. You must independently review and sign with your own wallet after exporting the unsigned transaction.`;
}
export async function reviewPayment(rpc,input,now=observedAt()){
 const parsed=parsePayment(input?.text,{sender:input?.sender,resolvedRecipient:input?.resolvedRecipient});
 if(!parsed.ok)return {ok:false,needsClarification:true,question:parsed.question,
  missing:parsed.missing,extracted:parsed.extracted||null};
 const intent=parsed.intent,asset=TOKENS[intent.symbol];
 const chainId=asBig(await rpc('eth_chainId',[]),'chain ID');
 if(chainId!==1672n)throw Error('Wrong chain: only Pharos Pacific Mainnet (1672) is supported');
 const block=await rpc('eth_blockNumber',[]);
 const number=asBig(block,'block');
 if(number<=0n)throw Error('Invalid current block');
 const header=await rpc('eth_getBlockByNumber',[block,false]);
 if(!header?.timestamp)throw Error('Missing verified block timestamp');
 const nativeBalance=asBig(await rpc('eth_getBalance',[intent.sender,block]),'native balance');
 const gasPrice=asBig(await rpc('eth_gasPrice',[]),'gas price');
 if(gasPrice<=0n)throw Error('Missing gas price');
 let tokenBalance=nativeBalance,tokenInfo=null;
 if(asset.kind==='erc20'){
  const code=await rpc('eth_getCode',[asset.contract,block]);
  if(!code||code==='0x')throw Error('Expected ERC-20 token contract does not exist on Pharos');
  const [decimals,symbol,balance]=await Promise.all([
   read(rpc,asset.contract,'decimals',[],block),
   read(rpc,asset.contract,'symbol',[],block),
   read(rpc,asset.contract,'balanceOf',[intent.sender],block)
  ]);
  if(Number(decimals)!==asset.decimals||String(symbol).toUpperCase()!==asset.symbol)
   throw Error('Token contract metadata mismatch: refusing to draft payment');
  tokenBalance=BigInt(balance);
  tokenInfo={address:asset.contract,symbol:String(symbol),decimals:Number(decimals),
   verifiedCode:true,methods:['decimals()','symbol()','balanceOf(address)']};
 }
 const units=parseUnits(intent.amount,asset.decimals);
 if(units<=0n)throw Error('Payment amount must be positive');
 const tokenEnough=tokenBalance>=units;
 const transferData=asset.kind==='erc20'?ERC20.encodeFunctionData('transfer',[intent.recipient,units]):'0x';
 const transferTo=asset.kind==='erc20'?asset.contract:intent.recipient;
 const transaction={from:intent.sender,to:transferTo,value:asset.kind==='native'?quantity(units):'0x0',data:transferData};
 // Estimate only when a token balance check permits the transfer.
 let gasEstimate=null,gasEstimateError=null;
 if(tokenEnough){
  try{gasEstimate=asBig(await rpc('eth_estimateGas',[transaction]),'gas estimation');
   if(gasEstimate===0n)throw Error('Zero gas quote');
  }catch(e){gasEstimateError=String(e.message||e).slice(0,200)}
 }
 const gasLimit=gasEstimate!==null?(gasEstimate*120n+99n)/100n:null;
 const maxFee=gasLimit!==null?gasLimit*gasPrice:null;
 const gasEnough=maxFee!==null&&nativeBalance>=(asset.kind==='native'?units:0n)+maxFee;
 const checks=[
  {check:'recipient_format',ok:true,detail:'Valid nonzero EVM address; no unresolved name'},
  {check:'sender_format',ok:true,detail:'Valid nonzero EVM address'},
  {check:'network',ok:true,detail:'Pharos Pacific Mainnet 1672'},
  {check:'token_contract',ok:asset.kind==='native'||Boolean(tokenInfo),
   detail:asset.kind==='native'?'Native PROS, no contract needed':'Verified deployed contract, symbol and decimals'},
  {check:'sufficient_token_balance',ok:tokenEnough,
   detail:`Balance ${formatUnits(tokenBalance,asset.decimals)} ${intent.symbol}; transfer ${intent.amount} ${intent.symbol}`},
  {check:'gas_estimation',ok:gasEstimate!==null,detail:gasEstimate!==null?
   `Live eth_estimateGas: ${gasEstimate.toString()}`:(gasEstimateError||'Unavailable until token balance is sufficient')},
  {check:'sufficient_native_gas',ok:gasEnough,detail:gasLimit===null?
   'No reliable gas quote; cannot prepare fully specified unsigned transaction':
   `Wallet ${formatUnits(nativeBalance,18)} PROS; upper gas reserve ${formatUnits(maxFee,18)} PROS`}
 ];
 const ready=checks.every(c=>c.ok);
 const balance=formatUnits(tokenBalance,asset.decimals);
 const nonce=ready?await rpc('eth_getTransactionCount',[intent.sender,'pending']):null;
 if(ready&&!positiveHex(nonce))throw Error('Cannot read pending nonce');
 const reviewId=intentFingerprint(intent);
 return {ok:true,readyForSignature:ready,reviewId,review:{
  status:ready?'READY_FOR_USER_CONFIRMATION':'BLOCKED_BY_VALIDATION',
  network:CHAIN.name,chainId:1672,block:number.toString(),
  blockTimestamp:new Date(Number(asBig(header.timestamp,'timestamp'))*1000).toISOString(),
  observedAt:now,operation:'send',amount:intent.amount,token:intent.symbol,
  from:intent.sender,recipient:intent.recipient,recipientInput:intent.recipientInput,
  tokenAddress:asset.contract,decimals:asset.decimals,
  amountRaw:units.toString(),balanceRaw:tokenBalance.toString(),balance,
  nativeGasBalance:formatUnits(nativeBalance,18),
  gasPriceWei:gasPrice.toString(),gasEstimate:gasEstimate?.toString()??null,
  gasLimit:gasLimit?.toString()??null,gasReservePROS:maxFee!==null?formatUnits(maxFee,18):null,
  nonce:nonce===null?null:asBig(nonce,'nonce').toString(),checks,
  summary:publicSummary(intent,balance,asset,gasLimit!==null?formatUnits(maxFee,18):'UNAVAILABLE'),
  tokenInfo,source:{contract:asset.contract,block:number.toString(),
   methods:asset.kind==='erc20'?['eth_getCode','decimals','symbol','balanceOf','eth_getBalance','eth_gasPrice','eth_estimateGas','eth_getTransactionCount']:
   ['eth_getBalance','eth_gasPrice','eth_estimateGas','eth_getTransactionCount']},
  limitations:[
   'Public wallet balance does not prove that you own or can sign for the sender.',
   'The gas quote, pending nonce, sender balance and token state can change before signature.',
   'An eth_estimateGas success does not guarantee that a later transaction will succeed.',
   'No private keys are collected, and no transaction is signed or broadcast.'
  ]
 },internals:{to:transaction.to,value:transaction.value,data:transaction.data}};
}
export async function prepareUnsigned(rpc,input){
 if(input?.confirmed!==true)return {ok:false,error:'Explicit user review confirmation is required before generating the unsigned transaction.'};
 if(typeof input.reviewId!=='string'||!/^0x[0-9a-f]{64}$/i.test(input.reviewId))
  return {ok:false,error:'Missing or invalid review identifier.'};
 const verified=await reviewPayment(rpc,input);
 if(!verified.ok)return verified;
 if(verified.reviewId!==input.reviewId)
  return {ok:false,error:'Intent changed after review. Review the payment again before generating.'};
 if(!verified.readyForSignature)return {ok:false,error:'Balance, gas or contract validation failed. No unsigned transaction was produced.',review:verified.review};
 const r=verified.review;
 const unsignedTransaction={
  chainId:quantity(CHAIN.id),from:r.from,to:verified.internals.to,
  value:verified.internals.value,data:verified.internals.data,
  gas:quantity(r.gasLimit),gasPrice:quantity(r.gasPriceWei),
  nonce:quantity(r.nonce)
 };
 return {ok:true,status:'UNSIGNED_READY_FOR_EXTERNAL_WALLET_REVIEW',
  confirmedByClient:true,createdAt:observedAt(),reviewId:verified.reviewId,
  summary:r.summary,review:r,unsignedTransaction,
  warning:'THIS IS NOT SIGNED OR SENT. Only the owner of the FROM wallet can sign with their own wallet. Review recipient, chain, amount and gas again before signing.',
  signingPerformed:false,transactionBroadcast:false,privateKeysUsed:false,
  actionPattern:['PARSE','VALIDATE','REVIEW','USER_CONFIRMATION','UNSIGNED_TRANSACTION_ONLY']};
}
