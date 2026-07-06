/* global process */
import postgres from "postgres";

const databaseUrl = process.env.RAG_DATABASE_URL;

if (!databaseUrl) {
  throw new Error("Missing RAG_DATABASE_URL");
}

const sql = postgres(databaseUrl, { max: 1, prepare: false });

const [base] = await sql`
  INSERT INTO knowledge_bases (slug, name, description, visibility, status)
  VALUES (
    'buyer-help',
    '买家帮助中心',
    '账号购买、交付、登录、绑定与售后常见问题。',
    'public',
    'published'
  )
  ON CONFLICT (slug) DO UPDATE
    SET name = excluded.name,
        description = excluded.description,
        visibility = excluded.visibility,
        status = excluded.status
  RETURNING id
`;

const categories = [
  ["purchase", "购买前问题", "购买前常见疑问、账号说明和交易提醒。", 10],
  ["delivery", "账号交付", "发货、交付内容和验号流程。", 20],
  ["login", "登录问题", "登录失败、区服、设备和网络相关问题。", 30],
  ["binding", "绑定与换绑", "邮箱、手机号、第三方平台绑定与换绑说明。", 40],
  ["after-sales", "售后规则", "售后范围、人工处理和争议说明。", 50],
  ["safety", "账号安全", "账号找回、防骗和安全使用建议。", 60],
  ["game-tips", "游戏小攻略", "少量轻量游戏说明和新手提示。", 70],
];

for (const [slug, name, description, sortOrder] of categories) {
  await sql`
    INSERT INTO knowledge_categories (
      knowledge_base_id,
      slug,
      name,
      description,
      sort_order
    )
    VALUES (${base.id}, ${slug}, ${name}, ${description}, ${sortOrder})
    ON CONFLICT (knowledge_base_id, slug) DO UPDATE
      SET name = excluded.name,
          description = excluded.description,
          sort_order = excluded.sort_order
  `;
}

await sql.end();
