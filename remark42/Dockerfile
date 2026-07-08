# Remark42 comment service for the mywebspace project.
#
# This Dockerfile simply pins the upstream image and adds the project's
# config file so Railway can build & run a dedicated "remark42-comments"
# service in the same project as the Astro frontend.

FROM umputun/remark42:1.12.0

# Project config (mounted/loaded via REMARK42_CONFIG or default path).
COPY remark42.yml /srv/var/remark42.yml

# Railway injects PORT; Remark42 listens on it via --port.
EXPOSE 8081
