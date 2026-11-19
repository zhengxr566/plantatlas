import type { Metadata } from "next";
import Link from "next/link";
import { about } from "@/data/about";
import { SITE_URL } from "@/lib/ja";

const TITLE = "プライバシーポリシー｜Plant Atlas World 植物図鑑";
const DESCRIPTION =
  "Plant Atlas World のプライバシーポリシー。アクセス解析（Google アナリティクス）、広告配信（Google AdSense）と Cookie、写真に写り込んだ個人情報の取り扱いについて説明します。";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: {
    canonical: `${SITE_URL}/ja/privacy`,
    languages: { "zh-CN": `${SITE_URL}/privacy`, ja: `${SITE_URL}/ja/privacy`, "x-default": `${SITE_URL}/privacy` },
  },
};

export default function JaPrivacy() {
  return (
    <>
      <h1>プライバシーポリシー</h1>
      <p>
        Plant Atlas World（plantatlasworld.com、以下「当サイト」）における個人情報と利用者情報の取り扱いについて、以下のとおり定めます。
      </p>

      <h2>取得する情報</h2>
      <p>
        当サイトは会員登録を必要とせず、氏名やメールアドレスなどの個人情報を積極的に取得することはありません。
        サーバーやアクセス解析ツールにより、閲覧日時、閲覧したページ、ブラウザの種類などの匿名のアクセス情報が記録されることがあり、サイトの改善のために利用します。
      </p>

      <h2>アクセス解析ツール（Google アナリティクス）</h2>
      <p>
        当サイトでは、利用状況を把握するために Google アナリティクス 4 を使用しています。
        Google アナリティクスは Cookie を使用して匿名の統計データを収集しており、個人を特定する情報は含まれません。
        データは Google が管理しており、詳しくは
        <a href="https://policies.google.com/technologies/partner-sites?hl=ja" className="link" rel="noopener">
          Google のサービスを使用するサイトやアプリから収集した情報の Google による使用
        </a>
        をご覧ください。収集を望まない場合は、
        <a href="https://tools.google.com/dlpage/gaoptout?hl=ja" className="link" rel="noopener">
          Google アナリティクス オプトアウト アドオン
        </a>
        を利用するか、ブラウザの設定で Cookie を無効にしてください。
      </p>

      <h2>広告の配信（Google AdSense）と Cookie</h2>
      <p>
        当サイトは第三者配信の広告サービス「Google AdSense」を利用しています。
        Google などの第三者配信事業者は Cookie を使用して、当サイトや他のサイトへの過去のアクセス情報にもとづいて広告を配信することがあります。
        パーソナライズ広告は
        <a href="https://adssettings.google.com/?hl=ja" className="link" rel="noopener">
          Google 広告設定
        </a>
        で無効にできます。また、
        <a href="https://www.aboutads.info/" className="link" rel="noopener">
          www.aboutads.info
        </a>
        では、第三者配信事業者の Cookie を無効にする方法を確認できます。
      </p>

      <h2>タグの提案機能</h2>
      <p>
        写真の識別タグの追加・修正を、登録なしで提案できる機能があります。選んだタグ、任意の補足コメント、送信日時と、
        元に戻せない形に変換（ハッシュ化）した IP アドレスを保存します。IP アドレスは連続送信の制限にのみ使用します。
        提案は運営者が確認してから反映し、確認後に削除します。補足コメントには個人情報を書かないでください。
      </p>

      <h2>写真に写り込んだ個人情報</h2>
      <p>
        当サイトの写真は、公園や街路などで植物を主な被写体として撮影したものです。人物の顔や車のナンバープレートなど、
        個人を特定できる情報が写り込んだ場合は、モザイク処理をしてから掲載しています。撮影位置（GPS）などの撮影情報も、アップロード時に写真ファイルから削除しています。
        ご自身に関わる情報が写っている写真があれば、下記までご連絡ください。速やかに修正または削除します。
      </p>

      <h2>写真の著作権</h2>
      <p>
        特に記載のない限り、当サイトの写真は運営者が撮影したもので、著作権は Plant Atlas World に帰属します。
        利用条件は
        <Link href="/ja/image-license" className="link">
          画像の利用について
        </Link>
        をご覧ください。
      </p>

      <h2>お問い合わせ</h2>
      <p>
        本ポリシー、個人情報、写真に関するお問い合わせは、メール（<strong>{about.contact}</strong>）までお願いします。
      </p>

      <h2>改定</h2>
      <p>本ポリシーは、サイトの機能の変更などに応じて改定することがあります。改定後の内容はこのページで公開します。</p>
      <p className="muted ja-updated">制定・最終更新：2026年11月19日</p>
    </>
  );
}
