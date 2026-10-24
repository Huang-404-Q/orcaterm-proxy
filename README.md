# OrcaTerm 多账号反代

把腾讯云 OrcaTerm 的 LightAI 助手转成 OpenAI 兼容接口。账号按轮询使用。

## 启动

```bash
npm start
```

默认监听 `http://127.0.0.1:8787`。可用 `PORT`、`HOST`、`ACCOUNTS_FILE` 覆盖。

带默认人设覆盖启动：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File start-proxy.ps1
```

`start-proxy.ps1` 会设置 `INJECT_SYSTEM`。请求里的 `system` 和 `developer` 消息也会自动放到上游的高优先级位置。

## 导入账号

支持整段 Cookie、JSON，或一行一个 `uin skey`：

```bash
curl -X POST http://127.0.0.1:8787/accounts \
  -H "content-type: application/json" \
  -d '{"accounts":[{"cookie":"uin=o123456789; skey=YOUR_SKEY; p_skey=YOUR_P_SKEY"}]}'
```

同一个 `uin` 再次导入会覆盖旧登录态。`PUT /accounts` 会整池替换，`GET /accounts` 只返回账号编号和失败次数，不回显密钥。`DELETE /accounts/<uin>` 删除一个账号。

登录态从已登录的 `https://orcaterm.cloud.tencent.com/terminal` 取。必需字段是 `uin` 和 `skey` 或 `p_skey`。

## 调用

```bash
curl http://127.0.0.1:8787/v1/chat/completions \
  -H "content-type: application/json" \
  -d '{"model":"deepseek-chat-latest","messages":[{"role":"user","content":"你好"}]}'
```

`stream: false` 返回完整 JSON，默认按 OpenAI 的 SSE 分片返回。模型列表在 `GET /v1/models`。

## 限制

多轮对话会被拼成一次输入发给上游，因为上游会话状态绑定腾讯云账号，不保证能用本地历史回放。工具调用和终端命令执行没有透传。
