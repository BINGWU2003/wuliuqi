import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GAME_KEY } from "@wuliuqi/types";

const posthogMock = vi.hoisted(() => ({
  capture: vi.fn(),
  init: vi.fn(),
}));

vi.mock("posthog-js", () => ({ default: posthogMock }));

import {
  accountAnalyticsKey,
  accountAnalyticsProperties,
  accountViewEventKey,
  captureAccountContactClicked,
  captureAccountDetailViewed,
  captureAccountDetailViewedOnce,
  captureAccountXianyuClicked,
} from "./analytics";

const account = {
  gameKey: GAME_KEY.codm,
  id: 7,
  price: 899,
  serialNumber: "#CODM-7",
  title: "神话账号",
};

describe("商城 PostHog 事件", () => {
  beforeEach(() => {
    posthogMock.capture.mockClear();
    posthogMock.init.mockClear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("为不同游戏生成不冲突的账号键", () => {
    expect(accountAnalyticsKey(GAME_KEY.codm, 7)).toBe("codm:7");
    expect(accountAnalyticsKey(GAME_KEY.sanguosha, 7)).toBe("sanguosha:7");
  });

  it("生成不含个人信息的账号事件属性", () => {
    expect(accountAnalyticsProperties(account, "modal")).toEqual({
      account_key: "codm:7",
      account_id: 7,
      game_key: "codm",
      serial_number: "#CODM-7",
      title: "神话账号",
      price: 899,
      presentation: "modal",
    });
  });

  it("详情去重键区分展示方式和账号", () => {
    expect(accountViewEventKey(account, "page")).toBe("page:codm:7");
    expect(accountViewEventKey(account, "modal")).toBe("modal:codm:7");
  });

  it("缺少配置时静默跳过事件上报", () => {
    captureAccountDetailViewed(account, "page");

    expect(posthogMock.init).not.toHaveBeenCalled();
    expect(posthogMock.capture).not.toHaveBeenCalled();
  });

  it("同一次详情打开只上报一次，并区分购买与联系方式点击", () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_project_token");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_PROXY_READY", "true");
    vi.stubGlobal("window", {});

    let trackedEventKey: string | null = null;
    trackedEventKey = captureAccountDetailViewedOnce(
      account,
      "page",
      trackedEventKey,
    );
    captureAccountDetailViewedOnce(
      account,
      "page",
      trackedEventKey,
    );
    captureAccountXianyuClicked(account, "page");
    captureAccountContactClicked(account, "page", "wechat");
    captureAccountContactClicked(account, "page", "xianyu");

    expect(posthogMock.init).toHaveBeenCalledOnce();
    expect(posthogMock.capture).toHaveBeenCalledTimes(4);
    expect(posthogMock.capture).toHaveBeenNthCalledWith(
      1,
      "shop_account_detail_viewed",
      expect.objectContaining({ account_key: "codm:7", presentation: "page" }),
    );
    expect(posthogMock.capture).toHaveBeenNthCalledWith(
      2,
      "shop_account_xianyu_clicked",
      expect.objectContaining({ account_key: "codm:7", presentation: "page" }),
    );
    expect(posthogMock.capture).toHaveBeenNthCalledWith(
      3,
      "shop_account_contact_clicked",
      expect.objectContaining({
        account_key: "codm:7",
        contact_method: "wechat",
        presentation: "page",
      }),
    );
    expect(posthogMock.capture).toHaveBeenNthCalledWith(
      4,
      "shop_account_contact_clicked",
      expect.objectContaining({
        account_key: "codm:7",
        contact_method: "xianyu",
        presentation: "page",
      }),
    );
  });
});
