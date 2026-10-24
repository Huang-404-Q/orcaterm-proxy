# OrcaTerm Proxy

[English](README.md) · [中文说明](README.zh-CN.md)

把你自己已经可以访问的腾讯云 OrcaTerm LightAI 助手，转成 OpenAI 兼容接口。代理在本地轮询多个账号，返回 JSON 或 SSE。

项目不负责绕过登录、注册账号或获取凭证。你只能导入自己控制的账号会话。

## 快速开始

```bash
npm start
```

默认地址是 `http://127.0.0.1:8787`，可以用 `HOST`、`PORT`、`ACCOUNTS_FILE` 覆盖。

Windows 可以使用带默认人设覆盖的启动脚本：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File start-proxy.ps1
```

`INJECT_SYSTEM` 会放在请求里的 `system` 和 `developer` 消息前面。这些内容会同时传给上游的高优先级字段和模型输入开头。

## 导入账号

必需材料是 `uin`，以及 `skey` 或 `p_skey`。

```bash
curl -X POST http://127.0.0.1:8787/accounts \
  -H "content-type: application/json" \
  -d '{"accounts":[{"cookie":"uin=o123456789; skey=YOUR_SKEY; p_skey=YOUR_P_SKEY"}]}'
```

支持四种格式：

- `Cookie` 请求头字符串。
- 浏览器导出的 Cookie JSON。
- Netscape `cookies.txt`：`npm run import -- cookies.txt`。
- 一行一个账号：`uin skey [p_skey]`。

同一个 UIN 再导入会覆盖旧会话。`PUT /accounts` 替换整个账号池，`GET /accounts` 只返回编号和状态，不返回密钥。`DELETE /accounts/<uin>` 删除一个账号。

## 调用

```bash
curl http://127.0.0.1:8787/v1/chat/completions \
  -H "content-type: application/json" \
  -d '{"model":"kimi-latest","messages":[{"role":"user","content":"写一个统计 .js 文件数量的 Node.js 函数。"}]}'
```

`"stream": false` 返回单个 JSON；默认返回 OpenAI 兼容 SSE。模型标识通过 `GET /v1/models` 获取。

OpenAI SDK 示例：

```js
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "local",
  baseURL: "http://127.0.0.1:8787/v1",
});
```

## 代理做了什么

- 账号 Cookie 只保存在本地 `data/`，该目录不会提交到 Git。
- 上游任务 JSON 会收成用户可见的回答。
- 工具调用请求会变成以 `[模型请求执行工具 ...]` 开头的文本，代理不会执行工具。
- 空响应和网关错误最多自动重试三次。

## 限制

上游助手有自己的会话状态，并偏向 OrcaTerm 工作流。历史消息会作为一次新请求发送，因此不保证完整复现多轮状态。可用额度、模型和可用性都由上游账号决定。

## 开发

```bash
npm test
```

贡献约定见 [CONTRIBUTING.md](CONTRIBUTING.md)，许可协议为 [MIT](LICENSE)。
