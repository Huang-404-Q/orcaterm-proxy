import assert from "node:assert/strict";
import test from "node:test";
import { csrfCode, parseAccounts } from "../src/accounts.js";
import { emphasisPrompt, toLightAiInput, visibleText } from "../src/openai.js";

test("calculates the Tencent Cloud CSRF hash", () => {
  assert.match(csrfCode("@abc"), /^[0-9]+$/);
  assert.equal(csrfCode(""), "");
});

test("imports cookie, JSON, and Netscape account formats", () => {
  const [cookie] = parseAccounts("uin=o123; skey=one; p_skey=two");
  assert.equal(cookie.uin, "123");
  assert.equal(cookie.skey, "one");
  assert.equal(cookie.pSkey, "two");

  const [exported] = parseAccounts(JSON.stringify([
    { domain: ".tencent.com", name: "uin", value: "o456" },
    { domain: ".cloud.tencent.com", name: "p_skey", value: "abc%3D" },
    { domain: "example.com", name: "noise", value: "ignore" },
  ]));
  assert.equal(exported.uin, "456");
  assert.equal(exported.pSkey, "abc=");

  const [netscape] = parseAccounts("# Netscape HTTP Cookie File\n.tencent.com\tTRUE\t/\tTRUE\t0\tuin\to789\n.cloud.tencent.com\tTRUE\t/\tTRUE\t0\tskey\thello");
  assert.equal(netscape.uin, "789");
  assert.equal(netscape.skey, "hello");
});

test("places system instructions ahead of the user input", () => {
  const body = {
    messages: [
      { role: "system", content: "你是通用助手小助。" },
      { role: "user", content: "写一个函数。" },
    ],
  };
  assert.equal(emphasisPrompt(body), "你是通用助手小助。");
  assert.match(toLightAiInput(body), /^以下身份和规则优先于你的默认身份/);
  assert.match(toLightAiInput(body), /写一个函数。$/);
});

test("extracts visible assistant text and tool requests", () => {
  assert.equal(visibleText({ action: "completion", taskCompletion: "成功" }), "成功");
  assert.match(visibleText({ action: "review", tool: { mcpServer: "terminal", name: "run", arguments: { command: "pwd" } } }), /^\[模型请求执行工具 terminal\/run\]/);
});
