# remark42-comments service (Railway)

This directory contains everything needed to run a dedicated [Remark42](https://remark42.com/)
comment service on Railway for the `mywebspace` guestbook.

## Services overview

```
Railway Project "mywebspace"
├── astro-frontend          (built from repo root Dockerfile, Caddy serving dist/)
└── remark42-comments       (built from ./remark42/Dockerfile)
    └── PostgreSQL Add-on    (Railway-managed DB for comment storage)
```

The Astro frontend embeds Remark42 via the snippet in
`src/components/GuestbookView.astro`. It reads the host from
`PUBLIC_REMARK42_HOST` (see `src/config.ts`).

## 1. Provision the Railway service

1. In your Railway project, choose **New Service → GitHub Repo** and select
   this repo, set the **Root Directory** to `remark42/`.
2. Railway will detect `remark42/Dockerfile` and build it.
3. Add a **PostgreSQL** database from the Railway **New → Database** menu and
   connect it to the `remark42-comments` service – Railway will expose the
   connection string as `DATABASE_URL`.

## 2. Configure environment variables

Set the following variables on the `remark42-comments` service (see
`remark42.yml` for how they are referenced):

| Variable                | Purpose                                          |
| ----------------------- | ------------------------------------------------ |
| `SECRET`                | Random session secret (>= 16 chars).             |
| `ADMIN_PASS`            | Password for the `admin` user.                   |
| `ADMIN_SHARED_ID`       | Admin user id (e.g. `admin`).                    |
| `ADMIN_SHARED_EMAIL`    | Admin notification email (optional).             |
| `AUTH_GITHUB_CID`       | GitHub OAuth app client id.                      |
| `AUTH_GITHUB_CSEC`      | GitHub OAuth app client secret.                  |
| `AUTH_GOOGLE_CID`       | Google OAuth client id (optional).               |
| `AUTH_GOOGLE_CSEC`      | Google OAuth client secret (optional).            |
| `DATABASE_URL`          | Provided automatically by the Railway DB add-on. |
| `REMARK42_PUBLIC_URL`   | Public Railway URL of this service, e.g. `https://remark42-prod.up.railway.app`. |

After Remark42 starts, the public URL must also be registered with the OAuth
providers:

- **GitHub** OAuth app:
  - Homepage URL: `https://j-bot.net`
  - Authorization callback URL: `${REMARK42_PUBLIC_URL}/auth/github/callback`
- **Google** OAuth client (if enabled):
  - Authorised redirect URI: `${REMARK42_PUBLIC_URL}/auth/google/callback`

## 3. Point the frontend at Remark42

On the **astro-frontend** Railway service, set:

| Variable                     | Value                                    |
| ---------------------------- | ---------------------------------------- |
| `PUBLIC_REMARK42_HOST`       | `${REMARK42_PUBLIC_URL}` from above      |
| `PUBLIC_REMARK42_SITE_ID`    | `mywebspace`                             |

Once both services are deployed and the frontend env is set, rebuild the
frontend so Astro embeds the live Remark42 widget instead of the fallback.

## 4. Local testing

For local development a `docker-compose.yml` is provided that runs Remark42
with Bolt (SQLite-like) storage so no database is needed:

```bash
cd remark42
cp .env.example .env       # fill in placeholders
docker compose up
```

Remark42 will then be reachable at `http://localhost:8081`. Set
`PUBLIC_REMARK42_HOST=http://localhost:8081` in the frontend's `.env` for
local testing of the guestbook.
