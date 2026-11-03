# Cloudflare Worker deployment — repository already prepared

> **Update — deployed website verified on 3 November 2026.** [GitHub Actions run 41668698116](https://github.com/trantanlong2411-droid/Natural-Language-Payment-Agent/actions/runs/41668698116) reached the production Worker and prepared a real-source unsigned 100-USDC draft. The HTTP 404 issue described below is historical troubleshooting guidance, not the current deployment status.


The GitHub repository code, `wrangler.jsonc`, `package.json`, unit tests, and CI are ready. An on-chain integration test **cannot pass** until the production Worker is deployed and responds to `GET /api/health` with the exact build version.

## Observed blocker (3 Nov 2026)

The live workflow requested:
`https://natural-language-payment-agent.trantanlong2411.workers.dev/api/health`

It received Cloudflare HTTP **404 (HTML)**, which means the expected Worker route was not published at that address. The Cloudflare **Workers Builds** check run was also absent from the latest GitHub commit check list. Do not claim that successful GitHub unit tests prove a live deployed website.

## Connect the existing Worker to the correct repo

1. Open [Cloudflare Workers & Pages](https://dash.cloudflare.com/).
2. Select your **Natural-Language Payment Agent** Worker (the one you created).
3. Go to **Settings → Builds**.
4. Under **Git Repository**, choose **Connect** or **Manage** and select:
   `trantanlong2411-droid/Natural-Language-Payment-Agent`
5. Configure production branch: **main**; root directory: **/**.
6. Check **Worker name matches `name` in `wrangler.jsonc`**. The committed value is `natural-language-payment-agent`; if the existing Cloudflare Worker has a different exact name, change the Wrangler `name` to that exact Worker name first. A mismatch is a deploy error.
7. Set Build command: **`npm install`** (or leave it empty where permitted); Deploy command: **`npx wrangler deploy`**. Do **not** use `npm run build` as the Deploy command — the repository's build script is deliberately a dry run used in CI.
8. Save settings and trigger a build/deployment from **main**. If a build already exists, use the dashboard's **Retry deployment** option when available.
9. Open the exact `*.workers.dev` URL shown in the Cloudflare Worker dashboard, not one guessed from the GitHub repository name. Check that its `/api/health` endpoint returns JSON:
```json
{
  "ok": true,
  "name": "Natural-Language Payment Agent",
  "version": "pharos-payment-agent-2026-11-03-v1",
  "chainId": 1672,
  "signatureSupported": false,
  "sendSupported": false,
  "transactionBroadcast": false
}
```
10. In [GitHub Actions — deployed Worker verification](https://github.com/trantanlong2411-droid/Natural-Language-Payment-Agent/actions/workflows/verify-deployed.yml), choose **Run workflow** (or re-run failed jobs) to verify the Worker against real Pharos Mainnet.

If your existing Worker's URL is not `natural-language-payment-agent.trantanlong2411.workers.dev`, set a GitHub Actions workflow environment variable `PAYMENT_AGENT_URL` to its actual base URL or update the script default. The live smoke test only uses a known URL; it never deploys the Worker itself.

## Alternative: local Wrangler deployment

For a machine already authenticated into the correct Cloudflare account:

```sh
git clone https://github.com/trantanlong2411-droid/Natural-Language-Payment-Agent.git
cd Natural-Language-Payment-Agent
npm install
npm test
npx wrangler login
npx wrangler deploy
```

Use the Worker URL printed by Wrangler, then rerun the live verification script with `PAYMENT_AGENT_URL=https://<actual-worker-url> node scripts/smoke-deployed.mjs`.

**Never** paste Cloudflare API tokens, seed phrases, or private keys into the public GitHub repository or this chat.

Sources: [Cloudflare Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/), [GitHub integration](https://developers.cloudflare.com/workers/ci-cd/builds/git-integration/github-integration/), [Workers Builds configuration](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/).
