import {
  GAME_KEY,
  TRAFFIC_GAME_FILTER_VALUES,
  TRAFFIC_RANGE_VALUES,
} from "@wuliuqi/types";
import type {
  AdminTrafficStatistics,
  TrafficBreakdownRow,
  TrafficGameFilter,
  TrafficRange,
  TrafficTopAccount,
  TrafficTrendPoint,
} from "@wuliuqi/types";

const ACCOUNT_DETAIL_VIEWED_EVENT = "shop_account_detail_viewed";
const ACCOUNT_XIANYU_CLICKED_EVENT = "shop_account_xianyu_clicked";
const ACCOUNT_CONTACT_CLICKED_EVENT = "shop_account_contact_clicked";
const RANGE_DAYS: Record<TrafficRange, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

type HogQLResponse = {
  results?: unknown[][];
};

export class PostHogAnalyticsError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "PostHogAnalyticsError";
  }
}

export function parseTrafficRange(value?: string | null): TrafficRange {
  if (!value) {
    return "30d";
  }

  if (TRAFFIC_RANGE_VALUES.includes(value as TrafficRange)) {
    return value as TrafficRange;
  }

  throw new PostHogAnalyticsError("BAD_REQUEST", "无效的统计时间范围", 400);
}

export function parseTrafficGameFilter(
  value?: string | null,
): TrafficGameFilter {
  if (!value) {
    return "all";
  }

  if (TRAFFIC_GAME_FILTER_VALUES.includes(value as TrafficGameFilter)) {
    return value as TrafficGameFilter;
  }

  throw new PostHogAnalyticsError("BAD_REQUEST", "无效的游戏筛选", 400);
}

export async function getAdminTrafficStatistics(
  range: TrafficRange,
  gameKey: TrafficGameFilter,
): Promise<AdminTrafficStatistics> {
  const days = RANGE_DAYS[range];
  const conditions = queryConditions(days, gameKey);
  const viewConditions = `${conditions} AND event = '${ACCOUNT_DETAIL_VIEWED_EVENT}'`;

  const [
    summaryRows,
    trendRows,
    gameRows,
    accountRows,
    referrerRows,
    countryRows,
    deviceRows,
  ] = await Promise.all([
    runHogQLQuery(
      `
        SELECT
          uniqIf(distinct_id, event = '${ACCOUNT_DETAIL_VIEWED_EVENT}'),
          countIf(event = '${ACCOUNT_DETAIL_VIEWED_EVENT}'),
          countIf(event = '${ACCOUNT_XIANYU_CLICKED_EVENT}'),
          countIf(event = '${ACCOUNT_CONTACT_CLICKED_EVENT}' AND properties.contact_method = 'wechat'),
          countIf(event = '${ACCOUNT_CONTACT_CLICKED_EVENT}' AND properties.contact_method = 'xianyu')
        FROM events
        WHERE ${conditions}
      `,
      "admin traffic summary",
    ),
    runHogQLQuery(
      `
        SELECT
          toString(toDate(timestamp)),
          uniqIf(distinct_id, event = '${ACCOUNT_DETAIL_VIEWED_EVENT}'),
          countIf(event = '${ACCOUNT_DETAIL_VIEWED_EVENT}'),
          countIf(event = '${ACCOUNT_XIANYU_CLICKED_EVENT}'),
          countIf(event = '${ACCOUNT_CONTACT_CLICKED_EVENT}' AND properties.contact_method = 'wechat'),
          countIf(event = '${ACCOUNT_CONTACT_CLICKED_EVENT}' AND properties.contact_method = 'xianyu')
        FROM events
        WHERE ${conditions}
        GROUP BY toDate(timestamp)
        ORDER BY toDate(timestamp) ASC
      `,
      "admin traffic trend",
    ),
    runHogQLQuery(
      `
        SELECT
          properties.game_key,
          count()
        FROM events
        WHERE ${viewConditions}
        GROUP BY properties.game_key
        ORDER BY count() DESC
      `,
      "admin traffic game breakdown",
    ),
    runHogQLQuery(
      `
        SELECT
          properties.account_key,
          argMax(properties.account_id, timestamp),
          argMax(properties.game_key, timestamp),
          argMax(properties.serial_number, timestamp),
          argMax(properties.title, timestamp),
          argMax(properties.price, timestamp),
          uniqIf(distinct_id, event = '${ACCOUNT_DETAIL_VIEWED_EVENT}'),
          countIf(event = '${ACCOUNT_DETAIL_VIEWED_EVENT}'),
          countIf(event = '${ACCOUNT_XIANYU_CLICKED_EVENT}'),
          countIf(event = '${ACCOUNT_CONTACT_CLICKED_EVENT}' AND properties.contact_method = 'wechat'),
          countIf(event = '${ACCOUNT_CONTACT_CLICKED_EVENT}' AND properties.contact_method = 'xianyu')
        FROM events
        WHERE ${conditions}
          AND properties.account_key IS NOT NULL
        GROUP BY properties.account_key
        ORDER BY countIf(event = '${ACCOUNT_DETAIL_VIEWED_EVENT}') DESC
        LIMIT 20
      `,
      "admin traffic top accounts",
    ),
    breakdownQuery(
      conditions,
      "coalesce(nullIf(properties.$referring_domain, ''), '直接访问')",
      "admin traffic referrers",
    ),
    breakdownQuery(
      conditions,
      "coalesce(nullIf(properties.$geoip_country_name, ''), '未知')",
      "admin traffic countries",
    ),
    breakdownQuery(
      conditions,
      "coalesce(nullIf(properties.$device_type, ''), '未知')",
      "admin traffic devices",
    ),
  ]);

  const summary = parseSummary(summaryRows[0]);

  return {
    range,
    gameKey,
    generatedAt: new Date().toISOString(),
    summary,
    trend: trendRows.map(parseTrendPoint),
    gameBreakdown: gameRows.map((row) =>
      parseBreakdownRow(row, gameLabel(asString(row[0]))),
    ),
    topAccounts: accountRows.map(parseTopAccount),
    breakdowns: {
      referrers: referrerRows.map((row) => parseBreakdownRow(row)),
      countries: countryRows.map((row) => parseBreakdownRow(row)),
      devices: deviceRows.map((row) => parseBreakdownRow(row)),
    },
  };
}

async function breakdownQuery(
  conditions: string,
  expression: string,
  name: string,
) {
  return runHogQLQuery(
    `
      SELECT
        ${expression},
        count()
      FROM events
      WHERE ${conditions}
        AND event = '${ACCOUNT_DETAIL_VIEWED_EVENT}'
      GROUP BY ${expression}
      ORDER BY count() DESC
      LIMIT 10
    `,
    name,
  );
}

function queryConditions(days: number, gameKey: TrafficGameFilter) {
  const gameCondition =
    gameKey === "all" ? "" : ` AND properties.game_key = '${gameKey}'`;

  return `timestamp >= now() - INTERVAL ${days} DAY
    AND event IN ('${ACCOUNT_DETAIL_VIEWED_EVENT}', '${ACCOUNT_XIANYU_CLICKED_EVENT}', '${ACCOUNT_CONTACT_CLICKED_EVENT}')${gameCondition}`;
}

async function runHogQLQuery(query: string, name: string) {
  const apiHost = process.env.POSTHOG_API_HOST?.trim().replace(/\/$/, "");
  const projectId = process.env.POSTHOG_PROJECT_ID?.trim();
  const personalApiKey = process.env.POSTHOG_PERSONAL_API_KEY?.trim();

  if (!apiHost || !projectId || !personalApiKey) {
    throw new PostHogAnalyticsError(
      "POSTHOG_NOT_CONFIGURED",
      "PostHog 流量统计尚未配置",
      503,
    );
  }

  try {
    const response = await fetch(
      `${apiHost}/api/projects/${encodeURIComponent(projectId)}/query/`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${personalApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: {
            kind: "HogQLQuery",
            query,
          },
          name,
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(15_000),
      },
    );

    if (!response.ok) {
      throw new PostHogAnalyticsError(
        "POSTHOG_REQUEST_FAILED",
        "PostHog 流量数据查询失败",
        502,
      );
    }

    const payload = (await response.json()) as HogQLResponse;

    if (
      !Array.isArray(payload.results) ||
      !payload.results.every((row) => Array.isArray(row))
    ) {
      throw new PostHogAnalyticsError(
        "POSTHOG_REQUEST_FAILED",
        "PostHog 返回了无效的统计数据",
        502,
      );
    }

    return payload.results;
  } catch (error) {
    if (error instanceof PostHogAnalyticsError) {
      throw error;
    }

    throw new PostHogAnalyticsError(
      "POSTHOG_REQUEST_FAILED",
      "PostHog 流量数据查询失败",
      502,
    );
  }
}

function parseSummary(row?: unknown[]) {
  const visitors = asNumber(row?.[0]);
  const views = asNumber(row?.[1]);
  const xianyuClicks = asNumber(row?.[2]);
  const wechatContactClicks = asNumber(row?.[3]);
  const xianyuContactClicks = asNumber(row?.[4]);
  const contactClicks = wechatContactClicks + xianyuContactClicks;
  const interactionClicks = xianyuClicks + contactClicks;

  return {
    visitors,
    views,
    xianyuClicks,
    wechatContactClicks,
    xianyuContactClicks,
    contactClicks,
    interactionClicks,
    conversionRate: percentage(interactionClicks, views),
  };
}

function parseTrendPoint(row: unknown[]): TrafficTrendPoint {
  const contactClicks = asNumber(row[4]) + asNumber(row[5]);

  return {
    date: asString(row[0]),
    visitors: asNumber(row[1]),
    views: asNumber(row[2]),
    xianyuClicks: asNumber(row[3]),
    contactClicks,
  };
}

function parseTopAccount(row: unknown[]): TrafficTopAccount {
  const views = asNumber(row[7]);
  const xianyuClicks = asNumber(row[8]);
  const wechatContactClicks = asNumber(row[9]);
  const xianyuContactClicks = asNumber(row[10]);
  const contactClicks = wechatContactClicks + xianyuContactClicks;
  const interactionClicks = xianyuClicks + contactClicks;
  const rawGameKey = asString(row[2]);

  return {
    accountKey: asString(row[0]),
    accountId: asNumber(row[1]),
    gameKey:
      rawGameKey === GAME_KEY.sanguosha
        ? GAME_KEY.sanguosha
        : GAME_KEY.codm,
    serialNumber: asString(row[3]),
    title: asString(row[4]),
    price: asNumber(row[5]),
    visitors: asNumber(row[6]),
    views,
    xianyuClicks,
    wechatContactClicks,
    xianyuContactClicks,
    contactClicks,
    interactionClicks,
    conversionRate: percentage(interactionClicks, views),
  };
}

function parseBreakdownRow(
  row: unknown[],
  label = asString(row[0]) || "未知",
): TrafficBreakdownRow {
  const key = asString(row[0]) || "unknown";

  return {
    key,
    label,
    value: asNumber(row[1]),
  };
}

function gameLabel(gameKey: string) {
  return gameKey === GAME_KEY.sanguosha ? "三国杀" : "CODM";
}

function percentage(value: number, total: number) {
  return total > 0 ? Math.round((value / total) * 1_000) / 10 : 0;
}

function asNumber(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function asString(value: unknown) {
  return value === null || value === undefined ? "" : String(value);
}
