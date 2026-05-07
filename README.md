# kuso-replier

Mastodon webhookでくだらないリプライを返すbot。Notestockのwebhook機能とOpenAI APIで実現。Cloudflare Workers + Honoで動く。

## セットアップ

```bash
pnpm install
cp .dev.vars.example .dev.vars  # 値を埋める
```

新しい環境変数を増やしたら`src/cloudflare-env.d.ts`の`Cloudflare.Env`にも手で追加する。

`actor.json`はリポジトリではなくHTTPで配信する形に統一した。`ACTOR_JSON_URL`に`actor.json.example`相当の内容を返すURLを設定する。

## dev

```bash
pnpm dev
```

`wrangler dev`が`http://localhost:8000`で起動する。NotestockからローカルWorkerにwebhookを届けるには[smee.io](https://smee.io/)などのブリッジを挟む。

```bash
# smee-clientを入れていなければ
# npm install --global smee-client
smee -u https://smee.io/abcdefg -p 8000
```

Notestock側の設定 (https://notestock.osa-p.net/webhook.html)：

- regular expression: `.*`
- webhook URL: `https://smee.io/abcdefg?secret=mysupersecret`
- method: POST
- Content-Type: `application/json`
- send body: `$JSON`

## デプロイ

Cloudflare Workers Buildsのダッシュボード設定でGit連携してビルドさせる方針なので、リポジトリ側に`wrangler.toml`もデプロイworkflowも置いていない。

ビルドコマンドは`pnpm install --frozen-lockfile`、デプロイコマンドは`pnpm dlx wrangler deploy src/index.ts --compatibility-date 2026-05-01 --compatibility-flag=nodejs_compat`あたりをダッシュボード側で指定する。

Secrets/Varsはダッシュボードで登録する：

- `SECRET` / `OPENAI_API_KEY` / `MASTODON_BOT_TOKEN` はSecretsとして登録
- それ以外のキーはVarsで可
