import {CHAIN,reviewPayment,prepareUnsigned} from './engine.mjs';
import {parsePayment} from './parser.mjs';
import {HTML} from './page.mjs';
import {PROOF_HTML} from './proof.mjs';
export const BUILD_VERSION='pharos-payment-agent-2026-11-03-v1';
const allow=new Set(['eth_chainId','eth_blockNumber','eth_getBlockByNumber',
 'eth_getCode','eth_call','eth_getBalance','eth_gasPrice','eth_estimateGas','eth_getTransactionCount']);
let counter=0;
async function rpc(method,params=[]){
 if(!allow.has(method))throw Error('Forbidden RPC method: '+method);
 let last=null;
 for(let k=0;k<3;k++){
  try{
   const id=++counter;
   const response=await fetch(CHAIN.rpc,{method:'POST',headers:{'content-type':'application/json'},
    body:JSON.stringify({jsonrpc:'2.0',id,method,params}),signal:AbortSignal.timeout(14000)});
   if(!response.ok)throw Error('Pharos RPC HTTP '+response.status);
   const data=await response.json();
   if(data.jsonrpc!=='2.0'||data.id!==id)throw Error('RPC response ID mismatch');
   if(data.error)throw Error(method+': '+String(data.error.message||'unknown'));
   if(data.result===null||data.result===undefined)throw Error(method+' returned null');
   return data.result;
  }catch(e){last=e;if(k<2)await new Promise(r=>setTimeout(r,400*(k+1)))}
 }
 throw Error(String(last?.message||last||'RPC unavailable').slice(0,220));
}
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{
 'content-type':'application/json;charset=utf-8','cache-control':'no-store',
 'x-content-type-options':'nosniff','access-control-allow-origin':'same-origin'}});}
function html(data){return new Response(data,{headers:{
 'content-type':'text/html;charset=utf-8','cache-control':'no-store',
 'x-content-type-options':'nosniff',
 'content-security-policy':"default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"
}})}
async function body(request){
 if(Number(request.headers.get('content-length')||'0')>2000)throw Error('Request too large');
 const text=await request.text();
 if(text.length>2000)throw Error('Request too large');
 const value=JSON.parse(text);
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('JSON object required');
 return value;
}
export default {
 async fetch(request){
  const url=new URL(request.url);
  if(request.method==='GET'){
   if(url.pathname==='/'||url.pathname==='/index.html')return html(HTML);
   if(url.pathname==='/proof'||url.pathname==='/proof/')return html(PROOF_HTML);
   if(url.pathname==='/api/health')return json({ok:true,name:'Natural-Language Payment Agent',
    version:BUILD_VERSION,chainId:1672,rpc:CHAIN.rpc,readOnlyRpc:true,
    signatureSupported:false,sendSupported:false,transactionBroadcast:false,
    endpoints:['/api/parse','/api/review','/api/prepare'],note:'Live chain validation requires POST /api/review'});
   return json({ok:false,error:'Not found'},404);
  }
  if(request.method!=='POST'||!['/api/parse','/api/review','/api/prepare'].includes(url.pathname))
   return json({ok:false,error:'Not found'},404);
  let input;
  try{input=await body(request)}
  catch(e){return json({ok:false,error:String(e.message||e)},400)}
  try{
   if(url.pathname==='/api/parse')
    return json({version:BUILD_VERSION,...parsePayment(input.text,{sender:input.sender,resolvedRecipient:input.resolvedRecipient})});
   if(url.pathname==='/api/review'){
    const data=await reviewPayment(rpc,input);
    const {internals,...visible}=data;
    return json({version:BUILD_VERSION,...visible});
   }
   const data=await prepareUnsigned(rpc,input);
   return json({version:BUILD_VERSION,...data},data.ok?200:400);
  }catch(e){
   return json({ok:false,version:BUILD_VERSION,
    error:String(e.message||e).slice(0,300),unsignedTransaction:null,
    signingPerformed:false,transactionBroadcast:false},502);
  }
 }
};
