import { ASSISTANT_MODE, ASSISTANT_NAME, UPSTREAM } from "./models.js";

function cookieHeader(account) {
  const pairs = [`uin=o${account.uin}`];
  if (account.skey) pairs.push(`skey=${account.skey}`);
  if (account.pSkey) pairs.push(`p_skey=${account.pSkey}`);
  pairs.push(...account.extraCookies);
  return pairs.join("; ");
}

export function assistantUrl(path, account, extra = {}) {
  const url = new URL(`/assistant${path}`, UPSTREAM);
  url.searchParams.set("name", ASSISTANT_NAME);
  url.searchParams.set("mode", ASSISTANT_MODE);
  url.searchParams.set("csrfCode", account.csrf);
  for (const [key, value] of Object.entries(extra)) {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
  }
  return url;
}

export function upstreamHeaders(account, { stream = false, seqId = "" } = {}) {
  const headers = {
    Accept: stream ? "text/event-stream" : "application/json",
    Cookie: cookieHeader(account),
    Origin: "https://orcaterm.cloud.tencent.com",
    Referer: "https://orcaterm.cloud.tencent.com/terminal",
  };
  if (seqId) headers["x-seqid"] = seqId;
  return headers;
}

export function upstreamFailure(payload, status = 502) {
  if (!payload || typeof payload !== "object" || !("code" in payload)) return null;
  if (payload.code === 0 || payload.code === 200) return null;
  const error = new Error(payload.error?.message || payload.message || `上游返回 ${payload.code}`);
  error.status = payload.code >= 400 && payload.code < 600 ? payload.code : status;
  error.payload = payload;
  return error;
}

export async function readUpstreamError(response) {
  const text = await response.text();
  let payload = null;
  try { payload = JSON.parse(text); } catch { /* 非 JSON 错误原样返回 */ }
  const message = payload?.error?.message || payload?.message || text.slice(0, 300) || response.statusText;
  const error = new Error(message);
  error.status = response.status;
  error.payload = payload;
  return error;
}

export async function upstreamJson(account, path, { method = "GET", body, query } = {}) {
  const headers = upstreamHeaders(account);
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const response = await fetch(assistantUrl(path, account, query), {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) throw await readUpstreamError(response);
  const payload = await response.json();
  const failure = upstreamFailure(payload);
  if (failure) throw failure;
  return payload;
}
