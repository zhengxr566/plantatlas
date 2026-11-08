// 用户提交的标签建议，保存在 Upstash Redis，由站长在图片管理后台审核。
// 需要环境变量（在 Vercel 添加 Upstash Redis 集成后会自动设置）：
//   KV_REST_API_URL / KV_REST_API_TOKEN   或   UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN
// 本地后台审核时，把同样的变量放进 .env.local。
import { createHash, randomUUID } from "crypto";
import { Redis } from "@upstash/redis";

const SUGGESTIONS_KEY = "tag-suggestions";
// 每个 IP 每小时最多提交次数
const RATE_LIMIT_PER_HOUR = 20;
// 待审核队列上限，防止被刷满
const MAX_PENDING = 2000;
const MAX_TAGS_PER_SUGGESTION = 12;
const MAX_NOTE_LENGTH = 300;

export type TagSuggestion = {
  id: string;
  file: string;
  add: string[];
  remove: string[];
  note: string;
  createdAt: string;
};

let client: Redis | null | undefined;

function getRedis() {
  if (client !== undefined) return client;
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  client = url && token ? new Redis({ url, token }) : null;
  return client;
}

export function isSuggestionEnabled() {
  return getRedis() !== null;
}

function requireRedis() {
  const redis = getRedis();
  if (!redis) throw new Error("标签建议功能未配置（缺少 Upstash Redis 环境变量）");
  return redis;
}

// 只保存 IP 的哈希，用于限流，不保存原始 IP
function hashIp(ip: string) {
  const salt = process.env.SUGGESTION_SALT ?? "plant-atlas-world";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

export class SuggestionError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

export async function addSuggestion(
  input: { file: string; add: string[]; remove: string[]; note: string },
  ip: string
) {
  const redis = requireRedis();

  const add = input.add.slice(0, MAX_TAGS_PER_SUGGESTION);
  const remove = input.remove.slice(0, MAX_TAGS_PER_SUGGESTION);
  const note = input.note.trim().slice(0, MAX_NOTE_LENGTH);
  if (add.length === 0 && remove.length === 0 && !note) {
    throw new SuggestionError("请至少选择一个标签或填写补充说明");
  }

  const rateKey = `rl:suggest:${hashIp(ip)}`;
  const count = await redis.incr(rateKey);
  if (count === 1) await redis.expire(rateKey, 3600);
  if (count > RATE_LIMIT_PER_HOUR) {
    throw new SuggestionError("提交太频繁，请稍后再试", 429);
  }

  if ((await redis.hlen(SUGGESTIONS_KEY)) >= MAX_PENDING) {
    throw new SuggestionError("待审核的建议太多，请过几天再试", 503);
  }

  const suggestion: TagSuggestion = {
    id: randomUUID(),
    file: input.file,
    add,
    remove,
    note,
    createdAt: new Date().toISOString(),
  };
  await redis.hset(SUGGESTIONS_KEY, { [suggestion.id]: JSON.stringify(suggestion) });
  return suggestion;
}

export async function listSuggestions(): Promise<TagSuggestion[]> {
  const all = await requireRedis().hgetall<Record<string, unknown>>(SUGGESTIONS_KEY);
  return Object.values(all ?? {})
    // Upstash 会自动把 JSON 字符串解析成对象
    .map((v) => (typeof v === "string" ? JSON.parse(v) : v) as TagSuggestion)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function deleteSuggestion(id: string) {
  await requireRedis().hdel(SUGGESTIONS_KEY, id);
}

export function clientIp(request: Request) {
  return (
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    "unknown"
  );
}
