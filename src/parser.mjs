import {getAddress} from 'ethers';

export const TOKENS=Object.freeze({
 USDC:{symbol:'USDC',contract:'0xC879C018dB60520F4355C26eD1a6D572cdAC1815',decimals:6,kind:'erc20'},
 WPROS:{symbol:'WPROS',contract:'0x52c48d4213107b20bc583832b0d951fb9ca8f0b0',decimals:18,kind:'erc20'},
 WETH:{symbol:'WETH',contract:'0x1f4b7011Ee3d53969bb67F59428a9ec0477856E9',decimals:18,kind:'erc20'},
 PROS:{symbol:'PROS',contract:null,decimals:18,kind:'native'}
});
const ZERO='0x0000000000000000000000000000000000000000';
export function validAddress(value){
 try{const s=getAddress(String(value||''));return s===ZERO?null:s}catch{return null}
}
const LIMIT=500;
export function parsePayment(input,opts={}){
 const text=String(input??'').trim();
 if(!text||text.length>LIMIT)return {ok:false,needsClarification:true,missing:['instruction'],
  question:'Enter one instruction, for example: send 100 USDC to 0xRecipientAddress on Pharos.'};
 // Deliberately narrow grammar: never interpret multiple payment instructions.
 const m=text.match(/^(?:please\s+)?(?:send|transfer|pay)\s+([0-9]+(?:\.[0-9]+)?)\s+([a-zA-Z][a-zA-Z0-9]{1,9})\s+to\s+(\S+?)(?:\s+on\s+pharos)?[!.]?$/i);
 if(!m)return {ok:false,needsClarification:true,missing:['instruction'],
  question:'Use one explicit payment: send 100 USDC to 0x... . Specify a single amount, token and recipient.'};
 const amount=m[1],symbol=m[2].toUpperCase(),recipientInput=m[3];
 const missing=[],questionParts=[];
 if(!/^[0-9]+(?:\.[0-9]+)?$/.test(amount)||!/[1-9]/.test(amount)){
  return {ok:false,needsClarification:true,missing:['amount'],question:'Enter a positive amount greater than zero.'};
 }
 if(!TOKENS[symbol]){
  missing.push('token');questionParts.push('Supported Pharos assets are USDC, PROS, WPROS and WETH. Which should I use?');
 }
 const config=TOKENS[symbol]||null;
 if(config&&amount.split('.')[1]?.length>config.decimals){
  return {ok:false,needsClarification:true,missing:['amount'],
   question:`The token ${symbol} supports at most ${config.decimals} decimal places. Enter an exact amount.`};
 }
 let recipient=validAddress(recipientInput);
 const override=String(opts.resolvedRecipient||'').trim();
 if(override){
  const checked=validAddress(override);
  if(!checked)return {ok:false,needsClarification:true,missing:['recipient'],
   question:'The provided resolved recipient is not a valid nonzero EVM address.'};
  if(recipient&&recipient!==checked)return {ok:false,needsClarification:true,missing:['recipient'],
   question:'The resolved recipient disagrees with the address in the instruction. Please correct it.'};
  recipient=checked;
 }
 if(!recipient){missing.push('recipient');
  questionParts.push(`What is the verified 0x wallet address for "${recipientInput}"? This app never guesses or silently resolves names.`)}
 const sender=validAddress(opts.sender);
 if(!sender){missing.push('sender');questionParts.push('What public Pharos sender wallet address should be checked for balance?')}
 if(missing.length)return {ok:false,needsClarification:true,missing,question:questionParts.join(' '),
  extracted:{amount,symbol,recipientInput,sender:sender||null}};
 if(sender===recipient)return {ok:false,needsClarification:true,missing:['recipient'],
  question:'Sender and recipient are identical. Enter a different recipient to avoid a pointless self-payment.'};
 return {ok:true,needsClarification:false,intent:{
  operation:'send',amount,symbol,sender,recipient,recipientInput,
  tokenKind:config.kind,tokenAddress:config.contract,decimals:config.decimals,chainId:1672
 }};
}
