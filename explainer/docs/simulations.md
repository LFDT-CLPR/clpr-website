# Simulations

Every interactive piece on the site is one `.astro` file under `src/components/sims/`. This is
the catalogue, followed by the conventions for writing a new one.

## Catalogue

| Component | Pages | What it shows | Props | Real or simplified? |
|---|---|---|---|---|
| `Ledger.astro` | general §ledger | Five copies of one ledger agreeing on a new line; a dissenting node is overruled; the line is sealed (consensus, finality); the closing line says finality is the channel verifier's choice, with final or safe state recommended | `id` | Illustrative animation; the finality line follows Bundle §4 and CLPR Service §6.2 |
| `TrustDesigns.astro` | general §bridges | Three ways to carry a message (single relayer, 3-of-5 committee, CLPR) under three attacks (stolen keys, tampering, going offline) | `id` | CLPR's outcomes follow Overview §4, Messaging §4, Bundle §4 and Endpoint manifest §4; no cryptography |
| `Journey.astro` | general §journey (`mode="plain"`), developers §journey (`mode="both"`) | The 28-step round trip, both directions, with diagram nodes lighting up, a step list and narration | `mode` = `plain` \| `protocol` \| `both`, `id` | Narration and per-step refs from `src/data/journey.json`; timings are narrative, not measured |
| `RunningHash.astro` | general §running-hash, developers §queue (`detail`) | Five messages chained by SHA-256; tamper, drop, swap or insert and watch the chain diverge from the running hash proven for the last message | `id`, `detail` | **Real SHA-256** via WebCrypto, chained as Messaging §4 defines, over the UTF-8 text (the protocol hashes the canonical protobuf payload bytes, Messaging §3; the page says so) |
| `Money.astro` | general §money, developers §connectors (`detail`) | Who pays whom on delivery under the recommended design: execution cost, one Service-wide margin, connector balance, a balance meter; `CONNECTOR_UNDERFUNDED` and `CONNECTOR_NOT_FOUND` paths with connector slashing; `detail` adds the four slashing rules | `id`, `detail` | Charging and slashing from Channel economics §1, §2 and Stakes and bonds §2 (Recommendations; a deployment may differ); amounts are illustrative and no formula is shown |
| `Failures.astro` | general §failures, developers §recovery | A picker of thirteen failure modes with what happens, who pays, channel state, recovery and the source | `id` | Rows of `src/data/failures.json`, citing Overview §4, Messaging §5 to §8, Channel state transitions §2, §3 and §6, Stakes and bonds §2, Channel economics §1, CLPR Service §7 and Open issues OI-3 |
| `ChannelLife.astro` | developers §channels (`detail`) | The six channel statuses; in each status only the transitions the specification allows are enabled, including the administrative close and the recovery close | `id`, `detail` | Transitions from Channel state transitions §4 and §5 |
| `Extend.astro` | general §extend, developers §extend | The eight steps for adding a new ledger type, components appearing on a two-ledger diagram | `id` | Steps from the organization profile README, read against Overview §5, the Ledger Specifications index, Channel setup §4, Endpoint manifest §5, Connector setup §3 and CLPR Service §6.1 |
| `Architecture.astro` | general §lives, developers §implementations (`detail`) | A tappable map of the whole system: spec, native and contract services, verifiers, endpoints, sync protocol, connectors, applications, lab; each card names where the code lives | `id`, `detail` | Rows of `src/data/catalog.json`: the specification's README and the repositories' own READMEs and docs, pinned |
| `CommitReveal.astro` | developers §channels | Channel registration across two ledgers by commit and reveal, with an observer who sees only the commitment; a connector tab with the same two steps | `id` | **Real Keccak-256** implemented and self-tested in the component; the "public key" is random bytes standing in for a key. Rules from Channel setup §1, §2, §4 to §6 and Connector setup §1 to §3, §5; the EVM channel id from the EVM ledger family document |
| `SyncCycle.astro` | developers §sync | One sync cycle on one stream: four messages, editable queue state, the bundle the responder builds (a partial bundle when capped) | `id` | Rules from Endpoint sync §1 to §6, Bundle §2 to §4, Ledger configuration §3 and CLPR Service §5 and §6.8; numbers are illustrative |
| `BundleVerify.astro` | developers §verify | The bundle processing steps of Channel state transitions §2 and the progress criteria of §3 applied to one concrete bundle, step by step, with fault injection (verifier revert, no progress, oversized, gap, tampered, out-of-order reply) | `id` | **Real SHA-256** for the running hash (Messaging §4); the verifier's part follows Verifier interface §3; channel state values are illustrative |
| `Ordering.astro` | developers §ordering | The site's example queue: acknowledgements vs replies, retained DATA messages, the violation that pauses the channel and the first clean bundle that resumes it | `id` | Logic from Messaging §8 and §9 and Channel state transitions §6 |
| `TrustAnchor.astro` | developers §verifiers | Trust anchor changes in two modes, a changing anchor (qbft-epoch) and a fixed anchor (hints-wraps); transition bundles, outages and catch-up; what the trust anchor is for each proof scheme | `id` | Rules from Verifier interface §1, §3 and §4, Endpoint sync §5.1 and the proof schemes listed in the Ledger Specifications index; the epoch timeline is illustrative |
| `NetworkShapes.astro` | general §shapes | Pick a shape built from pairs (pair, star, mesh, private to public), then a sender and a receiver; the log says whether a channel joins them directly, and that forwarding through a third ledger is built by applications | `id` | The site's illustration (Overview §2 and §3, Channel setup §1, Endpoint manifest §1 and §6) |
| `AtomicSwap.astro` | general §patterns | Two-phase commit across three ledgers: prepare, then commit or roll back, as ordinary messages with replies; run with everyone ready or with one ledger unable | `id` | The site's illustration of a pattern Overview §8 names; relies only on Overview §3 and §8 |
| `Stories.astro` | general §who, developers §operate | Four scenarios in which the six roles of Overview §5 work together, as step-throughs, roles lit as they act; steps come from `roles.json` | `id` | Data-driven (Overview §5, Connector setup §5, CLPR Service §7) |

## Conventions (copy an existing sim)

Structure:

```astro
---
const { id = 'my-thing-sim', detail = false } = Astro.props as { id?: string; detail?: boolean };
---
<div class="sim mything" id={id}>
  <div class="sim__head"><div><span class="kind">Simulation</span><h3>Title</h3></div><span class="pill grey" data-role="status">…</span></div>
  <div class="sim__body">… inline SVG with a viewBox, or plain HTML …</div>
  <div class="sim__controls">… <button class="btn" data-role="…"> …</div>
  <div class="sim__log" data-role="log">…</div>
</div>
<script>
  for (const root of Array.from(document.querySelectorAll<HTMLElement>('.sim.mything'))) {
    // hooks by data-role, never by id, so two instances on one page both work
  }
</script>
```

Rules:

- **Theme tokens only.** SVG fills and strokes use `d-a d-b d-c d-ok d-bad d-money d-grey
  d-surface`; text uses `t`, `t small`, `t b`, `t center`, `t mono`, `t muted`. Buttons use
  `.btn` (`.primary`, `.danger`, `aria-pressed`), sliders `.range`, badges `.pill`, state cards
  `.result`, step cards `.step-card`, step lists `.step-list`.
- **Two instances must coexist.** Default `id` ends in `-sim`; the page passes another id when
  it uses the sim twice. Scripts loop over `.sim.<name>`.
- **Server-render the text.** Narration, cards and lists are rendered at build time from data
  (JSON or an array in the frontmatter) and only toggled client-side. The page is complete
  without JavaScript; scripts add motion and interaction.
- **Cite.** Each sim prints its sources (a `Source:` line or per-step refs) using the pinned
  helpers. `kse check-anchors` verifies the references exist upstream.
- **Say what is simplified.** If the sim hashes text instead of protobuf, uses a fixed fine, or
  invents an epoch length, it says so on screen.
- **Phone width and both themes.** `viewBox` SVGs scale; text at 11 px or larger; wrap very wide
  drawings in `<Figure>`. Check with `pnpm exec kse overflow <path> 400` and a screenshot in
  dark mode (`pnpm exec kse shot … '[data-theme-choice="dark"]'`; the default follows the system, which the shot emulates as light).
- **Accessibility.** Native `<button>`s, `aria-pressed` on toggles, `role="img"` with an
  `aria-label` on SVGs, keyboard handlers on clickable SVG groups (`tabindex="0"`, Enter/Space).
- **No external resources, no storage, no fetches.** Everything the sim needs is in the file.
- **Never scroll the window.** `scrollIntoView` moves every scrollable ancestor, including the
  page; use `scrollListTo(list, item)` from `@kse/lib/scroll` to keep a list row visible.
- **`hidden` inside SVG** only works because `global.css` has `svg [hidden] { display: none }`;
  toggle it with `toggleAttribute('hidden', …)`, not the `.hidden` property, which SVG elements
  do not have.
- **Shared chrome** in `global.css`: `.sim__track` (progress; `--p` or the `.seg` variant),
  `.sim__scroll` + `.sim__scroll-note` (a phone scroll frame for a wide drawing), `.sim__log .line`
  (a mono first line), `.sim__controls .kicker` and `.group`, `.pill.pulse`, `li.done` in a step
  list, `--card-min` on `.step-card`, `aria-busy` on the root during a timed run. Component-specific
  styling goes in the component's own `<style>` block, scoped to `.sim.<name>`.
- **Drawings wider than the column.** The column is 840px. The journey (920) and the architecture
  map (940) keep their `min-width` only below 1240px. From there `site-theme.css` lets the sim spill
  into the right margin and the drawing fits it, so neither scrolls on a desktop screen. A new wide
  simulation joins the same two rules.

## Motion in the website's style

A simulation or the hero may move a message the way the landing page does: a glowing star with
class `art-move` and an `offset-path` in its style travels the path; `--dur`, `--delay` and
`--rest` set its timing and where it rests under reduced motion (site-theme.css). Static figures
never move. Shapes come from the `clpr-figure` skill's vocabulary (docs/figures.md).

## Testing a sim

0. `pnpm run check:browser` drives every simulation on both pages and fails on errors, on a click
   that moves the window, or on SVG text under 10px at 400px.
1. `pnpm run build`.
2. `pnpm exec kse shot /developers/ out.png 1280 false '#my-thing-sim [data-role="next"]|#my-thing-sim [data-role="next"]'`
   drives it a few steps and reports console errors; open the PNG.
3. The same shot with '[data-theme-choice="dark"]' as the first click for dark mode; `pnpm exec kse overflow /developers/ 400` for
   phones.
4. If the sim computes something (a hash, a fee), verify one value independently (Python's
   `hashlib`, a calculator) and keep the self-test in the component if there is one.
