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

- [ ] Akzentfarbe / Lieblingsfarbe
- [ ] Startseiten-Layout: grosses Hero vs. Dashboard mit neuesten Einträgen
- [ ] Eigene Domain (z. B. `deinname.dev`)

## Umsetzungsschritte

| #  | Schritt                         | Beschreibung                                              |
| -- | ------------------------------- | --------------------------------------------------------- |
| 1  | Astro-Projekt initialisieren    | `npm create astro@latest`, i18n einrichten, Grundlayout   |
| 2  | Startseite bauen                | Hero, Vorstellung, Skills                                 |
| 3  | Projekte-Seite                  | Content-Sammlung, Übersicht, Detailseiten                 |
| 4  | Blog                            | Content-Sammlung, Übersicht, Einzelseiten, RSS            |
| 5  | Dark Mode                       | CSS-Variablen, Toggle-Komponente, localStorage            |
| 6  | Kontaktseite                    | Formular (Formspree oder eigener API-Endpoint)            |
| 7  | Gästebuch                       | Remark42 aufsetzen, in Astro einbetten                    |
| 8  | Zweisprachigkeit                | Übersetzungsdateien, Sprachumschalter, Routen             |
| 9  | Railway-Deployment              | Config, Domain, Remark42-Service, CI/CD                   |
| 10 | Inhalt befüllen                 | Projekte & Blogposts in DE und EN                         |