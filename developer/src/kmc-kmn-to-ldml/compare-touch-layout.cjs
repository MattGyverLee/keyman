const fs = require('fs');

const orig = JSON.parse(fs.readFileSync('d:/Github/keyboards/release-ldml/sil/sil_akebu/source/sil_akebu.keyman-touch-layout', 'utf-8'));
const rt = JSON.parse(fs.readFileSync('d:/Github/keyboards/release-rt/sil/sil_akebu/source/sil_akebu.keyman-touch-layout', 'utf-8'));

// Check top-level properties
console.log('Original has font:', orig.tablet?.font || 'missing');
console.log('Round-trip has font:', rt.tablet?.font || 'missing');

console.log('\nOriginal layer count:', orig.tablet?.layer?.length || 0);
console.log('Round-trip layer count:', rt.tablet?.layer?.length || 0);

// Check for phone platform
console.log('\nOriginal has phone:', !!orig.phone);
console.log('Round-trip has phone:', !!rt.phone);

// Check for displayUnderlying
console.log('\nOriginal has displayUnderlying:', orig.displayUnderlying);
console.log('Round-trip has displayUnderlying:', rt.displayUnderlying);

// Sample a few keys to check field order vs content differences
const origFirstKey = orig.tablet.layer[0].row[0].key[0];
const rtFirstKey = rt.tablet.layer[0].row[0].key[0];

console.log('\nFirst key original:', JSON.stringify(origFirstKey));
console.log('First key round-trip:', JSON.stringify(rtFirstKey));

// Count total keys with width
let origWidthCount = 0;
let rtWidthCount = 0;
orig.tablet.layer.forEach(layer => {
  layer.row.forEach(row => {
    row.key.forEach(key => {
      if (key.width) origWidthCount++;
    });
  });
});
rt.tablet.layer.forEach(layer => {
  layer.row.forEach(row => {
    row.key.forEach(key => {
      if (key.width) rtWidthCount++;
    });
  });
});
console.log('\nKeys with width - original:', origWidthCount);
console.log('Keys with width - round-trip:', rtWidthCount);
