---
title: Mein Deployment-Setup mit Railway
description: Wie ich diese Seite hoste – Astro Static Build, Caddy und warum Railway für kleine Projekte reicht.
tags:
  - Astro
  - Railway
  - Deployment
date: 2025-10-20
lang: de
---

Für diese Seite habe ich mich nach etwas Herumprobieren für Railway entschieden.
Hier die Kurzfassung des Setups.

## Komponenten

- **Astro** baut statische Dateien (`npm run build`).
- Ein schlanker Webserver reicht die Dateien aus.
- **Remark42** läuft als eigener Service für Kommentare im Gästebuch.

## Warum Railway?

- Eine Plattform, mehrere Services, überschaubare Kosten für Hobby-Projekte.
- CLI und Dashboard sind angenehm, GitHub-Integration inklusive.
- Eigene Domain ließ sich problemlos anbinden.

## Was ich gelernt habe

- Builds kleiner halten, als man denkt.
- Environment-Variablen konsequent ins Repo-Dokument packen (ohne Werte!).
- Backups der Remark42-Datenbank nicht vergessen.

Sobald alles final konfiguriert ist, schreibe ich einen ausführlicheren Post
mit den exakten Schritten.
