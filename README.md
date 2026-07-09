# MyWebSpace — Developer Portal

Ein **öffentliches Developer-Portal**, auf dem Entwickler\*innen ihre Projekte
vorstellen und ihren Fortschritt in Blogposts teilen können. Jede:r mit einem
Account bekommt einen eigenen Bereich (Profil, Blog, Projekte, Profilbild).
Die Seite ist öffentlich lesbar — ein Account ist nur nötig, um selbst Inhalte
anzulegen.

🌐 **Domain:** [j-bot.net](https://j-bot.net) · Zweisprachig **DE / EN** (erweiterbar).

---

> **Dieses Dokument ist das lebende Planungsdokument des Projekts.**
> Es enthält die Architektur, alle Entscheidungen, das Datenbankschema, die
> Feature-Roadmap und den schrittweisen Umsetzungsplan mit Status.
> **Der Plan wird nach jedem abgeschlossenen Schritt aktualisiert** (Status-Spalte
> und Checkboxen). Wenn sich Anforderungen ändern, wird dieser Text angepasst —
> er ist immer die aktuelle Quelle der Wahrheit (Single Source of Truth).

---

## Inhaltsverzeichnis

1. [Vision & Ziele](#vision--ziele)
2. [Tech-Stack & Architektur-Entscheidungen](#tech-stack--architektur-entscheidungen)
3. [Offene Konfiguration (Env-Variablen)](#offene-konfiguration-env-variablen)
4. [Datenbank-Schema](#datenbank-schema)
5. [Routen & Seitenstruktur](#routen--seitenstruktur)
6. [Feature-Roadmap](#feature-roadmap)
7. [Umsetzungsplan (Schritte mit Status)](#umsetzungsplan-schritte-mit-status)
8. [Projektstruktur (Dateien)](#projektstruktur-dateien)
9. [Lokale Entwicklung](#lokale-entwicklung)
10. [Environment-Variablen (Referenz)](#environment-variablen-referenz)
11. [Deployment (Railway)](#deployment-railway)
12. [Erweiterung um neue Sprachen](#erweiterung-um-neue-sprachen)
13. [Changelog](#changelog)

---

## Vision & Ziele

| Was | Beschreibung |
| --- | --- |
| **Portal** | Öffentliche Plattform, auf der Entwickler\*innen Projekte & Blogposts teilen. |
| **Accounts** | Jede:r kann sich frei registrieren (E-Mail/Passwort **oder** Google/GitHub). E-Mail-Verifizierung Pflicht. |
| **Eigener Bereich** | Jede:r Nutzer hat ein Profil (`/@username`), eigene Projekte & Blogposts, Profilbild, Bio. |
| **Startseite** | Neueste Posts (über alle Nutzer) + Trending Posts. Jeder ist dort abgebildet. |
| **Öffentlich** | Alle Inhalte sind ohne Login lesbar. Login nur nötig zum Erstellen/Hochladen. |
| **Mehrsprachig** | DE/EN für die UI. Nutzerinhalte können pro Eintrag in mehreren Sprachen angelegt werden. Schema ist offen für weitere Sprachen. |
| **Admin** | Ein Administrator (der Owner) verwaltet die Plattform. |

---

## Tech-Stack & Architektur-Entscheidungen

| Komponente | Technologie | Begründung |
| --- | --- | --- |
| **Framework** | Astro 7 im **SSR-Modus** (`output: 'server'` + `@astrojs/node`) | bleibt bei Astro, erhält i18n & Komponenten, macht dynamische Seiten/Logins möglich |
| **Datenbank** | **PostgreSQL** (Railway Postgres-Add-on) | eine DB auf Railway, passt zum Hosting |
| **ORM** | **Drizzle ORM** | typsicher, leichtgewichtig, gute Postgres-Integration, Migrationen |
| **Auth** | **Better Auth** (`better-auth`) | E-Mail/Passwort + E-Mail-Verifizierung + Social-Login (Google/GitHub) out-of-the-box, offizielle Astro-Integration |
| **Datei-Uploads** | **Railway Volume** (lokal im Container) für MVP, später S3/R2 erweiterbar | keine zusätzlichen Kosten/Accounts nötig |
| **Mail** | **Resend** (kostenloser Plan) | nötig für E-Mail-Verifizierung & Passwort-Reset |
| **Hosting** | **Railway** | wie gehabt, mit Postgres-Add-on |
| **Sprachen** | **DE/EN**, i18n erweiterbar | wie vom Owner gewünscht |
| **Bild-Verarbeitung** | Sharp (optional) | Thumbnails/Resize für Profilbilder & Projekt-Cover |

### Architektur-Übersicht

```
Railway Project "mywebspace"
├── Service: astro-app (Node SSR)
│   ├── Build: npm run build  →  node ./dist/server/entry.mjs
│   ├── Volume: /data/uploads  (Profilbilder, Projekt-Cover)
│   └── Env: DATABASE_URL, BETTER_AUTH_SECRET, RESEND_API_KEY, …
│
└── Add-on: PostgreSQL  (Railway managed DB)
```

> **Hinweis:** Der bisherige Caddy-Server (statische Files) fällt weg. Stattdessen
> läuft ein Node-Server (Astro SSR mit `@astrojs/node`), der die Seite rendert,
> die DB anspricht und Uploads annimmt. Statische Assets (CSS/JS/Fonts) werden
> weiterhin vom Astro-Server ausgeliefert.

---

## Offene Konfiguration (Env-Variablen)

Folgende Punkte wurden vom Owner nicht explizit festgelegt. Es gelten diese
**Defaults** (können bei Bedarf geändert werden):

| Punkt | Default | Änderbar? |
| --- | --- | --- |
| **Social-Login-Provider** | Google **und** GitHub | ja — OAuth-Credentials nötig |
| **Mail-Dienst** | Resend (kostenloser Plan) | ja — alternativ eigener SMTP |
| **Admin/Owner** | Ein Admin via `ADMIN_EMAIL`-Env-Variable (wer mit dieser E-Mail registriert, bekommt Admin-Rechte) | ja — später Rollen-System möglich |
| **Upload-Speicher** | Railway Volume (`/data/uploads`) | ja — später S3/R2 |
| **Registrierung** | Frei (jeder kann Account erstellen) | ja |

> ⚠️ **Öffne Fragen an den Owner:** Bestätige, dass diese Defaults ok sind.
> Sie sind im Plan als Standard hinterlegt. Sag „änder X zu Y", wenn nötig.

---

## Datenbank-Schema

Drizzle ORM-Schema (vereinfacht). Die echten Migrationsdateien liegen in
`drizzle/` (wird in Schritt 3 erzeugt).

```
users
├── id            uuid PK
├── email         text unique
├── name          text              (Anzeigename)
├── username      text unique        (für /@username)
├── bio           text
├── avatar_url    text               (Upload-Pfad)
├── role          enum ('user','admin')  default 'user'
├── email_verified boolean           default false
├── created_at    timestamptz

sessions                         (von Better Auth verwaltet)
├── id, user_id, expires_at, …

projects
├── id            uuid PK
├── user_id       uuid FK → users.id
├── slug          text               (z. B. mein-projekt)
├── repo_url      text
├── demo_url      text
├── cover_url     text               (Upload)
├── created_at    timestamptz
└── updated_at    timestamptz

project_translations             (pro Sprache ein Eintrag)
├── id            uuid PK
├── project_id    uuid FK → projects.id
├── lang          text               ('de','en', …)
├── title         text
├── description   text
├── content       text               (Markdown)
└── UNIQUE (project_id, lang)

blog_posts
├── id            uuid PK
├── user_id       uuid FK → users.id
├── slug          text
├── cover_url     text
├── published     boolean            default false (Entwurf/veröffentlicht)
├── views         int                default 0    (für Trending)
├── created_at    timestamptz
└── updated_at    timestamptz

blog_post_translations
├── id            uuid PK
├── blog_post_id  uuid FK → blog_posts.id
├── lang          text
├── title         text
├── excerpt       text
├── content       text               (Markdown)
└── UNIQUE (blog_post_id, lang)

tags
├── id, name unique

project_tags      (m:n)  project_id ↔ tag_id
blog_post_tags     (m:n)  blog_post_id ↔ tag_id

verification_tokens            (Better Auth: E-Mail-Verifizierung)
password_reset_tokens          (Better Auth)
oauth_accounts                 (Better Auth: Google/GitHub-Verknüpfung)
```

**Design-Prinzipien:**
- Inhalte (`projects`, `blog_posts`) gehören immer einem `user_id` (eigener Bereich).
- Übersetzungen sind separate Zeilen — so sind beliebig viele Sprachen möglich,
  ohne die Haupttabelle zu ändern (Spalte `lang`, `UNIQUE`-Constraint pro Eltern-Eintrag).
- Tags als m:n-Relation, sprachneutral (Tagnamen als Keys; Übersetzung im UI möglich).

---

## Routen & Seitenstruktur

| Route | Öffentlich? | Beschreibung |
| --- | --- | --- |
| `/` und `/en/` | ✅ öffentlich | Startseite: Neueste Posts + Trending Posts (über alle Nutzer) |
| `/posts` `/en/posts` | ✅ öffentlich | Alle Blogposts (Feed, filterbar nach Tag/Sprache) |
| `/posts/[slug]` | ✅ öffentlich | Einzelner Blogpost |
| `/projects` | ✅ öffentlich | Alle Projekte (Galerie, filterbar) |
| `/projects/[slug]` | ✅ öffentlich | Einzelnes Projekt |
| `/u/[username]` | ✅ öffentlich | Öffentliches Profil eines Nutzers (Posts + Projekte) |
| `/tag/[tag]` | ✅ öffentlich | Beiträge/Projekte mit Tag |
| `/login` `/en/login` | ❌ nur Gast | Login-Seite |
| `/register` `/en/register` | ❌ nur Gast | Registrierung |
| `/verify-email` | ❌ | E-Mail-Verifizierung (Link aus Mail) |
| `/forgot-password` | ❌ | Passwort-Reset anfordern |
| `/reset-password` | ❌ | Neues Passwort setzen |
| `/dashboard` | 🔒 Login | Übersicht eigener Inhalte + Profil bearbeiten |
| `/dashboard/posts` | 🔒 | Eigene Blogposts verwalten (Liste) |
| `/dashboard/posts/new` | 🔒 | Neuen Blogpost anlegen |
| `/dashboard/posts/[id]/edit` | 🔒 | Blogpost bearbeiten |
| `/dashboard/projects` | 🔒 | Eigene Projekte verwalten |
| `/dashboard/projects/new` | 🔒 | Neues Projekt anlegen |
| `/dashboard/projects/[id]/edit` | 🔒 | Projekt bearbeiten |
| `/dashboard/profile` | 🔒 | Profil + Profilbild hochladen, Bio, Username |
| `/admin` | 🔒 Admin | Plattform-Admin-Bereich (nur Owner) |
| `/api/auth/[...all]` | — | Better Auth Endpunkte (Login/Registrierung/etc.) |
| `/api/upload` | 🔒 | Upload-Endpoint (Profilbild/Cover) |
| `/api/posts/[id]/view` | — | View-Counter für Trending (ohne Login) |
| `/rss.xml` `/en/rss.xml` | ✅ | RSS-Feed der neuesten Posts |

> Dark Mode, Sprachumschalter und responsive Layout bleiben aus dem Bestand erhalten.

---

## Feature-Roadmap

Legende: ✅ erledigt · 🟡 in Arbeit · ⬜ geplant · 🚫 nicht (mehr) relevant

| # | Feature | Status |
| --- | --- | --- |
| F1 | SSR-Umstellung (Astro server + Node-Adapter) | ✅ |
| F2 | PostgreSQL-Add-on + Drizzle-Schema + Migrationen | ✅ |
| F3 | Auth: Registrierung + Login (E-Mail/Passwort) | 🟡 |
| F4 | E-Mail-Verifizierung (Resend) | ✅ |
| F5 | Passwort-Reset per Mail | ✅ |
| F6 | Social-Login Google + GitHub | 🟡 |
| F7 | Sessions & Route-Schutz (Middleware) | ✅ |
| F8 | Profil-Seite `/u/[username]` (öffentlich) | ✅ |
| F9 | Nutzer-Dashboard (eigene Inhalte) | ✅ |
| F10 | Blogpost-Editor (mehrsprachig, Markdown) | ✅ |
| F11 | Projekt-Editor (mehrsprachig, Links, Cover) | ⬜ |
| F12 | Datei-Upload (Profilbild, Cover) → Railway Volume | ✅ |
| F13 | Startseite: Neueste + Trending Posts (View-Counter) | ⬜ |
| F14 | Öffentliche Listen: `/posts`, `/projects`, Tag-Filter | ⬜ |
| F15 | Tags (m:n) + Tag-Seiten | ⬜ |
| F16 | RSS-Feed | ⬜ |
| F17 | Admin-Bereich (`ADMIN_EMAIL`) | ⬜ |
| F18 | i18n DE/EN für neue UI-Texte (erweiterbar) | ⬜ |
| F19 | Alte Inhalte löschen / sauberer Reset | ✅ |
| F20 | Deployment: Dockerfile (Node) + railway.json + Env-Doku | ⬜ |

---

## Umsetzungsplan (Schritte mit Status)

> **Wichtig:** Nach jedem Schritt wird dieser Plan aktualisiert: Status von
> Schritt + Feature auf ✅ setzen, „Nächstes" aktualisieren, ggf. neue
> Erkenntnisse als Note anhängen. So bleibt das Dokument immer aktuell.

Legende: ✅ erledigt · 🟡 in Arbeit · ⬜ offen

| # | Schritt | Beschreibung | Status | Hinweis |
| --- | --- | --- | --- | --- |
| 0 | Reset | Alte Blog-/Projekt-Markdown-Inhalte & nicht mehr benötigte Views entfernen; `remark42/`-Ordner entfernen (Login jetzt über Better Auth, nicht Remark42) | ✅ | Gelöscht: `remark42/`, `PLAN/`, `Caddyfile`, `src/content/`+`content.config.ts`, `src/lib/blog.ts`+`projects.ts`, alle alten `Blog*`/`Project*`/`Home`/`Contact`/`Guestbook`-Views, alle alten Seiten (blog/projects/contact/guestbook/rss/404). Behalten: Theme-CSS, i18n, ThemeToggle, LanguageSwitcher, BaseLayout (angepasst), config.ts (angepasst), favicon. |
| 1 | SSR-Umstellung | `astro.config.mjs` auf `output: 'server'` + `@astrojs/node` Adapter; Dependencies (`drizzle-orm`, `postgres`, `better-auth`, `resend`, `@astrojs/node`) installieren; `package.json` scripts anpassen | ✅ | `@astrojs/node@11` (passt zu Astro 7), `better-auth@1.6`, `drizzle-orm@0.45`, `drizzle-kit@0.31`, `pg@8.22`, `resend@6`. Scripts: `db:generate/migrate/push/studio`, `start` → `node ./dist/server/entry.mjs`. Fundament-Dateien: `src/config.ts`, `src/env.d.ts` (`App.Locals.user`), `UserMenu.astro`, Portal-Startseite `index.astro` (Platzhalter, DB-Anbindung in Schritt 13), `404.astro`, `.env.example`. `npm run build` + `astro check` grünen (0 Fehler). |
| 2 | Drizzle-Setup | `drizzle.config.ts`, `src/db/schema.ts` (Schema aus Plan), `src/db/index.ts` (Client), `npm run db:generate`/`db:migrate` scripts | ✅ | schema.ts (11 Tabellen: user/session/account/verification + projects/blog_posts + je Übersetzungen + tags + m:n), index.ts (pg.Pool + drizzle), drizzle.config.ts, Scripts db:generate/migrate/push/studio. Erste Migration `drizzle/0000_*.sql` generiert. |
| 3 | DB-Schema migrieren | Migrationen erzeugen & lokal anwenden (Postgres via Docker oder Railway-DB) | ⬜ | Migration generiert; anwenden sobald `DATABASE_URL` gesetzt: `npm run db:push`. |
| 4 | Auth-Setup | `src/lib/auth.ts` (Better Auth konfiguriert: E-Mail/Passwort, E-Mail-Verifizierung, Passwort-Reset, Google+GitHub), `src/pages/api/auth/[...all].astro` Handler, `/login`, `/register`, `/verify-email`, `/forgot-password`, `/reset-password` Seiten | 🟡 | auth.ts (email/pw + requireEmailVerification, sendResetPassword, emailVerification.sendOnSignUp, Google/GitHub nur wenn Credentials, additionalFields username/bio/role), API-Handler `/api/auth/[...all].astro`, auth-client.ts, Seiten login/register/verify-email/forgot-password/reset-password (DE) mit Client-Skripten. `astro check` + `build` + Runtime-Smoke-Test grünen. Offen: Migration anwenden, RESEND_API_KEY, echter Login-Test. |
| 5 | Resend-Mail | `src/lib/email.ts` (Verifizierungs- & Reset-Mails); `RESEND_API_KEY` in `.env.example` | ✅ | email.ts (Resend, Dev-Console-Fallback ohne API-Key), in auth.ts verdrahtet. |
| 6 | Middleware & Sessions | `src/middleware.ts`: Session laden, `user` in `locals`, geschützte Routen umleiten, Admin-Check | ✅ | middleware.ts (auth.api.getSession → locals.user, Admin via role/ADMIN_EMAIL, fail-closed). Smoke: /dashboard leitet anon → /login (302). |
| 7 | Profil-Seite | `/u/[username]` (öffentlich): Avatar, Bio, Liste der Posts & Projekte des Nutzers | ✅ | `src/pages/u/[username].astro` (relationaler Drizzle-Query mit projects + blogPosts + Übersetzungen, Lang-Fallback, 404 bei Unbekannt/nicht-erreichbarer DB). |
| 8 | Dashboard-Gerüst | `/dashboard` Layout + Übersicht; `/dashboard/profile` (Profil/Bio/Username bearbeiten) | ✅ | `/dashboard` → `src/pages/dashboard/index.astro` verschoben (Roadmap-Struktur); `src/pages/dashboard/profile.astro` (Name/Username/Bio/Avatar bearbeiten, prefilled aus DB). Editoren Posts/Projekte bleiben offen (Schritte 10–11). |
| 9 | Upload-Endpoint | `/api/upload` (multipart, validates type/size, schreibt nach `/data/uploads`, gibt URL zurück); Profilbild-Upload im Profil | ✅ | `src/pages/api/upload.ts` (auth-gated, multipart `file`, UUID-Dateiname, Type/Size-Validierung via `uploadLimits`); Auslieferung via `src/pages/uploads/[...path].ts` (Path-Traversal-Schutz, immutable Cache); Avatar-Upload im Profil-Editor verdrahtet. Smoke: anon → 401/403 (Better-Auth-CSRF bei multipart ohne Origin), same-Origin → 401 (kein Session). |
| 10 | Blogpost-Editor | `/dashboard/posts/*`: Liste, neu, bearbeiten; mehrsprachige Übersetzungen; Markdown; Entwurf/Veröffentlichen | ✅ | `src/lib/posts.ts` (Slug/Translations-Normalisierung, Caps); API `POST /api/posts` (create, Transaction post+translations) + `GET/PATCH/DELETE /api/posts/[id]` (owner-scoped, UUID-Check, Slug-Uniqueness, Translations full-replace); `src/components/PostEditor.astro` (Cover-Upload via `/api/upload`, Slug-Auto aus Titel, Sprach-Tabs DE/EN, Markdown-Textareas, Draft/Publish, Delete); `/dashboard/posts/index.astro` (Liste mit Status-Badge + Datum, client-side Delete), `/new.astro` + `/[id]/edit.astro` (letzteres lädt post+translations owner-scoped, 404 bei Miss). Dashboard-Index verlinkt jetzt auf die Posts-Liste. i18n-Strings (posts.*, DE/EN) ergänzt. `astro check` 0 Fehler, `npm run build` ok, Smoke: Dashboard/Posts-Liste/New/Edit 302→/login, `/u/nobody` 404, `/api/posts` + `/api/posts/[id]` anon 401. Gegen echte DB noch offen. |
| 11 | Projekt-Editor | `/dashboard/projects/*`: Liste, neu, bearbeiten; Übersetzungen; Repo/Demo-Links; Cover-Upload | ⬜ | |
| 12 | Öffentliche Listen | `/posts`, `/projects`, Tag-Filter, Pagination | ⬜ | |
| 13 | Startseite | Neueste Posts + Trending (Views); `/api/posts/[id]/view`-Counter | ⬜ | |
| 14 | Tags | m:n-Verknüpfung im Editor + `/tag/[tag]`-Seiten | ⬜ | |
| 15 | RSS-Feed | `/rss.xml` + `/en/rss.xml` aus veröffentlichten Posts | ⬜ | |
| 16 | Admin-Bereich | `/admin` (nur `ADMIN_EMAIL`): Nutzer/Inhalte moderieren, löschen | ⬜ | |
| 17 | i18n-Texte | UI-Strings für Auth/Dashboard in `src/i18n/ui.ts` (DE/EN) ergänzen; neue Sprachen dokumentieren | ⬜ | |
| 18 | Deployment-Config | `Dockerfile` (Node-Server statt Caddy), `railway.json` (startCommand `node`), Caddyfile entfernen, Volume `/data` anlegen, `.env.example` & README-Env-Doku finalisieren | ⬜ | |
| 19 | Build & Verifikation | `npm run build` grünt, lokales `npm start` gegen Railway-DB testbar, type-check ok | 🟡 | `astro check` 0 Fehler, `npm run build` ok. Erweiterter Smoke-Test (ohne DB): Home/Login 200, Dashboard + Dashboard/Profile 302→/login, `/u/<name>` 404, `/api/upload` anon 401 (same-Origin) / 403 CSRF (no Origin), `/api/profile` anon 401, `/uploads/*` 404, `/dashboard/posts` + `/new` + `/[id]/edit` 302→/login, `/api/posts` + `/api/posts/[id]` (GET/POST/PATCH/DELETE) anon 401. Gegen echte DB noch offen. |
| 20 | Go-Live | Railway redeploy, Postgres-Add-on, OAuth-Callbacks in Google/GitHub-Konsole hinterlegen (`https://j-bot.net/api/auth/callback/<provider>`) | ⬜ | |

**Nächstes:** Echte Postgres anbinden & `npm run db:push` (Schritt 3) — dann Projekt-Editor (11), öffentliche Listen + Startseite-Feed (12–13), Tags/RSS/Admin (14–16). Anschließend EN-Spiegel der Auth/Dashboard-Routen (17) und Dockerfile/Deployment (18).

---

## Projektstruktur (Dateien)

Ziel-Struktur nach Abschluss (alte Markdown-Content-Ordner entfallen):

```
mywebspace/
├── drizzle/
│   └── *.sql                      # Migrationen
├── drizzle.config.ts
├── src/
│   ├── db/
│   │   ├── schema.ts              # Drizzle-Schema
│   │   └── index.ts               # DB-Client
│   ├── lib/
│   │   ├── auth.ts                # Better Auth config
│   │   └── email.ts               # Resend-Mail
│   ├── middleware.ts             # Session + Route-Schutz
│   ├── pages/
│   │   ├── index.astro            # Startseite
│   │   ├── posts/
│   │   │   ├── index.astro
│   │   │   └── [slug].astro
│   │   ├── projects/
│   │   │   ├── index.astro
│   │   │   └── [slug].astro
│   │   ├── u/[username].astro     # öffentliches Profil
│   │   ├── tag/[tag].astro
│   │   ├── login.astro
│   │   ├── register.astro
│   │   ├── verify-email.astro
│   │   ├── forgot-password.astro
│   │   ├── reset-password.astro
│   │   ├── dashboard/             # geschützt
│   │   │   ├── index.astro
│   │   │   ├── profile.astro
│   │   │   ├── posts/*
│   │   │   └── projects/*
│   │   ├── admin/                 # nur Admin
│   │   └── api/
│   │       ├── auth/[...all].astro
│   │       ├── upload.astro
│   │       └── posts/[id]/view.astro
│   ├── components/                # wiederverwendbar (Cards, Editor, Nav, …)
│   ├── layouts/BaseLayout.astro
│   ├── i18n/                      # ui.ts, utils.ts (DE/EN, erweiterbar)
│   ├── styles/global.css
│   └── config.ts
├── Dockerfile                     # Node SSR build + runtime
├── railway.json
├── .env.example
├── astro.config.mjs               # SSR + node adapter
└── README.md                      # dieses Dokument
```

> Entfällt: `remark42/`, `Caddyfile` (statt Caddy läuft Node-Server),
> `src/content/` (keine Markdown-Dateien mehr), `src/lib/blog.ts` &
> `src/lib/projects.ts` (statische Content-Helper), alte `Blog*`/`Project*`-Views.

---

## Lokale Entwicklung

```bash
# Dependencies installieren
npm install

# Postgres lokal (optional via Docker):
#   docker run --name mywebspace-db -e POSTGRES_PASSWORD=dev -p 5432:5432 -d postgres:16

# .env aus .env.example kopieren und Werte setzen
cp .env.example .env

# Drizzle-Migrationen erzeugen + anwenden
npm run db:generate
npm run db:migrate

# Dev-Server starten (http://localhost:4321)
npm run dev

# Produktions-Build
npm run build

# Build lokal laufen lassen (SSR)
npm start

# Type-Check
npx astro check
```

---

## Environment-Variablen (Referenz)

Siehe `.env.example`. In Produktion als Railway Service-Variablen gesetzt.

| Variable | Pflicht | Beschreibung |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | Postgres-Verbindungsstring (`postgresql://…`) |
| `BETTER_AUTH_SECRET` | ✅ | Geheimer Session-Signing-Key (lang & zufällig) |
| `PUBLIC_SITE_URL` | ✅ | Öffentliche URL (`https://j-bot.net`); für E-Mail-Links & OAuth-Callbacks |
| `RESEND_API_KEY` | ✅ | Resend-API-Key für Transaktions-Mails |
| `EMAIL_FROM` | ⬜ | Absenderadresse (z. B. `no-reply@j-bot.net`); Default abgeleitet |
| `ADMIN_EMAIL` | ⬜ | E-Mail, deren Nutzer Admin-Rechte erhält |
| `GOOGLE_CLIENT_ID` | ⬜ | OAuth (Google) — wenn Social-Login aktiv |
| `GOOGLE_CLIENT_SECRET` | ⬜ | OAuth (Google) |
| `GITHUB_CLIENT_ID` | ⬜ | OAuth (GitHub) |
| `GITHUB_CLIENT_SECRET` | ⬜ | OAuth (GitHub) |
| `UPLOAD_DIR` | ⬜ | Upload-Verzeichnis; Default `/data/uploads` (Railway Volume) |

> **OAuth-Callbacks** (in Google/GitHub-Konsole hinterlegen):
> `https://j-bot.net/api/auth/callback/google` bzw. `.../github`.

---

## Deployment (Railway)

1. Railway-Project `mywebspace`.
2. **PostgreSQL-Add-on** anlegen → `DATABASE_URL` übernehmen.
3. **astro-app**-Service aus dem Repo (Dockerfile-Builder).
4. Volume `/data` mounten → Uploads landen persistent in `/data/uploads`.
5. Service-Variablen setzen (siehe [Environment-Variablen](#environment-variablen-referenz)).
6. OAuth-Credentials bei Google + GitHub anlegen, Callback-URLs eintragen.
7. Deploy — Railway baut mit Dockerfile, startet `node ./dist/server/entry.mjs`.
8. Domain `j-bot.net` an den Service anbinden.

---

## Erweiterung um neue Sprachen

1. In `src/i18n/ui.ts` unter `languages` und `ui` neuen Sprach-Key ergänzen.
2. In `astro.config.mjs` `locales`-Array um den Key erweitern.
3. Übersetzungen je Eintrag (`project_translations` / `blog_post_translations`)
   können jederzeit um weitere `lang`-Zeilen ergänzt werden — das Schema ist offen.
4. `LanguageSwitcher.astro` übernimmt neue Sprache automatisch.

---

## Changelog

| Datum | Änderung |
| --- | --- |
| 2026-07-08 | README neu geschrieben als Planungs-Dokument für Umbau zum Developer-Portal (SSR + Postgres + Better Auth). Alte Planung (statische SSG-Seite) abgelöst. |
| 2026-07-08 | **Schritt 0 (Reset):** alle alten Inhalte/Views/Config gelöscht (`remark42/`, `PLAN/`, `Caddyfile`, `src/content/`, Content-Helper, alte Views & Seiten). **Schritt 1 (SSR-Umstellung):** Astro auf `output: 'server'` + `@astrojs/node@11` gestellt, Dependencies installiert (better-auth, drizzle-orm/kit, pg, resend), `package.json`-Scripts ergänzt, Fundament-Dateien angelegt (`config.ts`, `env.d.ts`, `UserMenu`, Portal-Startseite, 404, `.env.example`). Build & Type-Check grünen. |
| 2026-07-08 | **Schritte 2–8 (DB & Auth-Fundament):** Drizzle-Schema (11 Tabellen) + pg-Client + `drizzle.config.ts` + erste Migration `drizzle/0000_*.sql`; Better-Auth-Config (`src/lib/auth.ts`: E-Mail/Passwort, E-Mail-Verifizierung, Passwort-Reset, Google/GitHub) + Resend-Mail-Helper (`src/lib/email.ts`) + `/api/auth/[...all]`-Handler + `auth-client.ts`; Middleware (`src/middleware.ts`: Session → `locals.user`, Admin via role/`ADMIN_EMAIL`, fail-closed); Auth-Seiten `login`/`register`/`verify-email`/`forgot-password`/`reset-password` + geschütztes `/dashboard` + `/posts`/`/projects`-Platzhalter. `astro check` 0 Fehler, `npm run build` + `npm start`-Smoke-Test grünen (Home/Login/Register/Posts 200, Dashboard 302→/login). |
| 2026-07-08 | **Schritte 7–9 (Profil & Upload):** Öffentliche Profilseite `/u/[username]` (Avatar, Bio, Projekte + veröffentlichte Posts, Lang-Fallback, 404); `/dashboard` nach `dashboard/index.astro` verschoben + `dashboard/profile.astro`-Editor (Name/Nutzername/Bio/Avatar, prefilled aus DB, Username-Validierung `^[a-z0-9_-]{3,20}$` + Eindeutigkeits-Check); `/api/profile.ts` (Profil speichern); `/api/upload.ts` (auth-gateder multipart-Upload, Type/Size-Validierung, UUID-Dateiname) + `/uploads/[...path].ts` (Auslieferung mit Traversal-Schutz); i18n-Strings (Profil/Upload, DE/EN) ergänzt. `astro check` 0 Fehler, `npm run build` ok, erweiterter Smoke-Test grün. |
| 2026-07-09 | **Schritt 10 (Blogpost-Editor):** `src/lib/posts.ts` (Slug-Regeln, `slugify`, Translations-Normalisierung mit Feld-Caps, Cover-URL-Validierung); API `POST /api/posts` (Create in Transaktion: post + translations) und `GET/PATCH/DELETE /api/posts/[id]` (owner-scoped, UUID-Check, Slug-Uniqueness exkl. eigener Zeile, Translations full-replace); `src/components/PostEditor.astro` (Cover-Upload via `/api/upload` + Remove, Slug-Auto-Button aus erstem Titel, Sprach-Tabs DE/EN, Title/Excerpt/Markdown-Content, Status-Badge im Edit-Modus, Save-as-draft / Publish / Delete); `/dashboard/posts/index.astro` (eigene Posts, Status-Badge + Datum, client-side Delete), `new.astro` + `[id]/edit.astro` (letzterer lädt post+translations owner-scoped, 404 bei Miss); Dashboard-Index verlinkt auf Posts-Liste; i18n-Strings `posts.*` (DE/EN) ergänzt. `astro check` 0 Fehler, `npm run build` ok, Smoke: Dashboard/Posts/Liste/New/Edit 302→/login, `/api/posts` + `/api/posts/[id]` anon 401. |

---

*Lizenz: Privates Projekt. Alle Rechte vorbehalten.*
