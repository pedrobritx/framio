# Security Policy

## Reporting a vulnerability

Please report security issues privately, **not** in a public issue.

- Open a private advisory via GitHub:
  **Security → Advisories → Report a vulnerability** on
  [github.com/pedrobritx/framio](https://github.com/pedrobritx/framio/security/advisories/new), or
- Email **pedrobritx@gmail.com**.

Please include steps to reproduce and the affected version or commit. We'll
acknowledge your report and keep you updated on the fix.

## Supported versions

Framio is under active development; security fixes land on the default branch
and in the latest release. There is no long-term-support branch.

## Scope

Framio is a **static, keyless, client-side** web app with no backend of its own,
which shapes its threat model:

- **No secrets.** It ships no API keys or credentials; the museum APIs are
  public and keyless. There is no server, database, or auth to attack.
- **Most relevant surfaces** are therefore:
  - **XSS** via strings returned from third-party museum APIs (titles, artists,
    descriptions). Museum HTML is stripped (`stripHtml`) and React escapes by
    default; report anywhere untrusted markup could execute.
  - **The export pipeline** — the client-side canvas compositor and the
    hand-written JPEG metadata writer (`lib/studio/metadata.ts`), which parses
    and rewrites image bytes.
  - **Dependency vulnerabilities** — tracked via Dependabot and CodeQL.

User data (favorites, collections, uploads) lives only in the visitor's own
browser (localStorage); it is never transmitted.

## Out of scope

Reports about the availability, rate limits, or content of third-party museum
APIs should go to those institutions. Denial-of-service against public museum
APIs is not a Framio vulnerability.
