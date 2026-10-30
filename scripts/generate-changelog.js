#!/usr/bin/env node
/**
 * Generate changelog from git history
 * Outputs: public/changelog.json
 */

import { execSync } from 'child_process';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = `${__dirname}/..`;
const OUTPUT_DIR = `${PROJECT_ROOT}/public`;
const OUTPUT_FILE = `${OUTPUT_DIR}/changelog.json`;

// Conventional commit types
const TYPE_MAP = {
  feat: 'feat',
  feature: 'feat',
  fix: 'fix',
  bugfix: 'fix',
  chore: 'chore',
  docs: 'docs',
  doc: 'docs',
  refactor: 'refactor',
  refact: 'refactor',
  style: 'style',
  test: 'test',
  perf: 'perf',
  ci: 'ci',
  build: 'build',
  revert: 'revert',
};

// CI hosts (Cloudflare, among others) often clone with depth=1, which would reduce the
// changelog to a single commit. Fetch the full history first when that is the case.
function ensureFullHistory() {
  try {
    const shallow = execSync('git rev-parse --is-shallow-repository', { cwd: PROJECT_ROOT, encoding: 'utf-8' }).trim();
    if (shallow === 'true') {
      console.log('  Shallow clone detected, fetching full history...');
      execSync('git fetch --unshallow --quiet', { cwd: PROJECT_ROOT, stdio: 'inherit' });
    }
  } catch (e) {
    console.warn('  Could not fetch full git history:', e.message);
  }
}

function getCommits() {
  ensureFullHistory();
  try {
    // Get git log with format: hash|subject|date|author
    const log = execSync(
      'git log --pretty=format:"%h|%s|%ad|%an" --date=short --no-merges',
      { cwd: PROJECT_ROOT, encoding: 'utf-8', maxBuffer: 1024 * 1024 }
    ).trim();

    if (!log) return [];

    return log.split('\n').map(line => {
      const [hash, subject, date, author] = line.split('|');
      return { hash, subject, date, author };
    });
  } catch (e) {
    console.warn('Failed to get git log:', e.message);
    return [];
  }
}

function parseCommitSubject(subject) {
  // Parse conventional commit: type(scope): description
  const match = subject.match(/^(\w+)(?:\(([^)]+)\))?[!:]\s*(.+)$/);
  if (match) {
    const [, type, scope, description] = match;
    return {
      type: TYPE_MAP[type.toLowerCase()] || 'chore',
      scope: scope || null,
      description: description.trim(),
    };
  }
  // Fallback: infer type from keywords
  const lower = subject.toLowerCase();
  if (lower.startsWith('add') || lower.startsWith('create') || lower.startsWith('implement')) return { type: 'feat', scope: null, description: subject };
  if (lower.startsWith('fix') || lower.startsWith('resolve') || lower.startsWith('bug')) return { type: 'fix', scope: null, description: subject };
  if (lower.startsWith('update') || lower.startsWith('improve') || lower.startsWith('enhance')) return { type: 'feat', scope: null, description: subject };
  if (lower.startsWith('remove') || lower.startsWith('delete')) return { type: 'chore', scope: null, description: subject };
  if (lower.startsWith('refactor')) return { type: 'refactor', scope: null, description: subject };
  if (lower.startsWith('doc')) return { type: 'docs', scope: null, description: subject };
  if (lower.startsWith('test')) return { type: 'test', scope: null, description: subject };
  if (lower.startsWith('chore') || lower.startsWith('config') || lower.startsWith('setup')) return { type: 'chore', scope: null, description: subject };
  return { type: 'chore', scope: null, description: subject };
}

function groupByVersion(commits) {
  // Simple version grouping: group by date (YYYY-MM)
  // In a real project, you'd use git tags for versioning
  const groups = {};
  
  for (const commit of commits) {
    const monthKey = commit.date.slice(0, 7); // YYYY-MM
    if (!groups[monthKey]) {
      groups[monthKey] = {
        version: `v${monthKey.replace('-', '.')}`, // v2026.09
        date: commit.date,
        type: 'feat',
        changes: [],
      };
    }
    const parsed = parseCommitSubject(commit.subject);
    groups[monthKey].changes.push({
      type: parsed.type,
      scope: parsed.scope,
      description: parsed.description,
      hash: commit.hash,
      author: commit.author,
    });
    // Update version type to highest priority in group
    const types = groups[monthKey].changes.map(c => c.type);
    if (types.includes('feat')) groups[monthKey].type = 'feat';
    else if (types.includes('fix')) groups[monthKey].type = 'fix';
    else if (types.includes('refactor')) groups[monthKey].type = 'refactor';
    else if (types.includes('docs')) groups[monthKey].type = 'docs';
    else groups[monthKey].type = 'chore';
  }

  // Sort by date descending (newest first)
  return Object.values(groups).sort((a, b) => b.date.localeCompare(a.date));
}

function formatForChangelogPage(groups) {
  return groups.map(group => ({
    version: group.version,
    date: group.date,
    type: group.type,
    changes: group.changes.map(c => 
      `${c.scope ? `(${c.scope}) ` : ''}${c.description}` + 
      (c.hash ? ` [${c.hash}]` : '')
    ),
  }));
}

function main() {
  console.log('📋 Generating changelog from git history...');
  
  const commits = getCommits();
  console.log(`  Found ${commits.length} commits`);

  // No git history (e.g. build without .git): keep the committed changelog instead of overwriting it with nothing
  if (commits.length === 0 && existsSync(OUTPUT_FILE)) {
    console.warn('  No git history available, keeping existing changelog.json');
    return;
  }

  const groups = groupByVersion(commits);
  console.log(`  Grouped into ${groups.length} versions`);

  const changelog = formatForChangelogPage(groups);

  // Ensure output directory exists
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Write JSON
  writeFileSync(OUTPUT_FILE, JSON.stringify(changelog, null, 2));
  console.log(`✅ Changelog written to ${OUTPUT_FILE}`);

  // Also create a human-readable markdown version
  const mdFile = `${PROJECT_ROOT}/CHANGELOG.md`;
  let md = '# Changelog\n\n';
  md += 'All notable changes to Hades KB.\n\n';
  
  for (const group of groups) {
    md += `## ${group.version} (${group.date})\n\n`;
    for (const change of group.changes) {
      const typeEmoji = {
        feat: '✨',
        fix: '🐛',
        docs: '📝',
        refactor: '♻️',
        chore: '🔧',
        style: '💄',
        test: '✅',
        perf: '⚡',
        ci: '🔧',
        build: '📦',
      }[change.type] || '📌';
      md += `- ${typeEmoji} ${change.scope ? `(${change.scope}) ` : ''}${change.description} [${change.hash}]\n`;
    }
    md += '\n';
  }
  
  writeFileSync(mdFile, md);
  console.log(`✅ Markdown changelog written to ${mdFile}`);
}

main();