const fs = require('fs');

const orig = JSON.parse(fs.readFileSync('d:/Github/keyboards/release/sil/sil_akebu/source/sil_akebu.keyman-touch-layout', 'utf-8'));
const rt = JSON.parse(fs.readFileSync('d:/Github/keyboards/release-rt/sil/sil_akebu/source/sil_akebu.keyman-touch-layout', 'utf-8'));

// Normalize and compare
function normalizeKey(key) {
  const normalized = {...key};
  delete normalized.font; // Font is not preserved in LDML
  return JSON.stringify(normalized, Object.keys(normalized).sort());
}

function compareKeys(origKey, rtKey, path) {
  const origNorm = normalizeKey(origKey);
  const rtNorm = normalizeKey(rtKey);

  if (origNorm !== rtNorm) {
    console.log(`Difference at ${path}:`);
    console.log('  Original:', JSON.stringify(origKey));
    console.log('  Round-trip:', JSON.stringify(rtKey));
    return false;
  }
  return true;
}

let differences = 0;
let total = 0;

// Compare all keys
orig.tablet.layer.forEach((layer, li) => {
  const rtLayer = rt.tablet.layer[li];
  layer.row.forEach((row, ri) => {
    const rtRow = rtLayer.row[ri];
    row.key.forEach((key, ki) => {
      total++;
      const rtKey = rtRow.key[ki];
      const path = `layer[${li}](${layer.id}).row[${ri}].key[${ki}](${key.id})`;
      if (!compareKeys(key, rtKey, path)) {
        differences++;
      }
    });
  });
});

console.log(`\nTotal keys compared: ${total}`);
console.log(`Keys with differences: ${differences}`);
console.log(`Keys matching: ${total - differences}`);
console.log(`Match rate: ${((total - differences) / total * 100).toFixed(1)}%`);
