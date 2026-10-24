import { spawn } from "node:child_process";

const target = process.argv[2] || "https://cloud.tencent.com/login?s_url=https%3A%2F%2Forcaterm.cloud.tencent.com%2Fterminal";
const profile = process.argv[3] || "D:\\workplace\\orcaterm代理\\.chrome-profile";
const chrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const child = spawn(chrome, [
  "--remote-debugging-port=9222",
  `--user-data-dir=${profile}`,
  "--no-first-run",
  "--no-default-browser-check",
  target,
], { detached: true, stdio: "ignore" });
child.unref();

for (let attempt = 0; attempt < 20; attempt += 1) {
  try {
    const response = await fetch("http://127.0.0.1:9222/json/version");
    const version = await response.json();
    console.log(`login window ready: ${version.Browser}`);
    process.exit(0);
  } catch {
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}

console.error("Chrome 调试端口没有起来");
process.exit(1);
