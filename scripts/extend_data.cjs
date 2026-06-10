#!/usr/bin/env node
// Extend time-series arrays in economicData.ts from 195 to 197 elements
const fs = require('fs');
const path = '/Users/wangqiuting/macro-dashboard/src/data/economicData.ts';
let content = fs.readFileSync(path, 'utf8');

// Overrides for April/May 2026
const APR = {}; const MAY = {};
const overrides = [
  // CPI section
  ['cpiData', 'yoy', [1.2, 1.0]],
  ['cpiData', 'mom', [0.3, 0.1]],
  ['cpiData', 'coreYoy', [1.1, 1.0]],
  ['cpiData', 'coreMom', [0.2, 0.1]],
  // PPI
  ['ppiData', 'yoy', [2.8, 2.5]],
  ['ppiData', 'mom', [0.8, 0.3]],
  // PMI
  ['pmiData', 'manufacturing', [50.3, 50.5]],
  ['pmiData', 'nonManufacturing', [50.4, 51.0]],
  ['pmiData', 'caixin', [50.1, 50.3]],
  // Industrial
  ['industrialData', 'yoy', [6.6, 6.2]],
  ['industrialData', 'mom', [0.4, 0.3]],
  // Electricity - total/yoy
  ['electricityData', 'total', [6150, 6900]],
  ['electricityData', 'yoy', [5.5, 5.8]],
  ['electricityData', 'primary', [6.5, 5.8]],
  ['electricityData', 'secondary', [4.8, 4.5]],
  ['electricityData', 'tertiary', [6.5, 6.0]],
  // FX Reserve
  ['fxReserveData', 'amount', [32850, 32900]],
  ['fxReserveData', 'yoy', [2.5, 2.0]],
  ['fxReserveData', 'mom', [0.3, 0.2]],
  // Export/Import
  ['exportData', 'yoy', [8.5, 7.2]],
  ['importData', 'yoy', [5.0, 4.5]],
  // Retail
  ['retailData', 'yoy', [5.0, 5.2]],
  // Unemployment
  ['unemploymentData', 'national', [5.0, 5.1]],
  ['unemploymentData', 'youth', [14.2, 14.0]],
  ['unemploymentData', 'prime', [4.1, 4.2]],
  // FAI
  ['faiData', 'accumYoy', [4.0, 4.2]],
  ['faiData', 'mom', [-0.2, 0.3]],
  ['faiData', 'manufacturing', [8.5, 8.0]],
  ['faiData', 'infrastructure', [5.2, 5.5]],
  ['faiData', 'realEstate', [-7.5, -7.0]],
  // Real Estate
  ['realestateData', 'salesAreaAccum', [1.05, 0.85]],
  ['realestateData', 'salesAreaAccumYoy', ['-5.0', '-4.8']],
  ['realestateData', 'salesAreaMonth', [0.92, 0.85]],
  ['realestateData', 'avgPrice', [10300, 10400]],
  ['realestateData', 'area', [4000, 3900]],
  ['realestateData', 'value', [4200, 4100]],
  // Social Fin
  ['socialFinancingData', 'yoy', [8.6, 8.4]],
  ['socialFinancingData', 'monthlyValue', [1.85, 3.5]],
  // Credit
  ['creditData', 'householdShort', [-0.1, 0.15]],
  ['creditData', 'householdLong', [0.4, 0.45]],
  ['creditData', 'enterpriseShort', [0.8, 0.9]],
  ['creditData', 'enterpriseLong', [1.2, 1.1]],
  ['creditData', 'billFinancing', [0.2, 0.15]],
  // Rate
  ['rateData', 'mlfRate', [2.5, 2.5]],
  ['rateData', 'mlfAmount', [5000, 4500]],
  ['rateData', 'lpr1y', [3.45, 3.45]],
  ['rateData', 'lpr5y', [4.2, 4.2]],
  ['rateData', 'repo7d', [1.8, 1.8]],
  ['rateData', 'repo14d', [1.85, 1.85]],
  ['rateData', 'repo28d', [1.9, 1.9]],
  ['rateData', 'cd3m', [1.9, 1.85]],
  ['rateData', 'cd1y', [2.0, 2.0]],
  ['rateData', 'interbank1d', [1.4, 1.35]],
  ['rateData', 'interbank7d', [1.7, 1.65]],
  ['rateData', 'repo7dma20', [1.75, 1.7]],
  ['rateData', 'dr007', [1.6, 1.55]],
  // Money
  ['moneyData', 'm0', [8.2, 8.0]],
  ['moneyData', 'm1', [1.8, 2.0]],
  ['moneyData', 'm2', [7.9, 8.0]],
  ['moneyData', 'm2m1Diff', [6.1, 6.0]],
  // Deposit
  ['depositData', 'household', [1.35, 1.5]],
  ['depositData', 'fiscal', [0.3, 0.25]],
  ['depositData', 'enterprise', [0.2, -0.3]],
  ['depositData', 'nonBank', [-0.1, 0.15]],
];

// Extend months array
content = content.replace(/'2026-03'\]/, "'2026-03','2026-04','2026-05']");
content = content.replace('2010.01 - 2026.03 (195个月)', '2010.01 - 2026.05 (197个月)');

// For each override, find the array in the right context and extend it
// Strategy: find "  keyName: [ ... ]" and replace the last number before ] with "lastNum,aprilVal,mayVal]"
// We need to handle both: "  yoy: [1,2,3,4]" and multi-line arrays

let matchCount = 0;
for (const [block, key, vals] of overrides) {
  // Find the array: we look for the key within its block
  // Create a regex that finds key: [ while being in the right block

  // First, find where the block starts
  const blockRegex = new RegExp(`export const ${block}\\s*=\\s*\\{`);
  const blockMatch = content.match(blockRegex);
  if (!blockMatch) continue;
  const blockStart = blockMatch.index;

  // Find the block end (matching })
  let braceDepth = 0; let blockEnd = -1;
  for (let i = blockStart; i < content.length; i++) {
    if (content[i] === '{') braceDepth++;
    if (content[i] === '}') braceDepth--;
    if (braceDepth === 0 && i > blockStart) { blockEnd = i; break; }
  }
  if (blockEnd === -1) blockEnd = Math.min(blockStart + 4000, content.length - 1);

  const blockContent = content.substring(blockStart, blockEnd);

  // Find key: [ inside this block by searching lines
  let keyPos = -1;
  const searchLines = blockContent.split('\n');

  // Find key in the block content - search each line
  // Need to be careful: blockContent starts with "export const xxx = {"
  // and includes the full multi-line block

  // Use indexOf directly in the block content
  // The key pattern is: "  keyName: ["
  const keyPattern2 = `\n  ${key}: [`;  // 2-space indent
  const keyPattern4 = `\n    ${key}: [`; // 4-space indent (nested)
  const keyPattern6 = `\n      ${key}: [`; // 6-space indent (doubly nested, like bySector)

  keyPos = blockContent.indexOf(keyPattern2);
  if (keyPos === -1) keyPos = blockContent.indexOf(keyPattern4);
  if (keyPos === -1) keyPos = blockContent.indexOf(keyPattern6);

  if (keyPos === -1) {
    console.log(`  MISS: ${block}.${key} - key not found in block`);
    continue;
  }

  // Find the matching ] starting from keyPos
  // Find the [ first
  const bracketStart = content.indexOf('[', keyPos);
  if (bracketStart === -1) { console.log(`  MISS: ${block}.${key} - no [ found`); continue; }

  let depth = 1;
  let idx = bracketStart + 1;
  while (idx < content.length && depth > 0) {
    if (content[idx] === '[') depth++;
    if (content[idx] === ']') {
      depth--;
      if (depth === 0) break;
    }
    idx++;
  }
  if (depth !== 0) { console.log(`  UNMATCHED: ${block}.${key}`); continue; }

  // idx is the absolute position of ] in the original content
  // Find the last number before this ]
  // Look backwards 100 chars to find numbers near the end

  // Now perform the actual replacement in the original content
  // idx is position of ]
  const apr = String(vals[0]);
  const may = String(vals[1]);

  // Check if there's already a comma before ]
  let lookback = 1;
  while (content[idx - lookback].match(/\s/)) lookback++;
  const lastChar = content[idx - lookback];
  const insert = (lastChar.match(/[\d.]/) ? ',' : '') + apr + ',' + may;
  content = content.substring(0, idx) + insert + content.substring(idx);
  matchCount++;
  console.log(`  OK: ${block}.${key} (pos ${bracketStart}) -> ${apr}, ${may}`);
}

console.log(`Extended ${matchCount}/${overrides.length} arrays`);
fs.writeFileSync(path, content, 'utf8');
