export const HTML = String.raw`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Natural-Language Payment Agent | Pharos</title>
<meta name="description" content="Parse plain-English payments, validate public Pharos balances and token contracts, and build a transaction for external wallet signature only.">
<style>
:root{color-scheme:dark;--bg:#070d1e;--surface:#121e39;--border:#354765;--muted:#a3b7dc;--text:#eef4ff;--cyan:#81e5f2;--accent:#b7c4ff;--green:#82edc5;--gold:#ffda9b;--bad:#ff99a8}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:radial-gradient(ellipse at 3% -10%,#23416f,#0a1530 48%,#070d1e 88%);color:var(--text);font:14px/1.6 system-ui,Segoe UI,sans-serif}
main{width:min(1180px,100%);margin:0 auto;padding:27px 20px 65px}h1{font-size:clamp(41px,7.5vw,78px);line-height:1.02;letter-spacing:-.065em;margin:55px 0 18px}h1 em{font-style:normal;color:var(--accent)}h2{font-size:22px;margin:0 0 12px}h3{font-size:15px;margin:12px 0 5px}p{margin:8px 0}
header,.row{display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap}
header{font-size:12px;letter-spacing:.08em;color:#c0d2ff}a{color:#c7d5ff}.chip{display:inline-block;border:1px solid #5a73a7;border-radius:100px;padding:4px 10px;letter-spacing:0}
.lead{max-width:860px;font-size:18px;color:var(--muted)}.banner{border:1px solid #836f46;background:#342c23;color:#ffdfa9;border-radius:12px;padding:14px;margin:22px 0}
.steps{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:26px 0}.steps>div{background:#122443;border:1px solid #35547a;border-radius:12px;padding:15px}.steps strong{color:var(--cyan);display:block}.steps small{color:var(--muted)}
.columns{display:grid;grid-template-columns:1.12fr .88fr;gap:17px}.panel{background:rgba(19,31,58,.96);border:1px solid var(--border);border-radius:18px;padding:23px;margin:0 0 17px}
label{display:block;font-size:12px;color:#b7caec;margin:13px 0 6px}
input,textarea{display:block;width:100%;padding:12px 14px;color:var(--text);background:#08152e;border:1px solid #4b6287;border-radius:10px;font:inherit}
textarea{resize:vertical;min-height:98px}input:focus,textarea:focus{outline:2px solid #8eb4f3;outline-offset:1px}
button{border:0;border-radius:10px;background:#b5c9ff;color:#071834;padding:11px 16px;font-weight:760;font-size:13px;cursor:pointer}
button.secondary{background:#354d76;color:#edf3ff}button:disabled{opacity:.42;cursor:not-allowed}.actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:15px}
small,.small{font-size:12px;color:var(--muted)}.status{min-height:32px;margin:12px 0;padding:10px 12px;background:#0b1b37;border:1px solid #374f72;border-radius:10px;overflow-wrap:anywhere}
.kpis{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:12px 0}.kpi{border:1px solid #334b70;border-radius:10px;background:#0a1934;padding:12px;overflow-wrap:anywhere}
.kpi small{display:block}.kpi b{display:block;font-size:16px;word-break:break-word}
.check{display:flex;gap:8px;align-items:flex-start;border-bottom:1px solid #324662;padding:8px 2px}.pass{color:var(--green)}.fail{color:var(--bad)}.muted{color:var(--muted)}
pre{background:#08142c;border:1px solid #354b6e;padding:15px;border-radius:10px;max-height:400px;overflow:auto;overflow-wrap:anywhere;white-space:pre-wrap;font:12px/1.65 ui-monospace,Consolas,monospace}
hr{border:0;border-top:1px solid #344962;margin:20px 0}.agree{display:flex;align-items:flex-start;gap:9px;padding:12px;background:#0a1a35;border:1px solid #456187;border-radius:10px;margin-top:16px}.agree input{width:20px;height:20px;margin:2px 0 0;accent-color:#9abaff}
#reviewPanel,#outputPanel{display:none}#reviewPanel.visible,#outputPanel.visible{display:block}
details{margin-top:15px}summary{cursor:pointer;color:var(--accent)}footer{font-size:12px;color:var(--muted);margin-top:27px}
@media(max-width:820px){.columns,.steps{grid-template-columns:1fr}.steps{grid-template-columns:1fr 1fr}h1{margin-top:30px}}
@media(max-width:480px){.steps,.kpis{grid-template-columns:1fr}}
</style></head><body><main>
<header><span>PHAROS / AGENT ARENA <span class="chip">MEDIUM · PAYMENTS</span></span><nav><a href="/proof">Proof & reviewer guide ↗</a> · <a href="https://github.com/trantanlong2411-droid/Natural-Language-Payment-Agent" target="_blank" rel="noopener">GitHub ↗</a></nav></header>
<h1>NATURAL-LANGUAGE<br><em>PAYMENT AGENT</em></h1>
<p class="lead">Turn a plain-English instruction into a validated, human-reviewed, unsigned Pharos transaction. No private keys. No automatic signing or broadcasting. This is an explicit action pipeline, not a chat model.</p>
<div class="banner">This app reads public blockchain data only and never sends funds. A public sender address does not prove you own its private key. Do not sign payments unless you independently verify the recipient and amount. Names such as alice.eth are never silently guessed or resolved.</div>
<div class="steps">
<div><strong>01 · PARSE</strong><small>Extract amount, asset and payee</small></div>
<div><strong>02 · VALIDATE</strong><small>Token, balance, chain and gas</small></div>
<div><strong>03 · REVIEW</strong><small>Read all details before action</small></div>
<div><strong>04 · UNSIGNED</strong><small>Export wallet-ready transaction data</small></div>
</div>
<div class="columns">
<div>
<section class="panel">
<h2>01 / Describe a payment</h2>
<label for="instruction">Natural-language instruction</label>
<textarea id="instruction" spellcheck="false">send 100 USDC to alice.eth</textarea>
<p class="small">Try: “send 100 USDC to 0x...” or “pay 0.01 PROS to 0x...”. Exact syntax, one transfer per instruction. If a field is missing, the agent asks for it.</p>
<label for="sender">Public sender address · 0x... (required for balance validation)</label>
<input id="sender" placeholder="0x... public Pharos address" spellcheck="false">
<label for="recipient">Verified recipient address · optional when already in instruction</label>
<input id="recipient" placeholder="0x... (resolve alice.eth manually)" spellcheck="false">
<div class="actions"><button id="parse">Parse my instruction</button><button id="review" class="secondary">Validate on Pharos Mainnet</button></div>
<p id="message" class="status" role="status">Start by parsing a payment. You can complete an unresolved recipient or sender after the agent asks.</p>
<details><summary>Parsed intent or missing fields</summary><pre id="parsed">No input parsed yet.</pre></details>
</section>
<section id="reviewPanel" class="panel">
<h2>02 / Verified summary · read before signing</h2>
<p id="reviewSummary"></p>
<div class="kpis">
<div class="kpi"><small>PAYMENT</small><b id="payAmount">—</b></div>
<div class="kpi"><small>VALIDATED BALANCE</small><b id="payBalance">—</b></div>
<div class="kpi"><small>BLOCK · PHAROS 1672</small><b id="payBlock">—</b></div>
<div class="kpi"><small>MAX ESTIMATED GAS RESERVE</small><b id="payGas">—</b></div>
</div>
<h3>Source-backed validation checklist</h3><div id="checks"></div>
<p class="small">The token contract, amount, from/to addresses and exact calldata will be captured in the unsigned transaction only after you confirm. RPC gas and nonce may change before signing.</p>
<div class="agree"><input type="checkbox" id="confirmed"><label for="confirmed" style="margin:0">I have checked the amount, recipient, sender, token and chain. I want only unsigned transaction data; I understand that no funds will be sent.</label></div>
<div class="actions"><button id="prepare" disabled>Generate unsigned transaction</button></div>
<details><summary>Full on-chain review JSON</summary><pre id="fullReview">No reviewed data yet.</pre></details>
</section>
<section id="outputPanel" class="panel">
<div class="row"><h2>03 / Prepared — not signed</h2><strong class="pass">UNSIGNED ONLY</strong></div>
<p class="status" id="successText"></p>
<pre id="unsignedJson"></pre>
<div class="actions"><button id="copy">Copy unsigned JSON</button><button id="export" class="secondary">Export full JSON proof</button></div>
<p class="small">No signatures, transfer receipts or transaction hashes exist. If you actually own the sender wallet, a trusted wallet may review and sign this data independently. Revalidate balance, gas, nonce and payee before signing.</p>
</section>
</div>
<aside>
<section class="panel"><h2>04 / Safety rules</h2>
<div class="check"><span class="pass">✓</span><span>Only Pharos Pacific Mainnet (chain ID 1672).</span></div>
<div class="check"><span class="pass">✓</span><span>USDC uses Circle's official token contract; other supported token contracts are checked on-chain.</span></div>
<div class="check"><span class="pass">✓</span><span>Recipient must be a nonzero EVM address, not an unverified name.</span></div>
<div class="check"><span class="pass">✓</span><span>Insufficient token or native gas balance blocks preparation.</span></div>
<div class="check"><span class="pass">✓</span><span>The output contains transaction fields for independent wallet signature, never a private key or signed transaction.</span></div>
<hr>
<h3>Supported assets</h3>
<p>USDC · PROS · WPROS · WETH</p>
<h3>Why does “alice.eth” need a follow-up?</h3>
<p class="muted">A nickname or ENS-like name is not sufficient proof of a Pharos recipient. This version requires an explicitly confirmed 0x address, avoiding transfers to a guessed account.</p>
<h3>Live availability</h3><p class="muted">The server uses a fixed Pharos RPC and never invokes eth_sendTransaction or eth_sendRawTransaction. All outputs are reviewable on this page.</p>
</section>
<section class="panel">
<h2>05 / Independent reviewer</h2>
<p>Inspect the parser's clarification branch, then provide public addresses to test live balance validation. Export an unsigned payment only when the on-chain sender has both the asset balance and sufficient PROS gas.</p>
<p><a href="/proof">Open the full proof walkthrough ↗</a></p>
<p><a href="/api/health">Worker health endpoint ↗</a></p>
<p><a href="https://www.circle.com/blog/now-available-usdc-cctp-on-pharos" target="_blank" rel="noopener">Official Circle USDC on Pharos ↗</a></p>
</section>
</aside>
</div>
<footer>Natural-Language Payment Agent · Read-only RPC and unsigned transaction drafts only. Pharos Mainnet transactions involve real assets if you later sign elsewhere. No transfers are made on this website.</footer>
</main>
<script>
(()=>{
 const $=id=>document.getElementById(id);
 let latestReview=null,latestPrepared=null,latestRaw=null;
 const inputs=['instruction','sender','recipient'];
 const payload=()=>({text:$('instruction').value.trim(),sender:$('sender').value.trim(),resolvedRecipient:$('recipient').value.trim()});
 function setStatus(message){$('message').textContent=message}
 function reset(){latestReview=null;latestPrepared=null;latestRaw=null;
  $('reviewPanel').classList.remove('visible');$('outputPanel').classList.remove('visible');
  $('confirmed').checked=false;$('prepare').disabled=true;
 }
 async function post(url,body){
  const res=await fetch(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
  let json;
  try{json=await res.json()}catch{throw Error('Non-JSON response from Worker')}
  if(!res.ok)throw Error(json.error||json.question||('HTTP '+res.status));
  return json;
 }
 async function parse(){
  reset();$('parse').disabled=true;setStatus('Parsing exact amount, asset and recipient…');
  try{
   const result=await post('/api/parse',payload());
   $('parsed').textContent=JSON.stringify(result,null,2);
   setStatus(result.ok?('Parsed '+result.intent.amount+' '+result.intent.symbol+' to '+result.intent.recipient+
     '. Next choose Validate on Pharos Mainnet.'):('FOLLOW-UP REQUIRED: '+result.question));
  }catch(e){setStatus('Parse failed: '+String(e.message||e))}
  finally{$('parse').disabled=false;}
 }
 async function review(){
  reset();$('review').disabled=true;setStatus('Reading real chain ID, token, balances, gas and nonce…');
  try{
   const result=await post('/api/review',payload());latestRaw=result;
   $('parsed').textContent=JSON.stringify(result,null,2);
   if(result.needsClarification){setStatus('FOLLOW-UP REQUIRED: '+result.question);return}
   if(!result.ok){setStatus('Unverified input. Correct it before continuing.');return}
   latestReview=result;$('reviewPanel').classList.add('visible');
   const r=result.review;
   $('reviewSummary').textContent=r.summary;
   $('payAmount').textContent=r.amount+' '+r.token;
   $('payBalance').textContent=r.balance+' '+r.token;
   $('payBlock').textContent=r.block;
   $('payGas').textContent=(r.gasReservePROS??'Unverified')+' PROS';
   $('fullReview').textContent=JSON.stringify(result,null,2);
   const checks=$('checks');checks.replaceChildren();
   r.checks.forEach(c=>{
    const line=document.createElement('div');line.className='check';
    const icon=document.createElement('strong');icon.className=c.ok?'pass':'fail';icon.textContent=c.ok?'PASS':'BLOCK';
    const content=document.createElement('span');content.textContent=' '+c.check.replaceAll('_',' ').toUpperCase()+' — '+c.detail;
    line.append(icon,content);checks.appendChild(line);
   });
   setStatus(result.readyForSignature?'READY FOR YOUR REVIEW. Read the summary, check the box, then generate unsigned data.':
    'VALIDATION BLOCKED. No unsigned transaction can be produced. Check token/gas balance and on-chain sources.');
  }catch(e){setStatus('Live validation unavailable: '+String(e.message||e))}
  finally{$('review').disabled=false;}
 }
 async function prepare(){
  if(!latestReview?.readyForSignature||!$('confirmed').checked)return;
  $('prepare').disabled=true;setStatus('Rechecking live balances and generating unsigned calldata only…');
  try{
   const result=await post('/api/prepare',{...payload(),confirmed:true,reviewId:latestReview.reviewId});
   if(!result.ok||result.signingPerformed!==false||result.transactionBroadcast!==false)
    throw Error('Unexpected transaction safety response');
   latestPrepared=result;$('outputPanel').classList.add('visible');
   $('unsignedJson').textContent=JSON.stringify(result.unsignedTransaction,null,2);
   $('successText').textContent='UNSIGNED TRANSACTION ONLY — '+result.review.amount+' '+result.review.token+
    ' to '+result.review.recipient+'. No wallet connection, signing or transfer occurred.';
   setStatus('UNSIGNED DRAFT READY. The user must review and sign using a separate wallet.');
  }catch(e){setStatus('Unsigned generation blocked: '+String(e.message||e));}
  finally{$('prepare').disabled=!latestReview?.readyForSignature||!$('confirmed').checked;}
 }
 function exportJSON(){
  if(!latestPrepared)return;
  const blob=new Blob([JSON.stringify({schema:'pharos-natural-payment-user-export-v1',
   exportedAtUtc:new Date().toISOString(),parserAndReview:latestReview,
   preparedTransaction:latestPrepared,source:'USER_BROWSER_EXPORT_NOT_SIGNED'},null,2)+'\n'],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);
  a.download='pharos-natural-payment-unsigned-'+Date.now()+'.json';a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);
 }
 $('parse').onclick=parse;$('review').onclick=review;$('prepare').onclick=prepare;
 $('confirmed').onchange=()=>{$('prepare').disabled=!latestReview?.readyForSignature||!$('confirmed').checked};
 $('copy').onclick=()=>{if(latestPrepared)navigator.clipboard.writeText(JSON.stringify(latestPrepared.unsignedTransaction,null,2)).catch(()=>{})};
 $('export').onclick=exportJSON;
 inputs.forEach(id=>$(id).addEventListener('input',()=>{
  if(latestReview||latestPrepared){reset();setStatus('Input changed. Repeat on-chain review before preparing any transaction.')}
 }));
})();
</script></body></html>`;
