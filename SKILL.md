---
name: pharos-natural-language-payment-agent
description: Convert one plain-English Pharos payment instruction into a verified public on-chain review and an unsigned ERC20 or native transaction JSON for user signature only.
---
# Natural-Language Payment Agent

1. Accept one instruction such as `send 100 USDC to alice.eth` and a public sender address. Extract amount, token and recipient with strict, deterministic parsing.
2. If recipient is an alias such as `alice.eth`, **ask** for a verified 0x destination address. If the sender or supported token is not given, request only the missing fields. Never assume name resolution.
3. Validate network **Pharos Pacific Mainnet 1672**, token contract (when ERC-20), token symbol and decimals, token balance, native PROS balance, fee reserve, gas estimation and pending nonce. Pin token balance and contract queries to one block.
4. If any validation is unavailable or insufficient, provide a detailed failure and **do not generate an unsigned transaction**.
5. Render a human-readable summary of sender, recipient, token, amount, balance, block and estimated fee before exposing any unsigned calldata.
6. Require explicit user confirmation in the UI. `POST /api/prepare` also requires `confirmed:true` and the matching prior review fingerprint, then repeats validation against the live chain.
7. On success output only `chainId`, `from`, `to`, `value`, `data`, `gas`, `gasPrice`, `nonce`. For ERC-20 use ABI-encoded `transfer(address,uint256)` and verify its selector and base-unit amount.
8. Never collect private keys or seed phrases; never use wallet signing, approvals, `eth_sendTransaction` or `eth_sendRawTransaction`. A public funded account found by integration tests is **not owned by the operator** and cannot authorize a real transfer.
9. Export complete review and unsigned JSON for the challenge, linking the successful public deployed integration tests and exact source contracts. Distinguish any mocked unit-test fixture from a real Mainnet call.
10. A successful application demo does not mean a payment has been sent or the user controls the sample address. Reviewers must use their own wallet for any future signing outside this app.
