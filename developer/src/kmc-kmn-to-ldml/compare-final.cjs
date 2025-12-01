const fs = require('fs');

const orig = JSON.parse(fs.readFileSync('d:/Github/keyboards/release/sil/sil_akebu/source/sil_akebu.keyman-touch-layout', 'utf-8'));
const rt = JSON.parse(fs.readFileSync('d:/Github/keyboards/release-rt/sil/sil_akebu/source/sil_akebu.keyman-touch-layout', 'utf-8'));

// Normalize keys for comparison
function normalizeKey(key) {
  const normalized = {...key};

  // Remove attributes that are expected to be lost in LDML round-trip
  delete normalized.font; // Not supported in LDML
  delete normalized.layer; // Touch-layout specific, not in LDML (for regular keys)
  delete normalized.fontsize; // Not yet implemented
  delete normalized.text; // Display text not supported in LDML
  delete normalized.sp; // Special key type not supported in LDML

  // Remove sp from multitap and subkeys as well
  if (normalized.multitap) {
    normalized.multitap = normalized.multitap.map(mt => {
      const normMt = {...mt};
      delete normMt.sp;
      return normMt;
    });
  }

  if (normalized.sk) {
    normalized.sk = normalized.sk.map(sk => {
      const normSk = {...sk};
      delete normSk.sp;
      return normSk;
    });
  }

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

if (differences === 0) {
  console.log('\n✓ Perfect match! Only field order differs.');
}
