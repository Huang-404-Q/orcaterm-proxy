<div align="center">

# OrcaTerm Proxy

**One local OpenAI-compatible endpoint for multiple OrcaTerm accounts**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D22-339933.svg)](package.json)
[![Tests](https://img.shields.io/badge/tests-node%3Atest-black.svg)](test/proxy.test.js)
[![API](https://img.shields.io/badge/API-OpenAI%20compatible-412991.svg)](openapi.json)

English · [中文](#中文)

</div>

Bring the LightAI assistant inside Tencent Cloud OrcaTerm to any client that speaks the OpenAI Chat Completions API. Add more accounts when you need more capacity, then keep calling one local URL.

```text
OpenAI client  ->  localhost:8787  ->  account pool  ->  LightAI
```

> Use this with accounts you control. The proxy does not create accounts, recover credentials, or bypass Tencent Cloud authentication.

## Why this exists

| Direct OrcaTerm session | This proxy |
| --- | --- |
| Works inside one browser session | Works with OpenAI SDKs and existing tools |
| One account at a time | Round-robin across a local account pool |
| OrcaTerm task JSON in responses | Visible answer text, with tool requests labeled |
| Manual cookie handling | Cookie, JSON, Netscape, and line import formats |

## Features

- OpenAI-compatible `POST /v1/chat/completions`, including JSON and SSE responses.
- Local multi-account pool with round-robin selection and same-UIN replacement.
- Cookie header, browser cookie JSON, Netscape `cookies.txt`, and line-based import.
- `system` and `developer` instructions are forwarded with priority, with optional `INJECT_SYSTEM`.
- Upstream task JSON is reduced to its visible answer.
- Tool-review actions become readable text; no tool is executed by the proxy.
- Empty responses and gateway failures retry up to three times.

## Quick start

Requires Node.js 22 or newer.

```bash
git clone https://github.com/Huang-404-Q/orcaterm-proxy.git
cd orcaterm-proxy
npm start
```

The proxy listens on [http://127.0.0.1:8787](http://127.0.0.1:8787).

| Variable | Default | Purpose |
| --- | --- | --- |
| `HOST` | `127.0.0.1` | Bind address |
| `PORT` | `8787` | Bind port |
| `ACCOUNTS_FILE` | `data/accounts.json` | Local account store |
| `INJECT_SYSTEM` | empty | Text prepended to priority instructions |

On Windows, the included script sets a default persona override:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File start-proxy.ps1
```

## Add your account

An account needs `uin` and either `skey` or `p_skey` from a Tencent Cloud session that can already open OrcaTerm.

```bash
curl -X POST http://127.0.0.1:8787/accounts \
  -H "content-type: application/json" \
  -d '{"accounts":[{"cookie":"uin=o123456789; skey=YOUR_SKEY; p_skey=YOUR_P_SKEY"}]}'
```

| Input | Example |
| --- | --- |
| Cookie header | `uin=o123; skey=...; p_skey=...` |
| Browser cookie JSON | `[{"domain":".tencent.com","name":"uin","value":"o123"}]` |
| Netscape file | `npm run import -- cookies.txt` |
| Line format | `123 YOUR_SKEY YOUR_P_SKEY` |

`POST /accounts` adds or updates by UIN. `PUT /accounts` replaces the pool. `GET /accounts` returns identifiers and health only. `DELETE /accounts/<uin>` removes one account. The `data/` directory is gitignored.

## Use it

```bash
curl http://127.0.0.1:8787/v1/chat/completions \
  -H "content-type: application/json" \
  -d '{"model":"kimi-latest","messages":[{"role":"user","content":"Write a function that counts JavaScript files."}]}'
```

```js
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "local",
  baseURL: "http://127.0.0.1:8787/v1",
});

const result = await client.chat.completions.create({
  model: "kimi-latest",
  messages: [{ role: "user", content: "Hello" }],
});
```

The model must be enabled for the selected upstream account. `GET /v1/models` returns the identifiers known to this proxy.

## API

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/health` | Process and account-count check |
| `GET` | `/v1/models` | Known model identifiers |
| `POST` | `/v1/chat/completions` | OpenAI-compatible chat request |
| `GET` | `/accounts` | Sanitized account list |
| `POST` | `/accounts` | Add or update accounts |
| `PUT` | `/accounts` | Replace all accounts |
| `DELETE` | `/accounts/:uin` | Remove one account |

The machine-readable description is in [openapi.json](openapi.json).

## How a request moves

1. The OpenAI-style message list is split into priority instructions and user input.
2. The next enabled account is selected and its Tencent Cloud CSRF value is calculated.
3. The proxy calls the LightAI chat endpoint with that account's cookie.
4. Incremental SSE content is assembled.
5. Completion JSON becomes the visible answer. A review action becomes `[模型请求执行工具 ...]`.
6. The result is returned as JSON or OpenAI-compatible SSE.

## Limitations

- Upstream conversation state remains tied to the selected account. Local history is sent as a new request.
- Model availability, quota, and account enforcement are controlled upstream.
- The proxy never executes a requested tool. It only reports the request.
- A persona override is forwarded, but a model can still fail to follow it; conflicting default-identity replies are retried.

## Development

```bash
npm test
```

See [CONTRIBUTING.md](CONTRIBUTING.md). Licensed under [MIT](LICENSE).

---

<div align="center">

# 中文

**一个本地 OpenAI 兼容入口，轮询多个 OrcaTerm 账号**

[回到英文](#orcaterm-proxy)

</div>

把腾讯云 OrcaTerm 内置的 LightAI 助手接到任何支持 OpenAI Chat Completions API 的客户端。一个本地地址可以轮流使用多个你自己控制的账号。

```text
OpenAI 客户端  ->  localhost:8787  ->  账号池  ->  LightAI
```

> 只能使用你自己控制的账号。代理不会注册账号、获取凭证，也不会绕过腾讯云登录校验。

## 为什么需要它

| 直接使用 OrcaTerm | 这个代理 |
| --- | --- |
| 绑在一个浏览器会话里 | 可接入 OpenAI SDK 和现有工具 |
| 一次手动使用一个账号 | 本地账号池轮询 |
| 返回 OrcaTerm 任务 JSON | 返回可见回答，并标出工具请求 |
| 手工处理 Cookie | 支持 Cookie、JSON、Netscape 和文本行 |

## 特性

- 兼容 OpenAI 的 `POST /v1/chat/completions`，支持 JSON 和 SSE。
- 本地多账号池，按 UIN 覆盖，并按顺序轮询。
- 支持 Cookie 字符串、浏览器 Cookie JSON、Netscape `cookies.txt` 和一行一个账号。
- `system` 与 `developer` 指令按高优先级转发，也可用 `INJECT_SYSTEM` 追加全局指令。
- 上游任务 JSON 会收成可见回答。
- 工具调用只转成可读文本，代理不会执行工具。
- 空响应和网关错误最多自动重试三次。

## 快速开始

需要 Node.js 22 或更新版本。

```bash
git clone https://github.com/Huang-404-Q/orcaterm-proxy.git
cd orcaterm-proxy
npm start
```

代理默认监听 [http://127.0.0.1:8787](http://127.0.0.1:8787)。

| 变量 | 默认值 | 作用 |
| --- | --- | --- |
| `HOST` | `127.0.0.1` | 监听地址 |
| `PORT` | `8787` | 监听端口 |
| `ACCOUNTS_FILE` | `data/accounts.json` | 本地账号文件 |
| `INJECT_SYSTEM` | 空 | 加到高优先级指令前面的文本 |

Windows 可以直接运行带默认人设覆盖的脚本：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File start-proxy.ps1
```

## 导入账号

账号需要 `uin`，以及 `skey` 或 `p_skey`。这些值来自一个已经可以打开 OrcaTerm 的腾讯云会话。

```bash
curl -X POST http://127.0.0.1:8787/accounts \
  -H "content-type: application/json" \
  -d '{"accounts":[{"cookie":"uin=o123456789; skey=YOUR_SKEY; p_skey=YOUR_P_SKEY"}]}'
```

| 格式 | 示例 |
| --- | --- |
| Cookie 请求头 | `uin=o123; skey=...; p_skey=...` |
| 浏览器 Cookie JSON | `[{"domain":".tencent.com","name":"uin","value":"o123"}]` |
| Netscape 文件 | `npm run import -- cookies.txt` |
| 文本行 | `123 YOUR_SKEY YOUR_P_SKEY` |

`POST /accounts` 按 UIN 新增或更新，`PUT /accounts` 替换整个池，`GET /accounts` 只返回编号和状态，`DELETE /accounts/<uin>` 删除一个账号。`data/` 不会进入 Git。

## 调用

```bash
curl http://127.0.0.1:8787/v1/chat/completions \
  -H "content-type: application/json" \
  -d '{"model":"kimi-latest","messages":[{"role":"user","content":"写一个统计 JavaScript 文件数量的函数。"}]}'
```

```js
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "local",
  baseURL: "http://127.0.0.1:8787/v1",
});

const result = await client.chat.completions.create({
  model: "kimi-latest",
  messages: [{ role: "user", content: "你好" }],
});
```

所选上游账号必须有该模型的使用权限。`GET /v1/models` 返回这个代理认识的模型标识。

## 接口

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/health` | 检查进程和账号数量 |
| `GET` | `/v1/models` | 已知模型标识 |
| `POST` | `/v1/chat/completions` | OpenAI 兼容聊天请求 |
| `GET` | `/accounts` | 脱敏后的账号列表 |
| `POST` | `/accounts` | 新增或更新账号 |
| `PUT` | `/accounts` | 替换全部账号 |
| `DELETE` | `/accounts/:uin` | 删除一个账号 |

机器可读描述位于 [openapi.json](openapi.json)。

## 请求流程

1. OpenAI 消息被分成高优先级指令和用户输入。
2. 选择下一个可用账号，并计算腾讯云 CSRF 值。
3. 代理携带该账号的 Cookie 调用 LightAI 聊天接口。
4. 增量 SSE 内容被组装起来。
5. 完成 JSON 收成可见回答；工具审查动作收成 `[模型请求执行工具 ...]`。
6. 结果按 JSON 或 OpenAI 兼容 SSE 返回。

## 限制

- 上游会话状态仍属于被选中的账号。本地历史会作为一次新请求发送。
- 模型可用性、额度和账号校验由上游决定。
- 代理不会执行模型请求的工具，只会把请求显示出来。
- 人设覆盖会被转发，但模型仍可能不遵守；与指定身份冲突的默认身份回复会自动重试。

## 开发

```bash
npm test
```

贡献约定见 [CONTRIBUTING.md](CONTRIBUTING.md)，使用 [MIT](LICENSE) 许可证。
