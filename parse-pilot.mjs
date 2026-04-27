import { readFileSync, writeFileSync } from 'fs';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function formatDate(iso) {
  const [y, m, d] = iso.split('-');
  return `${MONTHS[parseInt(m, 10) - 1]} ${parseInt(d, 10)}, ${y}`;
}

function deriveTitle(questions) {
  const first = questions[0]?.q ?? '';
  if (/student trade review/i.test(first)) return 'Student Trade Review';
  if (/chart review/i.test(first)) return 'Chart Review';
  if (/mindset|journal|losing streak|psychology/i.test(first)) return 'Mindset & Risk';
  if (/pre-market playbook|pre-market/i.test(first)) return 'Pre-Market Playbook';
  return 'Coaching Session';
}

const src = readFileSync('C:/Users/dhaye/repos/open-trader-coach-v2/pilot.md', 'utf8');
const lines = src.split('\n');

const sessions = [];
let current = null;

for (const raw of lines) {
  const line = raw.trim();

  // Session header: ## MM-DD-YYYY
  const headerMatch = line.match(/^##\s+(\d{2})-(\d{2})-(\d{4})$/);
  if (headerMatch) {
    if (current) sessions.push(current);
    const iso = `${headerMatch[3]}-${headerMatch[1]}-${headerMatch[2]}`;
    current = { iso, date: formatDate(iso), questions: [] };
    continue;
  }

  // Question line: - HH:MM - question text
  const qMatch = line.match(/^-\s+(\d{1,2}:\d{2})\s+-\s+(.+)$/);
  if (qMatch && current) {
    // Append continuation lines that aren't new questions
    current.questions.push({ t: qMatch[1], q: qMatch[2].trim(), asker: '' });
    continue;
  }

  // Continuation of previous question (non-empty, no special prefix)
  if (line && current && current.questions.length > 0 && !line.startsWith('#') && !line.startsWith('-')) {
    const last = current.questions[current.questions.length - 1];
    last.q += ' ' + line;
  }
}
if (current) sessions.push(current);

// Derive title for each session
for (const s of sessions) {
  s.title = deriveTitle(s.questions);
}

// Sort newest first (already in that order in the file, but ensure)
sessions.sort((a, b) => b.iso.localeCompare(a.iso));

const js = `export const SESSIONS = ${JSON.stringify(sessions, null, 2)};\n`;
writeFileSync('C:/Users/dhaye/repos/open-trader-coach-v2/src/data.js', js, 'utf8');

console.log(`Written ${sessions.length} sessions, ${sessions.reduce((n, s) => n + s.questions.length, 0)} questions.`);
