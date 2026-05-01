/**
 * Script to prepare KBBI data for Cloudflare KV
 * This script processes the JSON files and creates:
 * 1. Individual word entries
 * 2. Word index for searching
 * 3. Non-standard word index
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../kbbi-dataset-kbbi-v-main/json');
const OUTPUT_DIR = path.join(__dirname, '../kv-data');

// Create output directory
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function processKBBIData() {
  console.log('🚀 Processing KBBI data...');

  const allWords = [];
  const nonStandardIndex = {};
  let totalEntries = 0;

  // Read all JSON files
  const jsonFiles = [
    'kbbi_v_part1.json',
    'kbbi_v_part2.json',
    'kbbi_v_part3.json',
    'kbbi_v_part4.json',
  ];

  for (const file of jsonFiles) {
    console.log(`📖 Processing ${file}...`);
    const filePath = path.join(DATA_DIR, file);
    const rawData = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(rawData);

    const entries = Object.entries(data);
    console.log(`   Found ${entries.length} entries`);

    for (const [key, value] of entries) {
      totalEntries++;
      const wordKey = key.toLowerCase();
      allWords.push(wordKey);

      // Save individual word entry
      const wordFile = path.join(OUTPUT_DIR, `word_${Buffer.from(wordKey).toString('base64').replace(/[\/+=]/g, '_')}.json`);
      fs.writeFileSync(wordFile, JSON.stringify(value));

      // Index non-standard forms
      if (value.data && value.data.entri) {
        for (const entri of value.data.entri) {
          if (entri.bentuk_tidak_baku && entri.bentuk_tidak_baku.length > 0) {
            for (const nonStandard of entri.bentuk_tidak_baku) {
              nonStandardIndex[nonStandard.toLowerCase()] = wordKey;
            }
          }
        }
      }
    }
  }

  // Sort and deduplicate words
  const uniqueWords = [...new Set(allWords)].sort();

  // Save word index
  console.log('💾 Saving word index...');
  fs.writeFileSync(
    path.join(OUTPUT_DIR, '__index_words__.json'),
    JSON.stringify(uniqueWords)
  );

  // Save non-standard index
  console.log('💾 Saving non-standard word index...');
  fs.writeFileSync(
    path.join(OUTPUT_DIR, '__index_non_standard__.json'),
    JSON.stringify(nonStandardIndex)
  );

  // Generate KV upload script
  console.log('📝 Generating upload script...');
  const uploadScript = generateUploadScript(uniqueWords, nonStandardIndex);
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'upload-to-kv.sh'),
    uploadScript
  );
  fs.chmodSync(path.join(OUTPUT_DIR, 'upload-to-kv.sh'), '755');

  // Generate bulk upload JSON
  console.log('📝 Generating bulk upload file...');
  const bulkData = generateBulkUploadData(uniqueWords, nonStandardIndex, OUTPUT_DIR);

  // Split bulk data into chunks (KV has limits)
  const chunkSize = 10000;
  for (let i = 0; i < bulkData.length; i += chunkSize) {
    const chunk = bulkData.slice(i, i + chunkSize);
    const chunkNum = Math.floor(i / chunkSize) + 1;
    fs.writeFileSync(
      path.join(OUTPUT_DIR, `bulk_upload_${chunkNum}.json`),
      JSON.stringify(chunk, null, 2)
    );
    console.log(`   Created bulk_upload_${chunkNum}.json with ${chunk.length} entries`);
  }

  console.log('\n✅ Processing complete!');
  console.log(`📊 Statistics:`);
  console.log(`   Total entries: ${totalEntries}`);
  console.log(`   Unique words: ${uniqueWords.length}`);
  console.log(`   Non-standard forms: ${Object.keys(nonStandardIndex).length}`);
  console.log(`\n📁 Output directory: ${OUTPUT_DIR}`);
  console.log(`\n🚀 Next steps:`);
  console.log(`   1. Create a KV namespace: npx wrangler kv:namespace create KBBI_DATA`);
  console.log(`   2. Update wrangler.toml with the namespace ID`);
  console.log(`   3. Upload data using: npx wrangler kv:bulk put bulk_upload_1.json --namespace-id=<YOUR_NAMESPACE_ID>`);
}

function generateUploadScript(words, nonStandardIndex) {
  let script = `#!/bin/bash
# Upload KBBI data to Cloudflare KV
# Make sure to set your namespace ID in wrangler.toml first

set -e

echo "🚀 Uploading KBBI data to Cloudflare KV..."

# Upload word index
echo "📤 Uploading word index..."
npx wrangler kv:key put "__index_words__" --path="__index_words__.json" --namespace-id=\${KV_NAMESPACE_ID}

# Upload non-standard index
echo "📤 Uploading non-standard word index..."
npx wrangler kv:key put "__index_non_standard__" --path="__index_non_standard__.json" --namespace-id=\${KV_NAMESPACE_ID}

# Upload bulk data
echo "📤 Uploading word entries in bulk..."
for file in bulk_upload_*.json; do
  echo "   Uploading \$file..."
  npx wrangler kv:bulk put "\$file" --namespace-id=\${KV_NAMESPACE_ID}
done

echo "✅ Upload complete!"
`;

  return script;
}

function generateBulkUploadData(words, nonStandardIndex, outputDir) {
  const bulkData = [];

  // Read all word files and create bulk upload format
  for (const word of words) {
    const wordFile = path.join(outputDir, `word_${Buffer.from(word).toString('base64').replace(/[\/+=]/g, '_')}.json`);
    if (fs.existsSync(wordFile)) {
      const content = fs.readFileSync(wordFile, 'utf8');
      bulkData.push({
        key: word,
        value: content,
      });
    }
  }

  // Add indexes
  bulkData.push({
    key: '__index_words__',
    value: JSON.stringify(words),
  });

  bulkData.push({
    key: '__index_non_standard__',
    value: JSON.stringify(nonStandardIndex),
  });

  return bulkData;
}

// Run the script
processKBBIData().catch(console.error);
