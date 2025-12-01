const fs = require('fs');

const orig = JSON.parse(fs.readFileSync('d:/Github/keyboards/release-ldml/sil/sil_akebu/source/sil_akebu.keyman-touch-layout', 'utf-8'));
const rt = JSON.parse(fs.readFileSync('d:/Github/keyboards/release-rt/sil/sil_akebu/source/sil_akebu.keyman-touch-layout', 'utf-8'));

// Collect all keys with width from original
const origWidthKeys = new Map();
orig.tablet.layer.forEach((layer, li) => {
  layer.row.forEach((row, ri) => {
    row.key.forEach((key, ki) => {
      if (key.width) {
        const path = `layer[${li}](${layer.id}).row[${ri}].key[${ki}](${key.id})`;
        origWidthKeys.set(path, key.width);
      }
    });
  });
});

// Collect all keys with width from round-trip
const rtWidthKeys = new Map();
rt.tablet.layer.forEach((layer, li) => {
  layer.row.forEach((row, ri) => {
    row.key.forEach((key, ki) => {
      if (key.width) {
        const path = `layer[${li}](${layer.id}).row[${ri}].key[${ki}](${key.id})`;
        rtWidthKeys.set(path, key.width);
      }
    });
  });
});

console.log('Keys with width in ORIGINAL but missing in ROUND-TRIP:');
origWidthKeys.forEach((width, path) => {
  if (!rtWidthKeys.has(path)) {
    console.log(`  ${path}: width=${width}`);
  }
});

console.log('\nKeys with different width values:');
origWidthKeys.forEach((origWidth, path) => {
  const rtWidth = rtWidthKeys.get(path);
  if (rtWidth && rtWidth !== origWidth) {
    console.log(`  ${path}: orig=${origWidth}, rt=${rtWidth}`);
  }
});
