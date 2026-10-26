#!/usr/bin/env node
// Lists SkyPermit business rules that have no test case yet. No model tokens: it only compares lists.
//
// Usage (from the project root):
//   node scripts/uncovered-rules.mjs [max-rules] [gate]
//   node scripts/uncovered-rules.mjs --remove <test-cases/.../TC-*.md>
//
// Rules come from the table in ../skypermit/docs/06-business-rules.md section 6
// (columns: Gate | Condition | rule_reference), with 07-clarifications.md applied (see OVERRIDES).
// A rule is covered when some case in test-cases/ has the same Gate, Rule reference and
// Rule condition fields (all three: rule_reference alone is not unique, "ZC-2026.1 §2" is shared).
//
// Output is always one JSON object on stdout. Handled problems are reported as
// {"status":"error", ...} with exit code 0, so the caller (a !`...` injection) still receives them.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = path.resolve(ROOT, '..', 'skypermit', 'docs');
const CASES = path.join(ROOT, 'test-cases');

const GATE_ORDER = ['PILOT', 'AIRCRAFT', 'ZONE', 'TIME_WINDOW', 'REGISTRATION'];
const DEFAULT_MAX_RULES = 5;

// 07-clarifications.md, applied on top of 06. Matched by a substring of the (lower-cased) condition.
// forceGate: 07 item 1 moved the weight-band check from ZONE to AIRCRAFT; 06 already says so,
//            this keeps the result right if a stale copy of 06 still lists it under ZONE.
// citationConfirmed: false marks rules whose citation 07 item 4 / 05-open-questions leaves unconfirmed.
const OVERRIDES = [
  { match: 'weight band', forceGate: 'AIRCRAFT', source: '07-clarifications.md item 1' },
  { match: 'zone inactive', citationConfirmed: false, source: '07-clarifications.md item 4' },
];

// Known open questions that are not rules (07 item 3): never turned into cases.
const STATIC_OPEN_QUESTIONS = [
  {
    gate: null,
    rule_reference: null,
    question: 'Operator.status = SUSPENDED: status code and response body for blocked create/submit/approve are undefined (07-clarifications.md item 3). Not a gate outcome, so no case is generated.',
  },
];

function out(obj) {
  process.stdout.write(JSON.stringify(obj, null, 2) + '\n');
}

function fail(message, extra = {}) {
  out({ status: 'error', error: message, ...extra });
  process.exit(0);
}

const clean = (s) => s.replace(/`/g, '').replace(/\*\([^)]*\)\*/g, '').replace(/\s+/g, ' ').trim();
const norm = (s) => clean(s).toLowerCase();

function removeCase(arg) {
  if (!arg) fail('--remove needs a path to a test case file');
  const target = path.resolve(ROOT, arg);
  const rel = path.relative(CASES, target);
  if (rel.startsWith('..') || path.isAbsolute(rel)) fail(`refusing to remove outside test-cases/: ${arg}`);
  if (!/^TC-[A-Z]+-\d{3}\.md$/.test(path.basename(target))) fail(`refusing to remove a file that is not TC-*-NNN.md: ${arg}`);
  if (!fs.existsSync(target)) fail(`file not found: ${arg}`);
  const text = fs.readFileSync(target, 'utf8');
  if (!/^- \*\*Status:\*\* Draft\s*$/m.test(text) || !/^- \*\*Execution Result:\*\* Not Run\s*$/m.test(text)) {
    fail(`refusing to remove a case that is not Draft / Not Run: ${arg}`);
  }
  fs.unlinkSync(target);
  out({ status: 'ok', removed: path.relative(ROOT, target).split(path.sep).join('/') });
  process.exit(0);
}

function parseRules() {
  const file = path.join(DOCS, '06-business-rules.md');
  if (!fs.existsSync(file)) fail(`cannot find ${file}`);
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  const start = lines.findIndex((l) => /^##\s+6\./.test(l));
  if (start < 0) fail('section "## 6." not found in 06-business-rules.md');
  const rules = [];
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i];
    if (/^##\s/.test(line)) break;
    if (!line.startsWith('|')) continue;
    const cells = line.split('|').slice(1, -1).map((c) => c.trim());
    if (cells.length !== 3 || /^-+$/.test(cells[0].replace(/[:\s]/g, '')) || /^Gate$/i.test(cells[0])) continue;
    const gateMatch = cells[0].match(/^`([A-Z_]+)`$/);
    const refMatch = cells[2].match(/`([^`]+)`/);
    if (!refMatch) fail(`cannot read rule_reference from row: ${line}`);
    rules.push({
      gate: gateMatch ? gateMatch[1] : 'REGISTRATION',
      condition: clean(cells[1]),
      rule_reference: refMatch[1].trim(),
      citation_confirmed: true,
      notes: [],
    });
  }
  if (rules.length === 0) fail('no rows parsed from section 6 of 06-business-rules.md');
  return rules;
}

function applyClarifications(rules) {
  for (const rule of rules) {
    for (const o of OVERRIDES) {
      if (!rule.condition.toLowerCase().includes(o.match)) continue;
      if (o.forceGate && rule.gate !== o.forceGate) {
        rule.notes.push(`gate ${rule.gate} -> ${o.forceGate} per ${o.source}`);
        rule.gate = o.forceGate;
      }
      if (o.citationConfirmed === false) {
        rule.citation_confirmed = false;
        rule.notes.push(`citation not confirmed per ${o.source}`);
      }
    }
  }
  return rules;
}

function readField(text, name) {
  const m = text.match(new RegExp(`^- \\*\\*${name}:\\*\\*\\s*(.+?)\\s*$`, 'm'));
  return m ? clean(m[1]) : null;
}

function listCaseFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...listCaseFiles(p));
    else if (/^TC-[A-Z]+-\d{3}\.md$/.test(entry.name)) files.push(p);
  }
  return files;
}

function coveredKeys() {
  const keys = new Map();
  for (const file of listCaseFiles(CASES)) {
    const text = fs.readFileSync(file, 'utf8');
    const gate = readField(text, 'Gate');
    const ref = readField(text, 'Rule reference');
    const cond = readField(text, 'Rule condition');
    if (!gate || !ref || !cond) continue;
    const key = [gate.toUpperCase(), norm(ref), norm(cond)].join('|');
    keys.set(key, path.relative(ROOT, file).split(path.sep).join('/'));
  }
  return keys;
}

function parseArgs(argv) {
  let maxRules = DEFAULT_MAX_RULES;
  let gate = 'ALL';
  const rest = [];
  for (const a of argv) {
    if (/^\d+$/.test(a)) maxRules = parseInt(a, 10);
    else rest.push(a);
  }
  if (rest.length > 1) fail(`unexpected arguments: ${rest.join(' ')}. Usage: [max-rules] [gate]`);
  if (rest.length === 1) gate = rest[0].toUpperCase();
  if (gate !== 'ALL' && !GATE_ORDER.includes(gate)) {
    fail(`unknown gate "${rest[0]}". Valid: ${GATE_ORDER.join(', ')}, ALL`, { valid_gates: GATE_ORDER });
  }
  if (maxRules < 1) fail('max-rules must be a positive integer');
  return { maxRules, gate };
}

function main() {
  const argv = process.argv.slice(2);
  if (argv[0] === '--remove') removeCase(argv[1]);
  const { maxRules, gate } = parseArgs(argv);

  const rules = applyClarifications(parseRules());
  const covered = coveredKeys();
  const keyOf = (r) => [r.gate, norm(r.rule_reference), norm(r.condition)].join('|');

  const inScope = rules.filter((r) => gate === 'ALL' || r.gate === gate);
  const gaps = inScope
    .filter((r) => !covered.has(keyOf(r)))
    .sort((a, b) => GATE_ORDER.indexOf(a.gate) - GATE_ORDER.indexOf(b.gate));

  const byGate = {};
  for (const g of gaps) byGate[g.gate] = (byGate[g.gate] || 0) + 1;

  const selected = gaps.slice(0, maxRules);
  out({
    status: 'ok',
    args: { max_rules: maxRules, gate },
    rules_checked: inScope.length,
    gaps_found: gaps.length,
    gaps_selected: selected.length,
    gaps_skipped: gaps.length - selected.length,
    gaps_by_gate: byGate,
    gaps: selected,
    open_questions: STATIC_OPEN_QUESTIONS,
  });
}

try {
  main();
} catch (err) {
  fail(`unexpected failure: ${err.message}`);
}
