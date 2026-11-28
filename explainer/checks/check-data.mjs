#!/usr/bin/env node
/**
 * Data check. Every data row under src/data/ carries upstream references in the shape
 * check-anchors.mjs resolves (doc keys from pack.json, or repo paths), every source id exists, and
 * (when .upstream/ is present) the data inventories match upstream: ledger directories with a
 * ledger.md under clpr-spec/ledgers/ and verifier code directories in clpr-smart-contracts ↔
 * ledgers.json, the "## OI-n." headings of protocol/open-issues.md ↔ open.json, the role rows of the
 * Overview §5 table ↔ roles.json, the patterns Overview §8 names ↔ patterns.json, the parts of the
 * Overview §2 table ↔ cast.json, and the R-rows of the CLPR Service §7 recovery table ↔ the
 * `recovery` fields of roles.json scenarios and failures.json cases. An inventory failure is the
 * list of upstream things the site has not described yet, or no longer matches.
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { upstreamDir as up, readData as read, pack } from 'knowledge-site-engine/scripts/lib/pack.mjs';
const sources = read('sources.json');
const ids = new Set(sources.sources.map((s) => s.id));
const errors = [];
const DOC_KEYS = Object.keys(pack.docs);
const KEYS = { ...Object.fromEntries(DOC_KEYS.map((k) => [k, ['doc', 'anchor', 'label']])), repo: ['doc', 'id', 'path', 'label'] };

function checkRef(where, r) {
  if (!r || typeof r !== 'object') return errors.push(`${where}: ref is not an object`);
  const want = KEYS[r.doc];
  if (!want) return errors.push(`${where}: ref doc must be one of ${DOC_KEYS.join(', ')} or repo (got "${r.doc}")`);
  const have = Object.keys(r);
  if (have.slice(0, want.length - 1).join(',') !== want.slice(0, -1).join(',')) errors.push(`${where}: ref keys must be in the order ${want.join(', ')} (got ${have.join(', ')}); check-anchors.mjs matches them textually`);
  if (!r.label) errors.push(`${where}: ref has no label`);
  if (r.doc === 'repo' && !ids.has(r.id)) errors.push(`${where}: unknown source id "${r.id}"`);
}
function checkRows(file, key, rows, min = 1) {
  if (!Array.isArray(rows) || rows.length < min) errors.push(`${file}: "${key}" needs at least ${min} row(s)`);
  for (const [i, row] of (rows ?? []).entries()) {
    const where = `${file} ${key}[${i}]`;
    if (!Array.isArray(row.refs) || row.refs.length === 0) errors.push(`${where}: no refs`);
    for (const r of row.refs ?? []) checkRef(where, r);
  }
}
// GitHub heading slug: lowercase, punctuation dropped, spaces to hyphens.
const slug = (heading) => heading.trim().toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s/g, '-');
// The text of one "## n. Title" section of a markdown file, up to the next "## " heading.
const section = (text, n) => text.split(new RegExp(`^## ${n}\\. `, 'm'))[1]?.split(/^## /m)[0] ?? '';
// The bold first cells of a markdown table: "| **Name** | ...".
const boldRows = (text) => [...text.matchAll(/^\|\s*\*\*([^*]+)\*\*\s*\|/gm)].map((m) => m[1].trim());

const sections = read('sections.json');
for (const page of ['general', 'developers']) checkRows('sections.json', page, sections[page], 1);
const catalog = read('catalog.json');
checkRows('catalog.json', 'components', catalog.components, 10);
const SVG_KEYS = ['spec', 'svcA', 'svcB', 'verB', 'epB', 'epA', 'wire', 'conB', 'appB', 'lab'];
for (const c of catalog.components) if (!SVG_KEYS.includes(c.k)) errors.push(`catalog.json: component "${c.k}" has no place on the Architecture map (add it to the SVG in Architecture.astro and to SVG_KEYS here first)`);
const usedIds = new Set(catalog.components.flatMap((c) => c.refs.filter((r) => r.doc === 'repo').map((r) => r.id)));
for (const id of ids) if (!usedIds.has(id)) errors.push(`catalog.json: source "${id}" is cited by no component`);
const ledgers = read('ledgers.json');
checkRows('ledgers.json', 'ledgers', ledgers.ledgers, 2);
for (const l of ledgers.ledgers) if (!['documented', 'code', 'mock'].includes(l.status)) errors.push(`ledgers.json: "${l.id}" has unknown status "${l.status}"`);
for (const l of ledgers.ledgers) if ((l.status === 'documented') !== Boolean(l.specDir)) errors.push(`ledgers.json: "${l.id}" must have a specDir exactly when its status is "documented"`);
const patterns = read('patterns.json');
checkRows('patterns.json', 'patterns', patterns.patterns, 1);
checkRows('patterns.json', 'channelChoice', [patterns.channelChoice], 1);
const roles = read('roles.json');
checkRows('roles.json', 'roles', roles.roles, 1);
checkRows('roles.json', 'scenarios', roles.scenarios, 1);
const open = read('open.json');
checkRows('open.json', 'open', open.open, 1);
const failures = read('failures.json');
checkRows('failures.json', 'cases', failures.cases, 1);
for (const g of failures.groups) for (const k of g.keys) if (!failures.cases.some((c) => c.k === k)) errors.push(`failures.json: group "${g.kicker}" names unknown case "${k}"`);
const cast = read('cast.json');
checkRows('cast.json', 'cast', cast.cast, 1);

if (existsSync(up)) {
  const spec = (path) => readFileSync(join(up, 'clpr-spec', path), 'utf8');
  const dirs = (p) => (existsSync(p) ? readdirSync(p).filter((e) => statSync(join(p, e)).isDirectory()) : []);

  // Ledgers: a directory under ledgers/ with a ledger.md is a documented ledger (a family directory has none).
  const ledgerDirs = dirs(join(up, 'clpr-spec/ledgers')).filter((d) => existsSync(join(up, 'clpr-spec/ledgers', d, 'ledger.md')));
  const codeDirs = [
    ...dirs(join(up, 'clpr-smart-contracts/src/verifiers/evm')).filter((d) => d !== 'common').map((d) => `src/verifiers/evm/${d}`),
    ...(existsSync(join(up, 'clpr-smart-contracts/src/verifiers/hiero')) ? ['src/verifiers/hiero'] : []),
  ];
  for (const d of ledgerDirs) if (!ledgers.ledgers.some((l) => l.specDir === `ledgers/${d}`)) errors.push(`ledgers.json: upstream documents a ledger at clpr-spec/ledgers/${d}/ledger.md that has no row`);
  for (const d of codeDirs) if (!ledgers.ledgers.some((l) => l.codeDir === d)) errors.push(`ledgers.json: upstream has verifier code at clpr-smart-contracts/${d} that has no row`);
  for (const l of ledgers.ledgers) {
    if (l.specDir && !existsSync(join(up, 'clpr-spec', l.specDir, 'ledger.md'))) errors.push(`ledgers.json: "${l.id}" names ${l.specDir}, which has no ledger.md upstream`);
    if (l.codeDir && !existsSync(join(up, 'clpr-smart-contracts', l.codeDir))) errors.push(`ledgers.json: "${l.id}" names ${l.codeDir}, which no longer exists upstream`);
  }

  // Open issues: one row per "## OI-n. Title" heading, cited by its anchor.
  const oiAnchors = [...spec('protocol/open-issues.md').matchAll(/^## (OI-\d+\. .+)$/gm)].map((m) => slug(m[1]));
  const cited = (row) => row.refs.filter((r) => r.doc === 'openIssues' && oiAnchors.includes(r.anchor)).map((r) => r.anchor);
  for (const a of oiAnchors) {
    const n = open.open.filter((o) => cited(o).includes(a)).length;
    if (n !== 1) errors.push(`open.json: open issue #${a} must be cited by exactly one row (found ${n})`);
  }
  for (const o of open.open) if (cited(o).length !== 1) errors.push(`open.json: "${o.id}" must cite exactly one open issue heading of protocol/open-issues.md`);

  // Overview §5 roles, §8 patterns and §2 parts.
  const overview = spec('clpr-overview.md');
  const roleNames = boldRows(section(overview, 5));
  for (const n of roleNames) if (!roles.roles.some((r) => r.name === n)) errors.push(`roles.json: Overview §5 has the role "${n}", which has no row`);
  for (const r of roles.roles) if (!roleNames.includes(r.name)) errors.push(`roles.json: "${r.name}" is not a role of the Overview §5 table`);
  const named = section(overview, 8).match(/Patterns built on CLPR messages include (.+?)\.\s*$/m);
  if (!named) errors.push('patterns.json: the sentence naming the patterns in Overview §8 was not found; re-read §8 and adapt this check');
  else {
    const count = named[1].split(/;\s*(?:and\s+)?/).length;
    if (count !== patterns.patterns.length) errors.push(`patterns.json: Overview §8 names ${count} patterns, data has ${patterns.patterns.length}`);
  }
  const parts = boldRows(section(overview, 2));
  for (const p of parts) if (!cast.cast.some((c) => c.name === p || p.endsWith(` ${c.name}`))) errors.push(`cast.json: Overview §2 has the part "${p}", which has no entry`);

  // Recovery table: every R-row a data row follows must exist in CLPR Service §7.
  const rRows = [...section(spec('recommendations/clpr-service.md'), 7).matchAll(/^\|\s*(R\d+)\s*\|/gm)].map((m) => m[1]);
  if (rRows.length === 0) errors.push('CLPR Service §7 has no R-rows; re-read the recovery table and adapt this check');
  const followers = [...roles.scenarios.map((s) => [`roles.json scenario "${s.id}"`, s]), ...failures.cases.map((c) => [`failures.json case "${c.k}"`, c])];
  for (const [where, row] of followers) {
    if (row.recovery === undefined) continue;
    if (!rRows.includes(row.recovery)) errors.push(`${where}: recovery "${row.recovery}" is not a row of the CLPR Service §7 recovery table`);
    if (!row.refs.some((r) => r.doc === 'service' && r.anchor === '7-recovery-scenarios')) errors.push(`${where}: names recovery "${row.recovery}" but does not cite CLPR Service §7`);
  }
} else {
  console.log('check-data: .upstream/ not present, inventory comparison skipped (run npm run sync:fetch).');
}

if (errors.length) { console.error('Data check failed:\n- ' + errors.join('\n- ')); process.exit(1); }
console.log(`Data check passed: ${catalog.components.length} components, ${ledgers.ledgers.length} ledgers, ${patterns.patterns.length} patterns, ${roles.roles.length} roles, ${roles.scenarios.length} scenarios, ${open.open.length} open issues, ${failures.cases.length} failure cases, ${cast.cast.length} cast entries.`);
