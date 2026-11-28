# Documentation

Everything about how this site is built, written, checked and kept current. Start with the
one that matches what you are trying to do.

| If you want to… | Read |
|---|---|
| Understand how the site is put together | [architecture.md](architecture.md) |
| Edit or add content on either page | [content-model.md](content-model.md), then [writing-guide.md](writing-guide.md) |
| Change or add a simulation | [simulations.md](simulations.md) |
| Change or add a figure | [figures.md](figures.md) |
| Know why every link carries a commit hash, and what the checks enforce | [provenance.md](provenance.md) |
| Bring the site up to date after the CLPR repositories change | [syncing.md](syncing.md) (human overview) and [`.claude/skills/clpr-sync/SKILL.md`](../../.claude/skills/clpr-sync/SKILL.md) (the step-by-step procedure Claude follows) |
| Find which site section depends on which upstream file | [content-map.md](content-map.md) |
| How the website builds the pages, the standalone preview the gates use, CI, or share a page as one file | [deployment.md](deployment.md) |
| Run the build, the checks and the screenshot tools | [testing.md](testing.md) |
| Know why things are the way they are | [decisions.md](decisions.md) |

Two files outside this folder matter as much: [`CLAUDE.md`](../CLAUDE.md) at the explainer's root is the short
rulebook an AI assistant reads before touching the repository, and [`CHANGELOG.md`](../CHANGELOG.md)
records every sync with the upstream commit range it was reviewed against.

## The site in one paragraph

Two static pages, built with Astro and MDX, no UI framework, no runtime dependencies. The
general page (`/`) explains CLPR from nothing in everyday language; the developer page
(`/developers/`) goes to full depth with the specification's own structure. Both are organized
around the same centrepiece, an animated 28-step round trip of one message, and both carry
interactive simulations whose numbers are real (SHA-256 and Keccak-256 are computed in the
browser). Every claim about the protocol is written against pinned commits of the five
LFDT-CLPR repositories, every upstream link carries that commit, and scripts fail the build if
the pages and the pin manifest disagree. A sync procedure re-reads upstream diffs, updates the
affected sections and moves the pins forward.

## Repository layout

```
src/
  content/general.mdx        prose + components for the general page
  content/developers.mdx     prose + components for the developer page
  data/sections.json         the section registry (ids, titles, order) for both pages
  data/journey.json          the 28 steps, both directions, with spec refs
  data/sources.json          the provenance manifest: upstream repos and pinned commits
  lib/sources.ts             pinned-link helpers: one per specification document (overview(), messaging(), ...), sol(), pinned()
  layouts/Site.astro         the website's header and footer around the engine's base layout
  components/                the site's own header, footer and data-driven lists (Cast, Repos, Roles, the tables)
  components/diagrams/       the static figures, one .astro file each
  components/sims/           the interactive simulations (one .astro file each)
  pages/index.astro          mounts general.mdx
  pages/developers.astro     mounts developers.mdx
  styles/site-theme.css      the website's theme: the engine's tokens redefined for light and dark
checks/                      the site's own gates: check-data, check-detail, check-links, and browser/check-diagram-text
embed.mjs                    builds the pages into the website's public/plumbing/
(knowledge-site-engine)      the npm package that supplies the base layout, Section, Callout, Figure, Refs and the
                             other generic components, the shared styles, and every `kse` command: sync-upstream,
                             pin-upstream, check, check-anchors, content-map, audit-input, shot, overflow, export-single
docs/                        this folder

At the repository root, beside explainer/:
.claude/skills/clpr-drift/   what moved upstream and what it touches (report only)
.claude/skills/clpr-audit/   does every statement in the repository still match its source (report only)
.claude/skills/clpr-sync/    the sync procedure as a Claude skill (the only one that edits)
.claude/skills/clpr-figure/  how to draw a figure or simulation in the website's vocabulary, and art.mjs
.github/workflows/           explainer.yml (the gates), upstream-watch.yml, dco.yml, site-policy.yml
```
