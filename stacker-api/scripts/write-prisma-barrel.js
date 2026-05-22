const fs = require('fs');
const path = require('path');

const barrel = `export * from './client';
export * from './enums';
export * from './models';
export * from './commonInputTypes';
`;

const outPath = path.join(__dirname, '../src/generated/prisma/index.ts');
fs.writeFileSync(outPath, barrel);
console.log('Wrote', outPath);
