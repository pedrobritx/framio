# Contributing to Framio

Thanks for helping make open-access art part of more people's lives. There's a
place here for code and non-code contributions alike.

## Ways to contribute

- **Write an art description** — the highest-leverage way to make art
  accessible. See [docs/DESCRIPTIONS.md](docs/DESCRIPTIONS.md); no code needed.
- **Help a museum open its collection** — point us at an open API or the
  `framio.collection.json` file. See [docs/OPEN-ACCESS.md](docs/OPEN-ACCESS.md).
- **Add a museum adapter** — see [docs/ADAPTERS.md](docs/ADAPTERS.md).
- **Fix a bug or build a feature** — read on.

## Development setup

Framio is a Next.js static-export app (React, TypeScript, Tailwind). No API keys
are needed — the museum APIs are keyless.

```bash
npm install
npm run dev          # http://localhost:3000
```

Before opening a pull request, make sure all four checks pass:

```bash
npm run typecheck    # tsc --noEmit
npm run lint         # ESLint + jsx-a11y
npm test             # Vitest
npm run build        # static export (set PAGES_BASE_PATH=/framio to mirror Pages)
```

## Guidelines

- **Keep it keyless and static.** Everything runs in the browser or at build
  time — no server, no required API keys, no new runtime dependencies unless
  clearly justified.
- **Open access only.** Only ever surface public domain / CC0 works, and never
  let Framio present someone else's work as its own — credit is core.
- **Accessibility is not optional.** New UI must be keyboard- and
  screen-reader-navigable; keep colour contrast at WCAG AA; honour
  `prefers-reduced-motion`. `npm run lint` runs `jsx-a11y`.
- **Match the surrounding code.** Follow the existing patterns, naming, and
  comment style. Add a test when you change behaviour.

## Pull requests

1. Branch off the default branch.
2. Keep the change focused; write a clear description of what and why.
3. Fill in the PR template checklist (tests, a11y, open-access).
4. CI must be green.

## Reporting issues

Use the [issue templates](https://github.com/pedrobritx/framio/issues/new/choose)
— bug, feature, museum request, or artwork description. Questions are welcome at
**pedrobritx@gmail.com**.

By contributing, you agree your code is licensed under the repository's
[MIT License](LICENSE), and any art descriptions you submit are dedicated to the
public domain under CC0.
