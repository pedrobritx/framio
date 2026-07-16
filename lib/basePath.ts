/**
 * Framio's default deployment target is the domain root (e.g.
 * https://framio.britx.me) — a dedicated GitHub Pages subdomain, not a path
 * under a shared account site. `PAGES_BASE_PATH` stays empty in that case.
 *
 * It only needs a value when the static export is published under a
 * sub-path instead — a classic GitHub Pages *project* page
 * (`https://<user>.github.io/<repo>/`), a fork, or a preview deploy nested
 * under another host. Set `PAGES_BASE_PATH=/<repo>` (leading slash, no
 * trailing slash) in that case; `.github/workflows/deploy.yml` already wires
 * this up automatically from the repo's Pages configuration.
 */
export const BASE_PATH = process.env.PAGES_BASE_PATH ?? '';

/**
 * Public origin the site is served from, used to resolve absolute URLs
 * (Open Graph images, canonical links). Defaults to the production
 * subdomain; override for forks, previews, or other custom domains.
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://framio.britx.me';
