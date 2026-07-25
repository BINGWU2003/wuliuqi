import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  PostHogAnalyticsError,
  getAdminTrafficStatistics,
  parseTrafficGameFilter,
  parseTrafficRange,
} from "./posthog-analytics";

const fetchMock = vi.fn();

function response(results: unknown[][], status = 200) {
  return new Response(JSON.stringify({ results }), {
    headers: { "Content-Type": "application/json" },
    status,
  });
}

function configurePostHog() {
  vi.stubEnv("POSTHOG_API_HOST", "https://eu.posthog.com/");
  vi.stubEnv("POSTHOG_PROJECT_ID", "12345");
  vi.stubEnv("POSTHOG_PERSONAL_API_KEY", "phx_read_only_secret");
}

describe("Admin PostHog 流量统计", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("只接受固定的时间和游戏筛选值", () => {
    expect(parseTrafficRange()).toBe("30d");
    expect(parseTrafficRange("7d")).toBe("7d");
    expect(parseTrafficGameFilter()).toBe("all");
    expect(parseTrafficGameFilter("sanguosha")).toBe("sanguosha");

    expect(() => parseTrafficRange("1d")).toThrow(PostHogAnalyticsError);
    expect(() => parseTrafficGameFilter("codm' OR 1=1")).toThrow(
      PostHogAnalyticsError,
    );
  });

  it("转换汇总、趋势、分布和热门账号数据", async () => {
    configurePostHog();
    fetchMock
      .mockResolvedValueOnce(response([[4, 8, 2]]))
      .mockResolvedValueOnce(response([["2026-07-24", 3, 5, 1]]))
      .mockResolvedValueOnce(
        response([
          ["codm", 5],
          ["sanguosha", 3],
        ]),
      )
      .mockResolvedValueOnce(
        response([
          ["codm:7", 7, "codm", "#CODM-7", "神话账号", 899, 3, 5, 1],
        ]),
      )
      .mockResolvedValueOnce(response([["example.com", 4]]))
      .mockResolvedValueOnce(response([["中国", 4]]))
      .mockResolvedValueOnce(response([["Desktop", 4]]));

    const result = await getAdminTrafficStatistics("30d", "codm");

    expect(result.summary).toEqual({
      visitors: 4,
      views: 8,
      xianyuClicks: 2,
      conversionRate: 25,
    });
    expect(result.trend).toEqual([
      { date: "2026-07-24", visitors: 3, views: 5, xianyuClicks: 1 },
    ]);
    expect(result.gameBreakdown).toEqual([
      { key: "codm", label: "CODM", value: 5 },
      { key: "sanguosha", label: "三国杀", value: 3 },
    ]);
    expect(result.topAccounts[0]).toMatchObject({
      accountKey: "codm:7",
      accountId: 7,
      gameKey: "codm",
      serialNumber: "#CODM-7",
      title: "神话账号",
      price: 899,
      visitors: 3,
      views: 5,
      xianyuClicks: 1,
      conversionRate: 20,
    });
    expect(result.breakdowns).toEqual({
      referrers: [{ key: "example.com", label: "example.com", value: 4 }],
      countries: [{ key: "中国", label: "中国", value: 4 }],
      devices: [{ key: "Desktop", label: "Desktop", value: 4 }],
    });
    expect(result.range).toBe("30d");
    expect(result.gameKey).toBe("codm");
    expect(result.generatedAt).toEqual(expect.any(String));
    expect(fetchMock).toHaveBeenCalledTimes(7);
  });

  it("把空查询结果转换为可展示的空统计", async () => {
    configurePostHog();
    fetchMock.mockImplementation(() => Promise.resolve(response([])));

    const result = await getAdminTrafficStatistics("7d", "all");

    expect(result.summary).toEqual({
      visitors: 0,
      views: 0,
      xianyuClicks: 0,
      conversionRate: 0,
    });
    expect(result.trend).toEqual([]);
    expect(result.gameBreakdown).toEqual([]);
    expect(result.topAccounts).toEqual([]);
    expect(result.breakdowns).toEqual({
      referrers: [],
      countries: [],
      devices: [],
    });
  });

  it("缺少配置时返回可识别的 503 错误", async () => {
    vi.stubEnv("POSTHOG_API_HOST", "");
    vi.stubEnv("POSTHOG_PROJECT_ID", "");
    vi.stubEnv("POSTHOG_PERSONAL_API_KEY", "");

    await expect(getAdminTrafficStatistics("30d", "all")).rejects.toMatchObject({
      code: "POSTHOG_NOT_CONFIGURED",
      status: 503,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([401, 429, 500])("把 PostHog %i 响应转换为 502", async (status) => {
    configurePostHog();
    fetchMock.mockResolvedValue(response([], status));

    await expect(getAdminTrafficStatistics("90d", "all")).rejects.toMatchObject({
      code: "POSTHOG_REQUEST_FAILED",
      status: 502,
    });
  });

  it("拒绝缺少 results 的异常响应", async () => {
    configurePostHog();
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ columns: [] }), { status: 200 }),
    );

    await expect(getAdminTrafficStatistics("30d", "all")).rejects.toMatchObject({
      code: "POSTHOG_REQUEST_FAILED",
      status: 502,
    });
  });

  it("只在服务端 Authorization Header 中发送 Personal API Key", async () => {
    configurePostHog();
    fetchMock.mockImplementation(() => Promise.resolve(response([])));

    const result = await getAdminTrafficStatistics("7d", "sanguosha");
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];

    expect(url).toBe("https://eu.posthog.com/api/projects/12345/query/");
    expect(init.headers).toMatchObject({
      Authorization: "Bearer phx_read_only_secret",
      "Content-Type": "application/json",
    });
    expect(init.body).not.toContain("phx_read_only_secret");
    expect(JSON.stringify(result)).not.toContain("phx_read_only_secret");
  });
});
