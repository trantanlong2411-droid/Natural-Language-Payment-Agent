# Natural-Language Payment Agent — reviewer evidence

## Verified real Mainnet unsigned payment (3 November 2026)

The independent direct-RPC GitHub Actions job successfully used the **live Pharos Pacific Mainnet** (chain ID 1672) to verify an actual public account's USDC and PROS balances, validate the official Circle USDC contract, read current gas and nonce, and generate an **unsigned 100 USDC ERC-20 transfer**. It decoded the resulting calldata and verified the recipient and amount without signing or broadcasting.

- [Passing real-chain engine verification job](https://github.com/trantanlong2411-droid/Natural-Language-Payment-Agent/actions/runs/41664769111/job/126017017877)
- [Permanent compact verified-run metadata](./verified-engine-mainnet.json)
- Full GitHub Actions artifact: `pharos-natural-payment-mainnet-rpc-audit` (30-day retention)
- Block: **22023943**; public sample sender: `0x086eb9C2B14dD657ae77D07dF9115A2F946CE327`.
- On-chain USDC balance observed: **1,340,000 USDC**, native **17.763802498851399873 PROS**.
- Instruction: `send 100 USDC to 0x2222222222222222222222222222222222222222`.
- Gas reserve estimate: **0.00070344 PROS**.
- ERC-20 transfer selector: `0xa9059cbb`; transfer amount: **100000000 base units**.
- `signingPerformed: false`, `transactionBroadcast: false`; no tx hash exists.

**Do not claim this sender is the user's wallet or that funds were sent.** It is a public third-party account, used strictly to demonstrate the unsigned transaction builder against **real RPC balances**, with no private keys. The observed amounts are historical and may change.

**Cloudflare deployment remains separately unverified.** The initial live deployed-Worker integration received an HTTP 404 from the expected workers.dev URL. The independent real-chain engine proof does not demonstrate a reachable website. See [DEPLOYMENT.md](../DEPLOYMENT.md). Once Cloudflare build integration is correctly connected, rerun the deployed live workflow before submission.


This is the permanent proof index for the Pharos Medium / Payments task. Review the live application, source, CI and original machine-readable artifact (saved by GitHub Actions, retained for 30 days).

- [Public app](https://natural-language-payment-agent.trantanlong2411.workers.dev/)
- [Reviewer walkthrough](https://natural-language-payment-agent.trantanlong2411.workers.dev/proof)
- [GitHub Actions workflow](https://github.com/trantanlong2411-droid/Natural-Language-Payment-Agent/actions/workflows/verify.yml)
- [Live verification source](../scripts/smoke-deployed.mjs)
- [Parser and intent clarification](../src/parser.mjs)
- [On-chain validator and unsigned transaction builder](../src/engine.mjs)

## All four requirements

| Requirement | Evidence source |
| --- | --- |
| Parses amount, token, recipient and asks clarification | `tests/parser.test.mjs`, API `POST /api/parse`; input `send 100 USDC to alice.eth` requires confirmed 0x recipient and sender. |
| Verifies recipient, real token contract and sufficient balance | `POST /api/review` reads Pharos Mainnet 1672, ERC20 bytecode, real symbol/decimals, balanceOf, native PROS, gasPrice and estimateGas; blocks on insufficient funds. |
| Human-readable review first | Dashboard review panel displays summary and checklist before enabling generation button. Review API never exposes transaction draft fields. |
| Never signs or sends | `POST /api/prepare` requires `confirmed:true` and matching reviewed fingerprint, revalidates, and returns only an unsigned JSON object. JSON-RPC allowlist excludes send/sign. |

## Live mainnet verification

The GitHub Actions live test is designed to:
1. Wait for the exact matching deployed Worker build version.
2. Trigger a real `alice.eth` clarification.
3. Validate the official Circle USDC contract and an unfunded address; confirm the request is **blocked**, never fabricated.
4. Search real recent ERC-20 Transfer logs for a funded public mainnet EOA with sufficient USDC and native PROS, and, *if such a wallet is found and still funded*, re-run actual verification and generate a fully unsigned 100-USDC payment JSON.
5. Decode `transfer(address,uint256)` and check recipient, amount, chain ID and absence of signature/transaction broadcast.

CI success alone does not guarantee that the optional funded EOA discovery found a candidate. Inspect live CI console and artifact for `unsignedDraftReady: true` before stating a live unsigned-positive run was verified. Never invent a funded public account.

The application does **not** support wallet signing or sending. A public funded sender used in a proof is **not** controlled by the project, and nothing can be spent from it without the account's own external authorization. The live proof is a read-only transaction-drafting demonstration, **not** a payment receipt or a transaction hash.

## Official references

- [Pharos network documentation](https://docs.pharos.xyz/getting-started/network)
- [Circle's official USDC deployment on Pharos](https://www.circle.com/blog/now-available-usdc-cctp-on-pharos)
- [EIP-20 token transfer and balance methods](https://eips.ethereum.org/EIPS/eip-20)
- [Ethers.js ABI encoding](https://docs.ethers.org/v6/basics/abi/)

## Reviewer steps

Visit the public app and test the missing-recipient case first. Complete the sender/recipient fields, read the on-chain review and its safety checks. If sufficient public balance is present, explicitly confirm and generate unsigned JSON. Otherwise inspect the correctly blocked insufficient-balance result, and use the CI artifact's positive case if a funded EOA was discovered. Confirm no signing or broadcasting is implemented.

An application-generated JSON cannot authorize an actual transfer by a third-party account. Private keys are never requested.
