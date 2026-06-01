const fs = require('fs');

const filename = process.argv[2] || 'network.har';
const har = JSON.parse(fs.readFileSync(filename, 'utf8'));
const entries = har.log.entries;

const exts = /\.(glb|gltf|webp|png)(\?|$)/i;
const urls = entries
  .map(e => e.request.url)
  .filter(url => exts.test(url));

fs.writeFileSync('extracted_urls.txt', urls.join('\n'));
console.log(`Found ${urls.length} URLs. Written to extracted_urls.txt`);
