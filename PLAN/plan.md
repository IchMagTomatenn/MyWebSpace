# Plan: Persönliche Webseite auf Railway

## Übersicht

Eine moderne, zweisprachige persönliche Webseite mit Astro, gehostet auf Railway.app,
mit Blog, Projektshowcase, Gästebuch und Dark Mode.

---

## Tech-Stack

| Komponente        | Technologie                         |
| ----------------- | ----------------------------------- |
| **Framework**     | Astro (Static Site Generator)       |
| **Sprachen**      | Deutsch + Englisch (astro-i18n)     |
| **Inhalte**       | Markdown-Dateien im Repo            |
| **Hosting**       | Railway.app + eigene Domain         |
| **Dark Mode**     | CSS-Variablen + localStorage        |
| **Kommentare**    | Remark42 (separater Railway-Service)|

## Seiten-Struktur

```
mywebspace/
├── src/
│   ├── pages/
│   │   ├── index.astro              # Startseite
│   │   ├── projects/                # Projekte-Übersicht
│   │   │   └── [slug].astro         # Projektdetail
│   │   ├── blog/                    # Blog-Übersicht
│   │   │   └── [slug].astro         # Blogbeitrag
│   │   ├── contact.astro            # Kontaktseite
│   │   └── guestbook.astro          # Gästebuch
│   ├── content/
│   │   ├── projects/                # [lang]/projekt.md
│   │   └── blog/                    # [lang]/post.md
│   ├── layouts/
│   │   └── BaseLayout.astro         # Grundgerüst mit Nav, Footer, Dark Mode
│   ├── components/                  # Wiederverwendbare UI-Komponenten
│   └── i18n/                        # Übersetzungen (JSON)
├── remark42/                        # Dockerfile + Konfig für Railway
└── railway.json                     # Railway-Deployment-Konfig
```

## Deployment-Architektur (Railway)

```
Railway Project "mywebspace"
├── Service 1: astro-frontend
│   ├── Build: npm run build
│   └── Static Files served via Caddy/Nginx
│
└── Service 2: remark42-comments
    ├── Docker-Image: umputun/remark42
    ├── Env: ADMIN_PASS, SITE_URL, SECRET
    └── PostgreSQL Add-on (Railway-DB)
```

## Features im Detail

1. **Startseite** – Hero-Bereich mit Vorstellung + Call-to-Action zu Projekten/Blog
2. **Projekte-Seite** – Raster mit Karten, Tags (Web/CLI/AI/etc.), GitHub- & Demo-Links
3. **Blog** – Datums-sortierte Beiträge, Tags, RSS-Feed, Lesezeit
4. **Dark Mode** – Umschalter in der Navigation, persisted in localStorage
5. **Gästebuch** – Remark42 eingebettet, Login via GitHub/Google/Email
6. **Kontakt** – Formular (E-Mail via API-Endpoint oder Formspree)
7. **CV/Skills** – Kurze Übersicht der Kenntnisse (Startseite oder „Über mich"-Bereich)
8. **Zweisprachig** – DE/EN per Sprachumschalter oben rechts

## Design-Richtung

- Moderner, sauberer Minimalismus
- Sans-Serif Schrift (z. B. Inter)
- Akzentfarbe (noch offen)
- Projektkarten mit Schatten & Hover-Effekt
- Dark/Light Theme via CSS-Variablen

## Ausstehende Entscheidungen

- [x] Akzentfarbe / Lieblingsfarbe → Indigo `#4f46e5` (Light) / `#818cf8` (Dark)
- [x] Startseiten-Layout: grosses Hero vs. Dashboard mit neuesten Einträgen → Grosses Hero
- [x] Eigene Domain (z. B. `deinname.dev`) → `j-bot.net`

## Umsetzungsschritte

| #  | Schritt                         | Beschreibung                                              | Status         |
| -- | ------------------------------- | --------------------------------------------------------- | -------------- |
| 1  | Astro-Projekt initialisieren    | `npm create astro@latest`, i18n einrichten, Grundlayout   | ✅ Erledigt     |
| 2  | Startseite bauen                | Hero, Vorstellung, Skills                                 | ✅ Erledigt     |
| 3  | Projekte-Seite                  | Content-Sammlung, Übersicht, Detailseiten                 | ✅ Erledigt     |
| 4  | Blog                            | Content-Sammlung, Übersicht, Einzelseiten, RSS            | ✅ Erledigt     |
| 5  | Dark Mode                       | CSS-Variablen, Toggle-Komponente, localStorage            | ✅ Erledigt\*   |
| 6  | Kontaktseite                    | Formular (Formspree oder eigener API-Endpoint)            | ✅ Erledigt     |
| 7  | Gästebuch                       | Remark42 aufsetzen, in Astro einbetten                    | ✅ Erledigt\*   |
| 8  | Zweisprachigkeit                | Übersetzungsdateien, Sprachumschalter, Routen             | ✅ Erledigt\*   |
| 9  | Railway-Deployment              | Config, Domain, Remark42-Service, CI/CD                   | ✅ Erledigt     |
| 10 | Inhalt befüllen                 | Projekte & Blogposts in DE und EN                         | 🟡 Teilweise\*  |

\* **Anmerkungen zu vorgezogenen Schritten:**

- **Schritt 5 (Dark Mode):** Bereits in Schritt 1 umgesetzt – CSS-Variablen in
  `src/styles/global.css`, No-FOUC-Script und Toggle in `BaseLayout.astro`,
  Persistenz via `localStorage`. Voll funktionsfähig.
- **Schritt 7 (Gästebuch):** `GuestbookView.astro` bettet das Remark42-Embed ein
  (offizielles `embed.js`-Snippet, Theme folgt der `.dark`-Klasse, Locale `de`/`en`).
  Konfiguration in `src/config.ts` über die Env-Variablen
  `PUBLIC_REMARK42_HOST` und `PUBLIC_REMARK42_SITE_ID`; ohne Host wird ein
  Fallback mit Link zur Kontaktseite angezeigt. Seitenrouten `/guestbook` (DE)
  und `/en/guestbook` (EN); Nav-Link war bereits in Schritt 1 angelegt. Der
  eigentliche Railway-Service für Remark42 wird in Schritt 9 aufgesetzt.
- **Schritt 8 (Zweisprachigkeit):** Bereits in Schritt 1 umgesetzt –
  `astro.config.mjs` i18n-Konfig, `src/i18n/ui.ts` Übersetzungen,
  `src/i18n/utils.ts` Helper (`getLangFromUrl`, `t`, `localizePath`),
  `LanguageSwitcher.astro`, DE/EN-Routen für alle bestehenden Seiten.
- **Schritt 9 (Railway-Deployment):** Multi-Stage-`Dockerfile` baut die Astro-
  Site mit Node 20 und serviert die statischen Files mit Caddy 2 (`Caddyfile`,
  lauscht auf Railways `$PORT`, long-cache für `_astro/*`, Clean-URLs via
  `try_files`). `railway.json` definiert Start-/Healthcheck-Config für den
  `astro-frontend`-Service, `.dockerignore` hält das Image klein. Der separate
  `remark42-comments`-Service lebt in `remark42/`: `Dockerfile` (FROM
  `umputun/remark42:1.12.0`), `remark42.yml` (Site-ID `mywebspace`, Bolt lokal /
  `${DATABASE_URL}` auf Railway, GitHub-/Google-OAuth via Env), `docker-compose.yml`
  für lokales Testen ohne DB, `.env.example` für Secrets und `README.md` mit
  Schritt-für-Schritt-Anleitung (Service anlegen, PostgreSQL-Add-on, OAuth-
  Callbacks `${REMARK42_PUBLIC_URL}/auth/<provider>/callback`, Frontend-Vars
  `PUBLIC_REMARK42_HOST`/`PUBLIC_REMARK42_SITE_ID` setzen und neu bauen). Im
  Repo liegt zusätzlich `.env.example` für die Frontend-Variablen. Build wurde
  lokal mit `npm run build` (20 Seiten) verifiziert; das Docker-Image konnte
  nicht gebaut werden, weil Docker Desktop nicht lief – die Dockerfiles verwenden
  nur gängige offizielle Base-Images.
- **Schritt 10 (Inhalt):** Projekt-Beispielinhalte liegen in DE und EN vor
  (`wetter-cli`, `notizbuch`, `ki-spickzettel`); Blogposts liegen nun ebenfalls
  in DE und EN vor (`hallo-welt`/`hello-world`, `railway-setup`).