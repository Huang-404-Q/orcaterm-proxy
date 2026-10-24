# OrcaTerm Proxy

[English](README.md) · [中文说明](README.zh-CN.md)

An OpenAI-compatible proxy for accounts that can already access Tencent Cloud OrcaTerm's LightAI assistant. It rotates local accounts, accepts normal chat requests, and returns OpenAI-style JSON or server-sent events.

This project does not bypass login, create accounts, or obtain credentials. You must import a session from an account you control.

## Quick start

```bash
npm start
```

The server listens on `http://127.0.0.1:8787`. Override it with `HOST`, `PORT`, or `ACCOUNTS_FILE`.

Windows can also start it with the included persona override:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File start-proxy.ps1
```

`INJECT_SYSTEM` is prepended to instructions from `system` and `developer` messages. Those instructions are sent both in the upstream priority field and at the start of the model input.

## Import an account

The required login material is `uin` plus either `skey` or `p_skey`.

```bash
curl -X POST http://127.0.0.1:8787/accounts \
  -H "content-type: application/json" \
  -d '{"accounts":[{"cookie":"uin=o123456789; skey=YOUR_SKEY; p_skey=YOUR_P_SKEY"}]}'
```

Accepted formats:

- A `Cookie` header string.
- Browser-exported cookie JSON.
- A Netscape `cookies.txt` file: `npm run import -- cookies.txt`.
- One account per line: `uin skey [p_skey]`.

`POST /accounts` adds or replaces an account with the same UIN. `PUT /accounts` replaces the pool. `GET /accounts` returns IDs and status only, never key material. `DELETE /accounts/<uin>` removes one account.

## Call the API

```bash
curl http://127.0.0.1:8787/v1/chat/completions \
  -H "content-type: application/json" \
  -d '{"model":"kimi-latest","messages":[{"role":"user","content":"Write a Node.js function that counts .js files."}]}'
```

Set `"stream": false` for one JSON response. The default is OpenAI-compatible SSE. Model identifiers are listed by `GET /v1/models`.

Point an OpenAI SDK at the proxy:

```js
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "local",
  baseURL: "http://127.0.0.1:8787/v1",
});
```

## What the proxy changes

- Account cookies are stored only in the local `data/` directory, which is gitignored.
- Upstream task JSON is reduced to its visible answer.
- A tool-review action is returned as readable text beginning with `[模型请求执行工具 ...]`; the proxy does not execute tools.
- Empty upstream responses and gateway failures are retried up to three times.

## Limitations

The upstream assistant is stateful and optimized for OrcaTerm workflows. Conversation history is sent as one new request, so exact multi-turn state is not guaranteed. Availability, quota, and model access are controlled by the upstream account.

## Development

```bash
npm test
```

See [CONTRIBUTING.md](CONTRIBUTING.md). The license is [MIT](LICENSE).
