# Provenance

Why every upstream link carries a commit hash, what `sources.json` holds, and what the checks
enforce.

## The problem being solved

The site makes several hundred claims about a protocol whose specification keeps changing: one
version is final while the next is open on `main`. A claim that was true in August can
be false in October. Linking to `main` would let the text and its evidence drift apart silently.
So the site never links to a branch: every claim is written against a specific commit of a
specific repository, the commit is recorded in one manifest, every link embeds it, and the build
fails if the pages and the manifest disagree.

## The manifest: `src/data/sources.json`

```json
{
  "org": { "name": "LFDT-CLPR", "url": "https://github.com/LFDT-CLPR", "lab": "…", "labUrl": "…" },
  "lastSynced": "2026-11-28",
  "sources": [
    {
      "id": "clpr-spec",
      "repo": "https://github.com/LFDT-CLPR/clpr-spec",
      "branch": "main",
      "commit": "da68222b9b7732e925062dc17bc142d6ebff657b",
      "committedAt": "2026-11-23T11:47:47-06:00",
      "role": "The CLPR Specification: …",
      "watch": ["README.md", "clpr-overview.md", "protocol/", "ledgers/", "recommendations/", "clips/", "…"]
    }
  ]
}
```

| Field | Meaning |
|---|---|
| `id` | Short handle used in `pinned('<id>', path)` and in scripts |
| `repo`, `branch` | Where to fetch; the branch is only used to find the current head |
| `commit` | The full SHA the site's text was checked against. **Never edit by hand**; `kse pin-upstream` moves it |
| `committedAt` | The commit's date, shown in the provenance table |
| `role` | One sentence shown in the provenance table: what on the site relies on this repository |
| `watch` | Paths whose changes matter to the site; the drift report restricts its patches to these |
| `lastSynced` | The date the pins were last moved; shown on both pages |

The five sources at the initial release: `clpr-spec`, `clpr-smart-contracts`, `clpr-endpoint`,
`governance`, `org-profile` (the organization's `.github` repository).

## How links are built

`src/lib/sources.ts` turns the manifest into URLs. `pack.json` `docs` registers one document key
per specification file (`overview`, `conventions`, `ledgerConfig`, `manifest`, `channelSetup`,
`connectorSetup`, `messaging`, `bundle`, `verifierIface`, `transitions`, `endpointSync`, `schema`,
`openIssues`, `service`, `stakes`, `economics`), and `sources.ts` exports a helper of the same name for
each:

| Helper | Produces |
|---|---|
| `overview(anchor)` | `…/clpr-spec/blob/<commit>/clpr-overview.md#<anchor>` |
| `messaging(anchor)`, and one per other key | `…/clpr-spec/blob/<commit>/protocol/messaging.md#<anchor>`, and so on |
| `sol(path, line?)` | `…/clpr-smart-contracts/blob/<commit>/<path>#L<line>` |
| `pinned(id, path?, anchor?)` | any file in any source at its commit; with no path, the repository tree at the commit |
| `short(id)` | the seven-character commit for display |

Anchors are GitHub heading slugs: lower-case, punctuation removed, each space becomes a hyphen
(so `5.1 Trust anchor catch-up` is `51-trust-anchor-catch-up`, `OI-4. Compensation for sending
bundles` is `oi-4-compensation-for-sending-bundles`, and ``2.1 `registerChannel` `` is `21-registerchannel`).

## What the checks enforce

`pnpm run check` runs after every build (locally via `pnpm test`, and in both workflows):

**`kse check-provenance`**
- every source has a 40-hex `commit` and a parseable `committedAt`; `lastSynced` is a date;
- both built pages contain every source's short commit in the provenance table;
- no link into an LFDT-CLPR repository uses `blob/main`, `tree/main`, `raw/main` or `master`;
- the sections in each built page match `sections.json` exactly, in order;
- no element id appears twice on a page (this catches a sim id colliding with a section id).

**`kse check-links`**
- every `href="#…"` resolves to an id on the same page;
- every relative or root-relative link resolves to a file in `dist/` (root-relative links carry the
  `BASE_PATH` prefix when the site is built under one, as under `/plumbing/` in the website; the checker strips it);
- external links are counted, not fetched.

**`kse check-anchors`** (run explicitly; needs `.upstream/` from a sync fetch)
- every document-helper call (`messaging('…')`, `stakes('…')`, and the rest named in `pack.json`
  `refHelpers`), every ref in `sections.json`, the data files and `journey.json`, exists as a
  heading in the pinned specification document its key names;
- every `pinned(id, path)` and `sol(path)` points at a file that exists upstream.

It scans `src/` only, so documentation can show examples without tripping it.

**`kse check-vocab`**
- no file under `src/` uses a word the site once invented for a protocol part (courier, post
  office, outbox, ticket number, fingerprint, signature card, address book, sealed envelope,
  notebook); the specification's terms are the names, explained in plain words at first use
  ([writing-guide.md](writing-guide.md));
- a line carrying, or directly following, a `vocab-allow` marker is exempt; that is reserved for a
  one-time comparison that says it is a comparison.

**`checks/check-data.mjs`**
- every section in `sections.json` and every row in the other `src/data/*.json` files has at least
  one `refs` entry, with keys in the order `doc, anchor, label` or `doc, id, path, label` (the
  anchor check matches them textually), and every `repo` ref names a source id in `sources.json`;
- every source id is cited by at least one component in `catalog.json`, and every component has a
  place on the Architecture map;
- with `.upstream/` present: every directory under `clpr-spec/ledgers/` that has a `ledger.md` is the
  `specDir` of a row in `ledgers.json`, and every verifier code directory
  (`clpr-smart-contracts/src/verifiers/**` except `common`) is the `codeDir` of one; every `## OI-n.`
  heading of Open issues is cited by exactly one row of `open.json`; the bold role names of the
  Overview §5 table match the rows of `roles.json`; the number of patterns Overview §8 names matches
  `patterns.json`; every part of the Overview §2 table has an entry in `cast.json`; and every
  `recovery` field in `roles.json` and `failures.json` names an R-row of the CLPR Service §7 recovery
  table and cites §7. A failure here is the list of upstream things the site has not described yet,
  or no longer matches.

**`kse check-orphans`**
- every component under `src/components/` is imported by a page, a content file or another component, so a figure or simulation nobody renders cannot linger in the anchor check and the content map.

**`kse content-map --check`**
- `docs/content-map.md` is byte-identical to what the generator produces from the refs above, the
  journey steps and the pinned-link calls in components. Regenerate with `pnpm run content-map`.

## Reading a failure

| Message | Likely cause | Fix |
|---|---|---|
| `provenance table does not show clpr-spec@…` | `dist/` is stale | `pnpm run build` first |
| `unpinned upstream link …/blob/main/…` | a hand-written URL in MDX or a sim | use a document helper (`messaging()`, …), `sol()` or `pinned()` |
| `sections […] do not match sections.json` | a section was added to one place only, or reordered | make the JSON and the MDX agree |
| `duplicate element id "money"` | a sim rendered with the same id as a section or another sim | pass `id="money-dev"` |
| `messaging anchor #… not found in protocol/messaging.md` | the upstream heading was renamed or renumbered, or the slug is wrong | find the new heading in `.upstream/clpr-spec/…` and update every reference |
| `clpr-endpoint/docs/foo.md does not exist upstream` | the file moved | update the `pinned()` path |

## What provenance does not prove

Pinning proves that a link points at the text the author read. It does not prove the sentence
next to the link is a correct reading of it. That is what the sync procedure's review step, the
labelling rules in [content-model.md](content-model.md), and human reviewers are for.
