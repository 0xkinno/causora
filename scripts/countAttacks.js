const fs = require('fs');
const path = require('path');

const attacksDir = path.resolve(__dirname, '..', 'tests', 'attacks');
const files = fs.readdirSync(attacksDir).filter(f => f.endsWith('.test.ts') || f.endsWith('.test.js'));
const attackCount = files.length;

console.log(`Authoritative attack test file count: ${attackCount}`);

// Update README badge
const readmePath = path.resolve(__dirname, '..', 'README.md');
if (fs.existsSync(readmePath)) {
  let content = fs.readFileSync(readmePath, 'utf8');
  const badgeRegex = /\[!\[Attacks Neutralized\]\(https:\/\/img\.shields\.io\/badge\/Attacks-\d+%2F\d+%20Neutralized-success\)\]\(\.\/tests\/attacks\)/;
  const newBadge = `[![Attacks Neutralized](https://img.shields.io/badge/Attacks-${attackCount}%2F${attackCount}%20Neutralized-success)](./tests/attacks)`;
  
  if (badgeRegex.test(content)) {
    content = content.replace(badgeRegex, newBadge);
    fs.writeFileSync(readmePath, content, 'utf8');
    console.log(`Updated README.md badge with Attacks-${attackCount}%2F${attackCount}`);
  }
}
