---
title: My Railway deployment setup
description: How I host this site – Astro static build, Caddy and why Railway is enough for small projects.
tags:
  - Astro
  - Railway
  - Deployment
date: 2025-10-20
lang: en
---

After some experimentation I settled on Railway for this site. Here's the
short version of the setup.

## Components

- **Astro** builds static files (`npm run build`).
- A lightweight web server serves the files.
- **Remark42** runs as its own service for guestbook comments.

## Why Railway?

- One platform, multiple services, reasonable cost for hobby projects.
- CLI and dashboard are pleasant, GitHub integration included.
- Connecting a custom domain worked without hassle.

## What I learned

- Keep builds smaller than you think.
- Document environment variables consistently in the repo (without values!).
- Don't forget backups of the Remark42 database.

Once everything is finalised I'll write a more detailed post with the exact
steps.
