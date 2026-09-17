const fs = require('fs');
const path = require('path');
const raw = fs.readFileSync(0, 'utf8');
const data = JSON.parse(raw);
for (const [file, content] of Object.entries(data)) {
  const dir = path.dirname(file);
  if (dir && !fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(file, content, 'utf8');
  console.log('Saved:', file);
}
