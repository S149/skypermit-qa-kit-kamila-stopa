#!/usr/bin/env node
// SessionEnd hook: summarizes token usage and API-equivalent cost of the session
// (main thread + subagents + compacts) into reports/ws2/<date>-<session_id>.md.
//
// stdin (SessionEnd): { session_id, transcript_path, cwd, hook_event_name, reason }
// Transcript structure was verified against real transcripts (Claude Code 2.1.306):
//   - assistant lines carry message.id, message.model, message.usage; the same
//     message.id can repeat on several lines, so usage is counted once per id;
//   - model "<synthetic>" lines have zero usage and are skipped;
//   - subagents live in <session_id>/subagents/agent-<id>.jsonl (+ .meta.json);
//   - a compact is a {type:"system", subtype:"compact_boundary", compactMetadata}
//     line; the summarizing API call itself is NOT recorded, so its cost is only
//     estimated from compactMetadata.preTokens and never added to the total.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HOOK_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HOOK_DIR, '..', '..');
const OUT_DIR = path.join(ROOT, 'reports', 'ws2');
const PRICING = JSON.parse(fs.readFileSync(path.join(HOOK_DIR, 'pricing.json'), 'utf8')).models;

const warnings = [];
const warn = (msg) => { if (!warnings.includes(msg)) warnings.push(msg); };

function readStdin() {
  try {
    return JSON.parse(fs.readFileSync(0, 'utf8'));
  } catch (err) {
    throw new Error(`cannot read hook input from stdin: ${err.message}`);
  }
}

function readJsonl(file) {
  const out = [];
  let bad = 0;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    try { out.push(JSON.parse(line)); } catch { bad++; }
  }
  if (bad) warn(`${bad} unparsable line(s) skipped in ${path.basename(file)}`);
  return out;
}

const normalizeModel = (m) => String(m).replace(/-\d{8}$/, '');

function priceFor(model, promptTokens) {
  const p = PRICING[normalizeModel(model)];
  if (!p) return null;
  const lc = p.long_context;
  return lc && promptTokens > lc.threshold_tokens ? lc : p;
}

function messageCost(model, u) {
  const input = u.input_tokens ?? 0;
  const output = u.output_tokens ?? 0;
  const cacheRead = u.cache_read_input_tokens ?? 0;
  const cacheTotal = u.cache_creation_input_tokens ?? 0;
  let w5;
  let w1;
  if (u.cache_creation) {
    w5 = u.cache_creation.ephemeral_5m_input_tokens ?? 0;
    w1 = u.cache_creation.ephemeral_1h_input_tokens ?? 0;
    if (w5 + w1 !== cacheTotal) warn('cache_creation 5m+1h does not add up to cache_creation_input_tokens in some messages');
  } else {
    w5 = cacheTotal;
    w1 = 0;
    if (cacheTotal) warn('some messages have no cache_creation TTL breakdown; cache writes priced as 5m');
  }
  const p = priceFor(model, input + cacheRead + cacheTotal);
  const cost = p === null ? null
    : (input * p.input + output * p.output + cacheRead * p.cache_read
      + w5 * p.cache_write_5m + w1 * p.cache_write_1h) / 1e6;
  return { input, output, cacheRead, w5, w1, cost };
}

const emptyTotals = () => ({ messages: 0, input: 0, output: 0, cacheRead: 0, w5: 0, w1: 0, cost: 0, unpriced: 0 });

function addTo(totals, m) {
  totals.messages++;
  totals.input += m.input;
  totals.output += m.output;
  totals.cacheRead += m.cacheRead;
  totals.w5 += m.w5;
  totals.w1 += m.w1;
  if (m.cost === null) totals.unpriced++; else totals.cost += m.cost;
}

// Text of a real user prompt (not a tool_result carrier), cleaned for a one-line preview.
function promptText(rec) {
  if (rec.type !== 'user' || rec.isMeta || rec.isCompactSummary) return null;
  const c = rec.message?.content;
  const text = typeof c === 'string' ? c
    : Array.isArray(c) ? c.filter((b) => b?.type === 'text').map((b) => b.text).join(' ') : '';
  const clean = text.replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return clean || null;
}

// Adds every not-yet-seen assistant message of `records` to the per-model and
// per-source totals; collects compact boundaries.
function collect(records, source, state) {
  const sourceTotals = state.bySource.get(source.key) ?? { ...source, totals: emptyTotals(), models: new Set() };
  state.bySource.set(source.key, sourceTotals);
  // The same message.id is streamed over several lines and output_tokens grows
  // (e.g. 3 -> 342); the line with the largest output_tokens is the final usage.
  // Lines of a message without stop_reason anywhere are a mid-stream snapshot
  // (async subagent transcripts end like this): their output_tokens is incomplete.
  const finalUsage = new Map();
  const stopped = new Set();
  const visibleChars = new Map();
  let lastId = null;
  for (const rec of records) {
    const msg = rec.type === 'assistant' ? rec.message : null;
    if (!msg?.usage || !msg.id) continue;
    lastId = msg.id;
    if (msg.stop_reason) stopped.add(msg.id);
    const prev = finalUsage.get(msg.id);
    if (!prev || (msg.usage.output_tokens ?? 0) > (prev.output_tokens ?? 0)) finalUsage.set(msg.id, msg.usage);
    if (Array.isArray(msg.content)) {
      for (const b of msg.content) {
        const size = b?.type === 'text' ? String(b.text ?? '').length
          : b?.type === 'tool_use' ? JSON.stringify(b.input ?? {}).length + String(b.name ?? '').length : 0;
        visibleChars.set(`${msg.id}|${b?.id ?? b?.text?.slice(0, 40) ?? Math.random()}`, size);
      }
    }
  }
  if (source.key !== 'main' && lastId && !stopped.has(lastId)) state.finalMissing++;
  let prompt = null;
  for (const rec of records) {
    const pt = promptText(rec);
    if (pt) prompt = pt;
    if (rec.timestamp) {
      state.firstTs = !state.firstTs || rec.timestamp < state.firstTs ? rec.timestamp : state.firstTs;
      state.lastTs = !state.lastTs || rec.timestamp > state.lastTs ? rec.timestamp : state.lastTs;
    }
    if (rec.type === 'cost-state' && rec.modelUsage && typeof rec.modelUsage === 'object') state.reported = rec;
    if (rec.type === 'system' && rec.subtype === 'compact_boundary' && rec.compactMetadata) {
      const c = rec.compactMetadata;
      state.compacts.push({
        source: source.label,
        timestamp: rec.timestamp,
        trigger: c.trigger,
        pre: c.preTokens,
        post: c.postTokens,
        durationMs: c.durationMs,
      });
    }
    const msg = rec.type === 'assistant' ? rec.message : null;
    if (!msg?.usage) continue;
    if (msg.model === '<synthetic>') { state.synthetic++; continue; }
    const id = msg.id ?? rec.uuid;
    if (id) {
      if (state.seen.has(id)) { state.duplicates++; continue; }
      state.seen.add(id);
    }
    const model = normalizeModel(msg.model ?? 'unknown');
    const m = messageCost(model, finalUsage.get(msg.id) ?? msg.usage);
    if (m.cost === null) warn(`no price for model "${model}" - its tokens are listed but excluded from the cost total`);
    if (msg.usage.speed === 'fast') warn('fast-mode messages were priced at standard rates (real API-equivalent cost is higher)');
    if (msg.usage.inference_geo && msg.usage.inference_geo !== 'global' && msg.usage.inference_geo !== 'not_available') {
      warn(`messages with inference_geo="${msg.usage.inference_geo}" were priced at standard rates (US-only routing has a 1.1x multiplier)`);
    }
    if (!state.byModel.has(model)) state.byModel.set(model, emptyTotals());
    addTo(state.byModel.get(model), m);
    if (msg.id && !stopped.has(msg.id)) {
      let chars = 0;
      for (const [k, v] of visibleChars) if (k.startsWith(`${msg.id}|`)) chars += v;
      const short = Math.max(0, Math.round(chars / 3.2) - m.output);
      const p = priceFor(model, 0);
      state.partial.messages++;
      state.partial.tokens += short;
      if (p) state.partial.cost += (short * p.output) / 1e6;
    }
    if (m.cost !== null) state.requests.push({ cost: m.cost, model, source: source.label, ts: rec.timestamp, prompt });
    addTo(sourceTotals.totals, m);
    sourceTotals.models.add(model);
  }
}

const n = (x) => x.toLocaleString('en-US');
const usd = (x) => `$${x.toFixed(4)}`;
const cell = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');

function totalRow(label, t) {
  return `| ${label} | ${n(t.messages)} | ${n(t.input)} | ${n(t.output)} | ${n(t.cacheRead)} | ${n(t.w5)} | ${n(t.w1)} | ${t.unpriced && t.unpriced === t.messages ? 'price unknown' : `${usd(t.cost)}${t.unpriced ? ` (+${t.unpriced} price unknown)` : ''}`} |`;
}

const USAGE_HEADER = [
  '| Messages | Input | Output | Cache read | Cache write 5m | Cache write 1h | Cost |',
  '| ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
];

function localDate(ts) {
  const d = ts ? new Date(ts) : new Date();
  return d.toLocaleDateString('sv-SE'); // YYYY-MM-DD in local time
}

// Per-model usage as counted by Claude Code itself (cost-state record), with our
// own price for the same tokens so the two dollar figures can be compared.
// cost-state has no 5m/1h split of cache writes: the transcript's share of 1h
// writes for that model is used, 5m when the transcript has none.
function counterRows(state) {
  const mu = state.reported?.modelUsage;
  if (!mu) return null;
  const num = (x) => (Number.isFinite(Number(x)) ? Number(x) : 0);
  return Object.entries(mu).map(([raw, u]) => {
    const model = normalizeModel(raw);
    const r = {
      model, input: num(u?.inputTokens), output: num(u?.outputTokens), thinking: num(u?.thinkingTokens),
      cacheRead: num(u?.cacheReadInputTokens), cacheWrite: num(u?.cacheCreationInputTokens), counter: num(u?.costUSD), ours: null,
    };
    const p = PRICING[model];
    if (p) {
      const t = state.byModel.get(model);
      const w = t ? t.w5 + t.w1 : 0;
      const w1 = w ? t.w1 / w : 0;
      r.ours = (r.input * p.input + r.output * p.output + r.cacheRead * p.cache_read
        + r.cacheWrite * (w1 * p.cache_write_1h + (1 - w1) * p.cache_write_5m)) / 1e6;
      if (p.long_context) r.longContext = true;
    }
    return r;
  });
}

function render({ input, state, subagents }) {
  const grand = emptyTotals();
  for (const t of state.byModel.values()) {
    for (const k of Object.keys(grand)) grand[k] += t[k];
  }
  const lines = [];
  lines.push(`# Session usage report: ${input.session_id}`, '');
  lines.push('> Cost is the **API-equivalent at list prices** (see `.claude/hooks/pricing.json`), not an actual bill. It is not what a subscription plan charges.', '');
  lines.push('| Field | Value |', '| --- | --- |');
  lines.push(`| Session ID | ${input.session_id} |`);
  lines.push(`| End reason | ${cell(input.reason ?? 'unknown')} |`);
  lines.push(`| First message | ${state.firstTs ?? 'n/a'} |`);
  lines.push(`| Last message | ${state.lastTs ?? 'n/a'} |`);
  lines.push(`| Transcript | ${cell(input.transcript_path)} |`);
  lines.push(`| Subagent transcripts | ${subagents} |`);
  lines.push(`| Generated | ${new Date().toISOString()} |`, '');

  const cRows = counterRows(state);
  const cTotal = cRows ? (Number.isFinite(state.reported.totalCostUSD) ? state.reported.totalCostUSD : cRows.reduce((s, r) => s + r.counter, 0)) : null;
  lines.push('## Total', '');
  if (cRows) {
    lines.push(`**${usd(cTotal)}** - Claude Code's own cost counter. It is the real session cost: it includes calls that never reach the transcript (see "Reconciliation").`, '');
    lines.push(`Transcript-derived (lower bound): **${usd(grand.cost)}** across ${n(grand.messages)} API messages (main thread + subagents). Compact estimates are not included.`, '');
  } else {
    lines.push(`**${usd(grand.cost)}** across ${n(grand.messages)} API messages (main thread + subagents). Compact estimates are not included. No cost-state record found, so this is a lower bound.`, '');
  }

  if (cRows) {
    const sum = { input: 0, output: 0, thinking: 0, cacheRead: 0, cacheWrite: 0, counter: 0 };
    lines.push('## Usage by model (Claude Code counter)', '', '| Model | Requests (transcript) | Input | Output | of which thinking | Cache read | Cache write | Cost |', '| :-- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |');
    for (const r of cRows) {
      for (const k of Object.keys(sum)) sum[k] += r[k];
      lines.push(`| ${r.model} | ${n(state.byModel.get(r.model)?.messages ?? 0)} | ${n(r.input)} | ${n(r.output)} | ${n(r.thinking)} | ${n(r.cacheRead)} | ${n(r.cacheWrite)} | ${usd(r.counter)} |`);
    }
    lines.push(`| **Total** | ${n(grand.messages)} | ${n(sum.input)} | ${n(sum.output)} | ${n(sum.thinking)} | ${n(sum.cacheRead)} | ${n(sum.cacheWrite)} | ${usd(sum.counter)} |`, '');
    lines.push('Token counts and cost come from the counter, which has no split of cache writes by TTL. Requests come from the transcript (the counter does not count them).', '');

    lines.push('## Price check (counter $ vs pricing.json)', '', '| Model | Counter $ | Our price | Difference | Result |', '| :-- | ---: | ---: | ---: | :-- |');
    for (const r of cRows) {
      if (r.ours === null) { lines.push(`| ${r.model} | ${usd(r.counter)} | price unknown | n/a | n/a |`); continue; }
      const d = r.ours - r.counter;
      const ok = Math.abs(d) <= Math.max(0.00005, Math.abs(r.counter) * 0.005);
      lines.push(`| ${r.model} | ${usd(r.counter)} | ${usd(r.ours)} | ${d >= 0 ? '+' : '-'}${usd(Math.abs(d))} | ${ok ? 'OK (within 0.5%)' : 'MISMATCH - check pricing.json'} |`);
    }
    lines.push('', 'Tolerance: 0.5% or $0.00005. Our price uses the transcript share of 1h cache writes for that model (5m if the transcript has none)' + (cRows.some((r) => r.longContext) ? '; Haiku long-context pricing (per-request threshold) cannot be applied to aggregated totals, so a small mismatch for Haiku is expected' : '') + '.', '');
  }

  lines.push(cRows ? '## Usage by model (transcript, lower bound)' : '## Usage by model', '', `| Model ${USAGE_HEADER[0]}`, `| :-- ${USAGE_HEADER[1]}`);
  for (const [model, t] of [...state.byModel].sort((a, b) => b[1].cost - a[1].cost)) lines.push(totalRow(model, t));
  lines.push(totalRow('**Total**', grand), '');

  lines.push(cRows ? '## Cache share of input (Claude Code counter)' : '## Cache share of input', '', '| Model | Cache read | Cache write | Fresh input | Cache read share of input |', '| :-- | ---: | ---: | ---: | ---: |');
  const cacheRow = (label, t) => {
    const all = t.input + t.cacheRead + t.cacheWrite;
    return `| ${label} | ${n(t.cacheRead)} | ${n(t.cacheWrite)} | ${n(t.input)} | ${all ? ((t.cacheRead / all) * 100).toFixed(1) + '%' : 'n/a'} |`;
  };
  const cacheSrc = cRows ?? [...state.byModel].map(([model, t]) => ({ model, input: t.input, cacheRead: t.cacheRead, cacheWrite: t.w5 + t.w1 }));
  const cacheTot = { input: 0, cacheRead: 0, cacheWrite: 0 };
  for (const r of cacheSrc) {
    for (const k of Object.keys(cacheTot)) cacheTot[k] += r[k];
    lines.push(cacheRow(r.model, r));
  }
  lines.push(cacheRow('**Total**', cacheTot), '');

  lines.push('## Usage by source', '', `| Source ${USAGE_HEADER[0]}`, `| :-- ${USAGE_HEADER[1]}`);
  for (const s of state.bySource.values()) {
    if (!s.totals.messages) continue;
    lines.push(totalRow(`${cell(s.label)} (${[...s.models].join(', ')})`, s.totals));
  }
  const sub = emptyTotals();
  for (const s of state.bySource.values()) {
    if (s.key === 'main') continue;
    for (const k of Object.keys(sub)) sub[k] += s.totals[k];
  }
  lines.push(totalRow(`**Subagents total (${subagents})**`, sub), '');

  lines.push('## Top 3 most expensive requests', '');
  const top = [...state.requests].sort((a, b) => b.cost - a.cost).slice(0, 3);
  if (!top.length) {
    lines.push('No priced requests.', '');
  } else {
    lines.push('| # | Cost | Model | Source | Time | Prompt (first 80 chars) |', '| ---: | ---: | :-- | :-- | :-- | :-- |');
    top.forEach((r, i) => lines.push(`| ${i + 1} | ${usd(r.cost)} | ${r.model} | ${cell(r.source)} | ${r.ts ?? 'n/a'} | ${cell(r.prompt ? [...r.prompt].slice(0, 80).join('') : 'n/a')} |`));
    lines.push('', 'A request is one API message; its cost includes the whole cached context it re-read. The prompt is the last user prompt before it (for a subagent, the task it was given).', '');
  }

  lines.push('## Compacts', '');
  if (!state.compacts.length) {
    lines.push('No compact events found in the transcripts.', '');
  } else {
    lines.push('| Source | Time | Trigger | Tokens before | Tokens after | Duration (ms) | Estimated input cost |', '| :-- | :-- | :-- | ---: | ---: | ---: | ---: |');
    const mainModel = [...state.byModel].sort((a, b) => b[1].output - a[1].output)[0]?.[0];
    let estTotal = 0;
    for (const c of state.compacts) {
      const p = mainModel && c.pre ? priceFor(mainModel, c.pre) : null;
      const est = p ? (c.pre * p.input) / 1e6 : null;
      if (est !== null) estTotal += est;
      lines.push(`| ${cell(c.source)} | ${c.timestamp ?? 'n/a'} | ${cell(c.trigger)} | ${n(c.pre ?? 0)} | ${n(c.post ?? 0)} | ${n(c.durationMs ?? 0)} | ${est === null ? 'n/a' : usd(est)} |`);
    }
    lines.push('', `Estimated compact cost: **${usd(estTotal)}** (not included in the total above).`,
      `The summarizing API call is not recorded in the transcript, so this is only \`tokens before x input price\` of \`${mainModel ?? 'n/a'}\`: it ignores the summary output and any cache discount, and is a rough figure, not a measurement.`, '');
  }

  lines.push('## Reconciliation with Claude Code cost counter', '');
  const rep = state.reported;
  if (!rep) {
    lines.push('No cost-state record in the transcript, so calls missing from it (compact summaries, background Haiku calls) cannot be quantified.', '');
  } else {
    const gap = (rep.totalCostUSD ?? 0) - grand.cost;
    lines.push('| Model | Claude Code counter | Transcript | Not in transcript |', '| :-- | ---: | ---: | ---: |');
    for (const [model, u] of Object.entries(rep.modelUsage)) {
      const mine = state.byModel.get(normalizeModel(model))?.cost ?? 0;
      lines.push(`| ${model} | ${usd(u.costUSD ?? 0)} | ${usd(mine)} | ${usd((u.costUSD ?? 0) - mine)} |`);
    }
    lines.push(`| **Total** | ${usd(rep.totalCostUSD ?? 0)} | ${usd(grand.cost)} | ${usd(gap)} |`, '');
    lines.push(state.compacts.length
      ? `The compact summarizing call is not in the transcript; its real cost is **inside the "Not in transcript" figure** (${usd(gap)} in total), together with background Haiku calls and any messages written after the counter was saved. It cannot be separated further. The per-compact estimate above is only a rough hint.`
      : '"Not in transcript" = background calls (e.g. Haiku) and messages not yet flushed to the transcript.', '');
    lines.push('Known causes of "Not in transcript":');
    lines.push(`- Incomplete subagent usage (measured): ${n(state.partial.messages)} message(s) have no stop_reason, i.e. the transcript kept a mid-stream snapshot of usage; their output is under-counted by an estimated ~${n(state.partial.tokens)} tokens (~${usd(state.partial.cost)}, rough: visible text and tool input / 3.2 chars per token, thinking not counted).`);
    lines.push(`- Subagent final report missing (measured): ${n(state.finalMissing)} subagent transcript(s) end without an end_turn message, so their last request is not recorded at all.`);
    lines.push('- Not measurable from the transcript (probable): a server-side permission-classifier request is logged once per assistant message (serverClassifierRequest) but its tokens are not, and background Haiku calls (e.g. titles) are not recorded either.', '');
  }

  lines.push('## Notes', '');
  lines.push(`- Messages counted once per \`message.id\`; ${n(state.duplicates)} repeated transcript line(s) ignored, ${n(state.synthetic)} synthetic message(s) skipped.`);
  lines.push('- Pricing assumptions (pricing.json): cache write = 1.25x input for 5m TTL and 2x for 1h TTL, taken from the per-message cache_creation breakdown; cache read is the documented rate (0.1x input for Haiku 5.5 and 0.05x for Sonnet/Opus 5.5, not a flat 1/10).');
  lines.push('- The transcript is written asynchronously, so the last messages of the session may be missing.');
  for (const w of warnings) lines.push(`- WARNING: ${w}`);
  lines.push('');
  return lines.join('\n');
}

function main() {
  const input = readStdin();
  if (!input.session_id || !input.transcript_path) {
    throw new Error('stdin has no session_id / transcript_path');
  }
  const state = {
    byModel: new Map(), bySource: new Map(), compacts: [], requests: [], reported: null, finalMissing: 0, partial: { messages: 0, tokens: 0, cost: 0 }, seen: new Set(),
    duplicates: 0, synthetic: 0, firstTs: null, lastTs: null,
  };

  collect(readJsonl(input.transcript_path), { key: 'main', label: 'main thread' }, state);

  const subDir = path.join(input.transcript_path.replace(/\.jsonl$/, ''), 'subagents');
  let subagents = 0;
  if (fs.existsSync(subDir)) {
    for (const file of fs.readdirSync(subDir).filter((f) => /^agent-.+\.jsonl$/.test(f)).sort()) {
      const id = file.replace(/\.jsonl$/, '');
      let meta = {};
      try { meta = JSON.parse(fs.readFileSync(path.join(subDir, `${id}.meta.json`), 'utf8')); } catch { /* meta is optional */ }
      const label = `${meta.agentType ?? 'subagent'}: ${meta.description ?? id}`;
      collect(readJsonl(path.join(subDir, file)), { key: id, label }, state);
      subagents++;
    }
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const target = path.join(OUT_DIR, `${localDate(state.firstTs)}-${String(input.session_id).replace(/[^\w.-]/g, '_')}.md`);
  const tmp = `${target}.tmp`;
  fs.writeFileSync(tmp, render({ input, state, subagents }), 'utf8');
  fs.renameSync(tmp, target);
}

// SessionEnd hooks cannot block anything; never fail the session shutdown.
try {
  main();
} catch (err) {
  process.stderr.write(`usage-report: ${err.message}\n`);
}
