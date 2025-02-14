# kuso-replier

Let's do useless things with the cutting edge technology of 2023.

Throw human-like replies to my posts using Notestock's webhook feature and OpenAI API.

## dev

```bash
# start the dev server
deno task dev
```

Notestock can't deliver posts directly to webhooks running on your computer, so you probably need something to bridge. My recommendation is [smee.io](https://smee.io/) (it's like ngrok for webhooks).

```bash
# First, open smee.io in your browser and create a new channel.

# Install the smee client using npm. (only for the first time)
# npm install --global smee-client

# Then, run the smee client.
smee -u https://smee.io/abcdefg -p 8000
```

Finally, set the webhook URL to `https://smee.io/abcdefg` in Notestock's settings page.

- https://notestock.osa-p.net/webhook.html
  - regular expression: `.*`
  - webhook URL: `https://smee.io/abcdefg?secret=setYourSecretInEnv`
  - method: POST
  - Content-Type: `application/json`
  - send body: `$JSON`

## deploy

Use deno deploy.

Almost the same as dev.
