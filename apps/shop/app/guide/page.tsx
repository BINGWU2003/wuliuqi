import { Card, CardContent } from "@wuliuqi/ui/components/card";
import { GuideContactButton } from "@/components/guide-contact-button";

const WECHAT_ID = "wlq16680802181";

export default function GuidePage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-3">
      <Card>
        <CardContent className="space-y-6 p-5">
          <h1 className="text-2xl font-extrabold tracking-normal">CODM 指南</h1>

          <section className="space-y-3">
            <h2 className="text-lg font-bold">转盘 CP</h2>
            <ol className="list-decimal space-y-1 pl-5 leading-7">
              <li>通行证：220 CP</li>
              <li>高级版通行证：520 CP</li>
              <li>单副近战武器传说：4550 CP</li>
              <li>神话枪皮保底：5810 CP</li>
              <li>传说角色转盘保底：5810 CP</li>
              <li>神话角色转盘：7220 CP</li>
              <li>传说转盘：4950 CP</li>
              <li>神话枪皮只升满级：6300 CP</li>
              <li>神话角色只升满级：12000 CP 左右</li>
            </ol>
            <p className="rounded-md border-l-4 border-primary bg-accent p-3 text-sm font-medium leading-6 text-accent-foreground">
              需要充值可以联系微信：{WECHAT_ID}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold">注册账号需要准备的信息</h2>
            <p className="leading-7 text-muted-foreground">
              为确保注册顺利进行，请准备以下信息：
            </p>
            <ul className="list-disc space-y-1 pl-5 leading-7">
              <li>
                注册需要的邮箱、密码、游戏昵称分开发我；邮箱不能注册过国际服。
              </li>
              <li>密码不能连续数字或者字母。</li>
              <li>昵称重复时一般会加一些特殊字符。</li>
            </ul>
            <ol className="list-decimal space-y-1 pl-5 leading-7">
              <li>进入登录页后点击「注册新账号」。</li>
              <li>按照提示填写手机号或邮箱并获取验证码。</li>
              <li>设置密码，完善实名资料后提交。</li>
              <li>完成注册后，可立即使用新账号登录。</li>
            </ol>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold">如何下载 CODM</h2>
            <ol className="list-decimal space-y-1 pl-5 leading-7">
              <li>
                安卓：下个光环助手，搜使命召唤，找到欧美服就是国际服，OPPO
                不兼容。
              </li>
              <li>国际服苹果：需要美区或者日区 Apple ID。</li>
              <li>东南亚：虫虫助手，安卓找到后缀有「台服」的版本。</li>
              <li>东南亚苹果：港台 Apple ID。</li>
            </ol>
            <p className="rounded-md border-l-4 border-primary bg-accent p-3 text-sm font-medium leading-6 text-accent-foreground">
              若所在地区暂未开放，通常是未使用加速器或加速器网络出错；账号登录点击第二个按钮。
            </p>
          </section>

          <section className="space-y-3 border-t border-border pt-5">
            <div>
              <h2 className="text-lg font-bold">联系我</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                微信号：{WECHAT_ID}
              </p>
            </div>
            <GuideContactButton wechatId={WECHAT_ID} />
          </section>
        </CardContent>
      </Card>
    </main>
  );
}
