export const PROOF_HTML=String.raw`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Reviewer Evidence | Natural-Language Payment Agent</title>
<style>
:root{color-scheme:dark;--bg:#071022;--panel:#15213b;--edge:#3c5275;--muted:#a8bbdb;--bright:#b6cbff;--green:#8ef1ca}
*{box-sizing:border-box}body{margin:0;background:radial-gradient(ellipse at 0 -15%,#25406d,var(--bg) 65%);color:#eef4ff;font:15px/1.6 system-ui,Segoe UI,sans-serif}main{max-width:1080px;margin:auto;padding:28px 20px 80px}
header,.row{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:14px}a{color:var(--bright)}
h1{font-size:clamp(40px,7vw,70px);line-height:1.03;letter-spacing:-.065em;margin:52px 0 18px}h1 em{font-style:normal;color:var(--bright)}h2{font-size:22px;margin:0 0 14px}h3{font-size:17px;margin:12px 0 7px}
.lead{color:var(--muted);font-size:18px;max-width:880px}.panel{border:1px solid var(--edge);border-radius:16px;padding:23px;background:var(--panel);margin:16px 0}
.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px}.card{background:#0c1b35;border:1px solid #3b5172;border-radius:12px;padding:19px}.card strong{color:var(--green)}
.banner{border:1px solid #90764e;color:#ffe0ad;background:#352b25;border-radius:11px;padding:15px;margin:22px 0}p{margin:8px 0}code{font-family:ui-monospace,Consolas,monospace;color:#c7d7ff;overflow-wrap:anywhere}ol{padding-left:23px}li{margin:8px 0}
a.cta{display:inline-block;background:#b1c7ff;border-radius:9px;padding:11px 19px;color:#07162d;text-decoration:none;font-weight:750}
.small{font-size:12px;color:var(--muted)}footer{font-size:12px;color:var(--muted);margin-top:30px}@media(max-width:700px){.grid{grid-template-columns:1fr}h1{margin-top:30px}}
</style></head><body><main>
<header><span>PHAROS / AGENT ARENA · MEDIUM / PAYMENTS</span><a href="/">← Interactive payment agent</a></header>
<h1>PROOF OF <em>BUILD</em></h1>
<p class="lead">A deterministic, testable natural-language payment action workflow deployed on Pharos Mainnet: parse → clarify → validate → summarize → user review → construct unsigned transaction.</p>
<div class="banner"><strong>Strict signing boundary:</strong> This project NEVER connects a wallet, holds a key, signs, submits, authorizes or broadcasts a transaction. It creates only an unsigned object for independent user-wallet review. No tx hash is claimed.</div>
<section class="panel"><h2>01 / Four rubric requirements</h2>
<div class="grid">
<div class="card"><strong>01 · PARSE AND FOLLOW UP</strong><h3>Amount, token, recipient</h3><p>Recognizes one transfer instruction such as <code>send 100 USDC to 0x...</code>. Unverified names like <code>alice.eth</code> and missing sender addresses trigger an explicit follow-up.</p></div>
<div class="card"><strong>02 · VERIFY REQUEST</strong><h3>Recipient, token contract and balance</h3><p>Checks EVM address validity, mainnet chain 1672, deployed ERC-20 code, contract symbol/decimals, sender token balance, native PROS balance and gas estimate via actual JSON-RPC.</p></div>
<div class="card"><strong>03 · HUMAN-READABLE REVIEW</strong><h3>Inspect before construction</h3><p>Returns the verified sender, recipient, token, amount, on-chain block, balances, fee reserve and a detailed checklist. The separate Generate button remains disabled until explicit confirmation.</p></div>
<div class="card"><strong>04 · UNSIGNED ONLY</strong><h3>Wallet-ready transaction fields</h3><p>The draft provides chainId, from, to, value, data, gas, gasPrice and nonce. Server rechecks the current on-chain state and matches the reviewed intent. Only an external wallet can sign or send.</p></div>
</div></section>
<section class="panel"><h2>02 / Public reviewer walkthrough</h2>
<ol>
<li>Open the <a href="/">live application</a>. Enter <code>send 100 USDC to alice.eth</code> and click <strong>Parse my instruction</strong>. Observe the recipient-address and public-sender follow-up; the agent does not guess ENS mappings.</li>
<li>Provide a valid 0x recipient and a public Pharos sender wallet. Use a public address that actually holds sufficient USDC and native PROS if you want a successful unsigned example. Click <strong>Validate on Pharos Mainnet</strong>.</li>
<li>Inspect the verified balance, token contract, gas estimate and each validation check. If token or gas balance is insufficient, transaction preparation correctly stays blocked.</li>
<li>When all checks pass, read the human-readable summary, explicitly check the confirmation checkbox, then click <strong>Generate unsigned transaction</strong>.</li>
<li>Inspect <code>0xa9059cbb</code> (ERC-20 transfer selector) and the destination and amount inside calldata; export the complete JSON. No signature, tx hash or transfer appears.</li>
</ol>
<p><a class="cta" href="/">Run the demo</a></p>
</section>
<section class="panel"><h2>Verified publicly funded example (historical)</h2>
<p>Independent Pharos Mainnet RPC verification confirmed the official Circle USDC contract and a public externally-owned account at block <strong>22023746</strong> on 3 Nov 2026.</p>
<div class="grid">
<div class="card"><strong>PUBLIC USDC BALANCE</strong><h3>1,940.189315 USDC</h3><p>Sender: <code>0x08cd62babd8Dac7404504792Df30C12fC5384Df5</code></p></div>
<div class="card"><strong>NATIVE GAS BALANCE</strong><h3>18.152564 PROS</h3><p>Amounts were read from Pharos Mainnet, not generated by mock fixtures.</p></div>
</div>
<p><a href="https://github.com/trantanlong2411-droid/Natural-Language-Payment-Agent/blob/main/proof/public-funding-observation.json" target="_blank" rel="noopener noreferrer">Machine-readable historical observation ↗</a></p>
<p class="small">This is a public third-party EOA that the project does not control. The balance can change. A balance observation is <em>not</em> evidence of a signed payment or of a successful live deployed-Worker unsigned draft. The application's <strong>Load verified public example</strong> button rechecks the current balances when the Worker is available.</p>
</section>
<section class="panel"><h2>Real Mainnet 100-USDC unsigned preparation — verified</h2>
<p>A separate GitHub Actions job executed the actual payment engine against Pharos Mainnet RPC at block <strong>22023943</strong>, validated the official USDC contract and enough USDC/PROS held by a public third-party account, then produced and decoded the transaction calldata. <strong>No signing or broadcasting took place.</strong></p>
<div class="grid">
<div class="card"><strong>VERIFIED TRANSFER DRAFT</strong><h3>100 USDC · 0xa9059cbb</h3><p>Recipient <code>0x2222222222222222222222222222222222222222</code></p></div>
<div class="card"><strong>REAL ON-CHAIN PRECHECK</strong><h3>Block 22023943</h3><p>Public third-party sender held 1,340,000 USDC with estimated gas reserve 0.00070344 PROS at that time.</p></div>
</div>
<p><a href="https://github.com/trantanlong2411-droid/Natural-Language-Payment-Agent/actions/runs/41664769111/job/126017017877" target="_blank" rel="noopener noreferrer">Actual RPC engine verification log ↗</a> · <a href="https://github.com/trantanlong2411-droid/Natural-Language-Payment-Agent/blob/main/proof/verified-engine-mainnet.json" target="_blank" rel="noopener noreferrer">Compact proof JSON ↗</a></p>
<p class="small">The user and project do not control this public sender; prepared JSON is not a signed transaction or authorization. In addition to this original direct-RPC evidence, the separate deployed Cloudflare Worker verification has now passed end-to-end (see the next section).</p>
</section>
<section class="panel"><h2>03 / Production Worker fully verified</h2>
<p>GitHub Actions connected directly to the published Worker on 3 November 2026 and executed the complete flow: recognize missing <code>alice.eth</code> recipient and sender, reject an unfunded request, enforce explicit confirmation, and generate an unsigned 100-USDC ERC-20 transaction from a freshly checked public account. This was a positive real-blockchain end-to-end test, not a mock run.</p>
<div class="grid">
<div class="card"><strong>100 USDC · UNSIGNED</strong><h3>Selector 0xa9059cbb</h3><p>Recipient <code>0x2222222222222222222222222222222222222222</code> · Signed: false · Broadcast: false</p></div>
<div class="card"><strong>PHAROS MAINNET · BLOCK 22025409</strong><h3>1,239.162369 USDC</h3><p>Public sample sender <code>0x08cd62babd8Dac7404504792Df30C12fC5384Df5</code> · Gas reserve 0.00070344 PROS</p></div>
</div>
<p><a href="https://github.com/trantanlong2411-droid/Natural-Language-Payment-Agent/actions/runs/41668698116" target="_blank" rel="noopener noreferrer">Passing deployed Worker integration logs ↗</a> · <a href="https://github.com/trantanlong2411-droid/Natural-Language-Payment-Agent/blob/main/proof/verified-deployed-worker.json" target="_blank" rel="noopener noreferrer">Permanent deployed proof metadata ↗</a></p>
<p class="small">This is a historical observation of a third-party EOA, not the user's funds. The project never signed or sent the transaction. Values and gas can change after this test.</p>
</section>
<section class="panel"><h2>04 / Additional tests and reproducibility</h2>
<p>Automated tests verify parser ambiguity, address/token validation, balance and gas failures, review gating and the exact unsigned transaction structure. The deployed live GitHub Actions workflow checks actual Pharos RPC connectivity and USDC contract metadata using the published Cloudflare Worker.</p>
<p><a href="https://github.com/trantanlong2411-droid/Natural-Language-Payment-Agent/actions/workflows/verify.yml" target="_blank" rel="noopener noreferrer">GitHub Actions verification →</a></p>
<p><a href="https://github.com/trantanlong2411-droid/Natural-Language-Payment-Agent/blob/main/proof/README.md" target="_blank" rel="noopener noreferrer">Permanent source-backed proof →</a></p>
<p><a href="https://github.com/trantanlong2411-droid/Natural-Language-Payment-Agent" target="_blank" rel="noopener noreferrer">Public source repository →</a></p>
<p class="small">A successful test shows the capabilities at its recorded time. A zero-balance address cannot be represented as funded. A static example never proves current spendability, gas prices or user ownership.</p>
</section>
<section class="panel"><h2>05 / Source and limitations</h2>
<p><a href="https://docs.pharos.xyz/getting-started/network" target="_blank" rel="noopener noreferrer">Pharos official network docs →</a></p>
<p><a href="https://www.circle.com/blog/now-available-usdc-cctp-on-pharos" target="_blank" rel="noopener noreferrer">Circle official Pharos USDC contract →</a></p>
<p><a href="https://eips.ethereum.org/EIPS/eip-20" target="_blank" rel="noopener noreferrer">ERC-20 token ABI specification →</a></p>
<p>The action workflow is a conservative, deterministic implementation of the requested general payment action pattern; it is not an official Harbor SDK integration or an AI language model. Only recognized assets and exact grammar are supported. Gas estimates can become stale and do not guarantee execution. Unverified names are never resolved automatically.</p>
</section>
<footer>Natural-Language Payment Agent · Pharos Pacific Mainnet · Unsigned drafts, never executed transfers.</footer>
</main></body></html>`;
