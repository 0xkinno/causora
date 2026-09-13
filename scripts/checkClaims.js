const fs = require('fs');
const path = require('path');

console.log('=== CHECKING NUMERIC REPOSITORY CLAIMS ===');

// 1. Authoritative Attack Count
const attacksDir = path.resolve(__dirname, '..', 'tests', 'attacks');
const attackFiles = fs.readdirSync(attacksDir).filter(f => f.endsWith('.test.ts') || f.endsWith('.test.js'));
const authoritativeAttackCount = attackFiles.length;
console.log(`Authoritative Attack Count: ${authoritativeAttackCount}`);

// 2. Authoritative Total Test Count
function getTestFiles(dir) {
  let res = [];
  fs.readdirSync(dir).forEach(f => {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) res = res.concat(getTestFiles(p));
    else if (f.endsWith('.test.ts') || f.endsWith('.test.js')) res.push(p);
  });
  return res;
}
const allTestFiles = getTestFiles(path.resolve(__dirname, '..', 'tests'));
let authoritativeTestCount = 0;
allTestFiles.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const matches = content.match(/(^|\s)(it|test)\s*\(/g);
  if (matches) authoritativeTestCount += matches.length;
});
console.log(`Authoritative Total Test Count: ${authoritativeTestCount}`);

// 3. Scan README.md and docs/*.md
let errors = [];

function checkMarkdownFile(filePath) {
  const relPath = path.relative(path.resolve(__dirname, '..'), filePath);
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;

    // Check for stale '18' attack mentions
    if (line.match(/\b18\b.*attack/i) || line.match(/attack.*\b18\b/i) || line.includes('18-Vector') || line.includes('Attacks-18')) {
      errors.push(`${relPath}:${lineNum} contains stale 18-attack claim: "${line.trim()}"`);
    }

    // Check for stale '44' test mentions
    if (line.includes('44 Passing') || line.includes('44/44')) {
      errors.push(`${relPath}:${lineNum} contains stale 44-test claim: "${line.trim()}"`);
    }

    // Check badge claims in README
    if (relPath === 'README.md') {
      const testBadgeMatch = line.match(/Tests-(\d+)(?:%2F\d+)?%20Passing/);
      if (testBadgeMatch) {
        const found = parseInt(testBadgeMatch[1], 10);
        if (found !== authoritativeTestCount) {
          errors.push(`README.md:${lineNum} Tests Passing badge says ${found}, expected ${authoritativeTestCount}`);
        }
      }

      const attackBadgeMatch = line.match(/Attacks-(\d+)%2F(\d+)%20Neutralized/);
      if (attackBadgeMatch) {
        const foundNum = parseInt(attackBadgeMatch[1], 10);
        const foundDen = parseInt(attackBadgeMatch[2], 10);
        if (foundNum !== authoritativeAttackCount || foundDen !== authoritativeAttackCount) {
          errors.push(`README.md:${lineNum} Attacks badge says ${foundNum}/${foundDen}, expected ${authoritativeAttackCount}/${authoritativeAttackCount}`);
        }
      }
    }
  });
}

const rootReadme = path.resolve(__dirname, '..', 'README.md');
if (fs.existsSync(rootReadme)) checkMarkdownFile(rootReadme);

const docsDir = path.resolve(__dirname, '..', 'docs');
function scanDocs(dir) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(f => {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) scanDocs(p);
    else if (f.endsWith('.md')) checkMarkdownFile(p);
  });
}
scanDocs(docsDir);

if (errors.length > 0) {
  console.error('\n❌ CLAIMS CHECK FAILED with discrepancies:');
  errors.forEach(e => console.error(`  - ${e}`));
  process.exit(1);
}

console.log('\n✓ ALL NUMERIC CLAIMS MATCH GROUND TRUTH PERFECTLY (0 discrepancies)\n');
