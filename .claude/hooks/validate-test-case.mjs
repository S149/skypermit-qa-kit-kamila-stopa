#!/usr/bin/env node
// PreToolUse hook (matcher: Write): checks the format of a test case before it is written to test-cases/.
// Exit 0 = allow. Exit 2 = block; the problems go to stderr and Claude sees them and fixes the case.
// Files outside test-cases/ are ignored. The format comes from
// .claude/skills/test-case-creator/templates/test-case.md and the field rules in that skill's SKILL.md.
//
// stdin: { tool_name, tool_input: { file_path, content }, cwd, ... }

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const CASES = path.join(ROOT, 'test-cases');
const GATES = ['PILOT', 'AIRCRAFT', 'ZONE', 'TIME_WINDOW', 'REGISTRATION'];

let input;
try {
  input = JSON.parse(fs.readFileSync(0, 'utf8'));
} catch (err) {
  process.stderr.write(`validate-test-case: cannot read hook input: ${err.message}\n`);
  process.exit(1); // non-blocking error: a broken hook must not silently pass or block everything
}

const filePath = input?.tool_input?.file_path;
const rawContent = input?.tool_input?.content;
if (typeof filePath !== 'string' || typeof rawContent !== 'string') process.exit(0);
const content = rawContent.replace(/\r\n/g, '\n');

const target = path.resolve(input.cwd || ROOT, filePath);
const rel = path.relative(CASES, target);
if (rel.startsWith('..') || path.isAbsolute(rel)) process.exit(0);

const problems = [];
const relDisplay = path.relative(ROOT, target).split(path.sep).join('/');

const nameMatch = path.basename(target).match(/^TC-([A-Z]+)-(\d{3})\.md$/);
if (!nameMatch) {
  problems.push(`file name must be TC-{ROLE}-{NNN}.md (ROLE = OP, RV or SYS; NNN = three digits), got "${path.basename(target)}"`);
}
if (rel.split(path.sep).length !== 2) {
  problems.push('path must be test-cases/{module}/TC-{ROLE}-{NNN}.md (exactly one module folder)');
}
const id = nameMatch ? `TC-${nameMatch[1]}-${nameMatch[2]}` : null;
if (nameMatch && !['OP', 'RV', 'SYS'].includes(nameMatch[1])) problems.push(`ROLE must be OP, RV or SYS, got ${nameMatch[1]}`);

const field = (name) => {
  const m = content.match(new RegExp(`^- \\*\\*${name}:\\*\\*[ \\t]*(.*?)[ \\t]*$`, 'm'));
  return m ? m[1] : null;
};

const heading = content.match(/^# (TC-[A-Z]+-\d{3}): (.+)$/m);
if (!heading) problems.push('first heading must be "# TC-{ROLE}-{NNN}: {Title}"');
else if (id && heading[1] !== id) problems.push(`heading ID ${heading[1]} does not match file name ${id}`);

for (const name of ['ID', 'Title', 'Module', 'Type', 'Layer', 'Priority', 'Requirement', 'Status', 'Execution Result']) {
  const v = field(name);
  if (v === null || v === '') problems.push(`missing or empty field "- **${name}:**"`);
  else if (/\{(ROLE|NNN|Title|module|Positive|file|preconditions|steps|test data|expected result|open questions)\b[^}]*\}/i.test(v)) problems.push(`field "${name}" still contains a {placeholder}: ${v}`);
}

const id2 = field('ID');
if (id2 && id && id2 !== id) problems.push(`field ID "${id2}" does not match file name ${id}`);
const title = field('Title');
if (title && heading && title !== heading[2]) problems.push('field Title must equal the heading title');
const module_ = field('Module');
if (module_ && rel.split(path.sep)[0] !== module_) problems.push(`field Module "${module_}" must equal the folder name "${rel.split(path.sep)[0]}"`);

const enums = {
  Type: ['Positive', 'Negative'],
  Layer: ['UI', 'API', 'DB'],
  Priority: ['High', 'Medium', 'Low'],
};
for (const [name, allowed] of Object.entries(enums)) {
  const v = field(name);
  if (v && !allowed.includes(v)) problems.push(`field ${name} must be one of ${allowed.join(' | ')}, got "${v}"`);
}
if (field('Status') && field('Status') !== 'Draft') problems.push('field Status must be "Draft" on creation');
if (field('Execution Result') && field('Execution Result') !== 'Not Run') problems.push('field Execution Result must be "Not Run" on creation');

// Cases for a business rule (gates) must carry the three fields the coverage script matches on.
const hasRuleFields = ['Gate', 'Rule reference', 'Rule condition'].some((n) => field(n) !== null);
if ((nameMatch && nameMatch[1] === 'SYS') || hasRuleFields) {
  for (const name of ['Gate', 'Rule reference', 'Rule condition']) {
    const v = field(name);
    if (!v) problems.push(`rule case needs a non-empty field "- **${name}:**"`);
  }
  const gate = field('Gate');
  if (gate && !GATES.includes(gate)) problems.push(`field Gate must be one of ${GATES.join(' | ')}, got "${gate}"`);
}

// Required sections, in this order.
const sections = ['Preconditions', 'Test Data', 'Steps', 'Expected Result', 'Open Questions'];
let last = -1;
for (const s of sections) {
  const m = content.match(new RegExp(`^## ${s}\\s*$`, 'm'));
  if (!m) { problems.push(`missing section "## ${s}"`); continue; }
  if (m.index < last) problems.push(`section "## ${s}" is out of order (expected: ${sections.join(', ')})`);
  last = m.index;
  const body = content.slice(m.index + m[0].length).split(/^## /m)[0].trim();
  if (!body) problems.push(`section "## ${s}" is empty (write "None" for Open Questions if there are none)`);
}

// Atomic: one action in Steps is a content judgement, but a numbered list of 4+ steps is a clear smell.
const stepsAt = content.search(/^## Steps\s*$/m);
const stepsBody = stepsAt < 0 ? '' : content.slice(stepsAt + 8).split(/^## /m)[0];
const stepCount = (stepsBody.match(/^\s*\d+\.\s/gm) || []).length;
if (stepCount > 3) problems.push(`Steps has ${stepCount} numbered items; a case is atomic (one action under test, setup goes to Preconditions)`);

if (problems.length > 0) {
  process.stderr.write(`Test case format check failed for ${relDisplay}:\n${problems.map((p) => `- ${p}`).join('\n')}\nFix these and write the file again. Template: .claude/skills/test-case-creator/templates/test-case.md\n`);
  process.exit(2);
}
process.exit(0);
