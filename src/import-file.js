import { readFile } from "node:fs/promises";
import { AccountPool } from "./pool.js";
import { parseAccounts } from "./accounts.js";

const file = process.env.ACCOUNTS_FILE || new URL("../data/accounts.json", import.meta.url);
const source = process.argv[2];
if (!source) {
  console.error("用法: node src/import-file.js <账号文件>");
  process.exit(1);
}

const pool = new AccountPool(file);
await pool.load();
const text = await readFile(source, "utf8");
const incoming = parseAccounts(text);
if (!incoming.length) throw new Error("文件里没有识别到账号");
const accounts = await pool.add(text);
console.log(JSON.stringify({ imported: incoming.length, accounts }, null, 2));
