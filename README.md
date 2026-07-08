# IchMagTomaten — mywebspace

Persönliche Webseite mit [Astro](https://astro.build) — gehostet auf Railway.app.
Zweisprachig (DE/EN) mit Blog, Projektshowcase, Gästebuch und Dark Mode.

🌐 **Domain:** [j-bot.net](https://j-bot.net)

---

## Tech-Stack

| Komponente     | Technologie                          |
| -------------- | ------------------------------------ |
| Framework      | Astro (Static Site Generator)        |
| Sprachen       | Deutsch + Englisch (Built-in i18n)  |
| Inhalte        | Markdown-Dateien im Repo             |
| Hosting        | Railway.app + eigene Domain          |
| Dark Mode      | CSS-Variablen + localStorage         |
| Schriftart     | Inter (self-hosted via Fontsource)   |
| Kommentare     | Remark42 (geplant — Railway-Service) |

## Projektstruktur

```
mywebspace/
├── src/
│   ├── pages/           # Routen (DE + /en/*)
│   ├── content/         # Blog- & Projekt-Inhalte (geplant)
│   ├── layouts/         # BaseLayout (Nav, Footer, Dark Mode)
│   ├── components/      # Wiederverwendbare UI-Komponenten
│   ├── i18n/            # UI-Übersetzungen (ui.ts, utils.ts)
│   ├── styles/          # globales CSS mit Theme-Variablen
│   └── config.ts        # Site-Konfiguration (Name, Social-Links)
├── public/              # statische Assets (favicon.svg)
├── PLAN/                # Projektdokumentation (plan.md)
├── remark42/            # Dockerfile + Konfig (geplant)
├── railway.json         # Railway-Deployment-Konfig (geplant)
└── astro.config.mjs
```

## Features

- ✅ **Startseite** — Hero, Vorstellung, Skills
- ✅ **Zweisprachig** — DE/EN mit Sprachumschalter
- ✅ **Dark Mode** — Toggle mit localStorage-Persistenz
- ✅ **Responsive** — Mobile-first Layout
- 🚧 **Projekte-Übersicht** — in Arbeit
- 📋 **Blog** — geplant
- 📋 **Gästebuch** — geplant (Remark42)
- 📋 **Kontakt-Formular** — geplant
- 📋 **Railway-Deployment** — geplant

## Entwicklung

```bash
# Dependencies installieren
npm install

# Dev-Server starten (http://localhost:4321)
npm run dev

# Produktions-Build erstellen
npm run build

# Build lokal vorschauen
npm run preview

# Type-Check ausführen
npx astro check
```

## Konfiguration

Site-Konstanten (Name, E-Mail, Social-Links) in [`src/config.ts`](src/config.ts).
UI-Übersetzungen in [`src/i18n/ui.ts`](src/i18n/ui.ts).

## Lizenz

Privates Projekt. Alle Rechte vorbehalten.
