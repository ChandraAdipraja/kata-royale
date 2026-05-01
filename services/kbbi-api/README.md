# KBBI API - Indonesian Dictionary API

Backend API for the KBBI Assistant mobile app, deployed on Cloudflare Workers.

## Features

- **Word Lookup**: Check if a word exists in KBBI
- **Word Details**: Get complete word information (meanings, word class, etymology, etc.)
- **Non-Standard Check**: Check if a word is in standard form and get suggestions
- **Similar Words**: Get typo suggestions using Levenshtein distance
- **Search**: Search words by prefix or substring
- **High Performance**: Deployed on Cloudflare's global edge network with KV storage
- **CORS Enabled**: Ready for mobile and web apps

## API Endpoints

### 1. Check if word exists
```
GET /api/lookup/:word
```

**Example:**
```bash
curl https://your-worker.workers.dev/api/lookup/rumah
```

**Response:**
```json
{
  "exists": true,
  "word": "rumah"
}
```

### 2. Get word details
```
GET /api/word/:word
```

**Example:**
```bash
curl https://your-worker.workers.dev/api/word/rumah
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "pranala": "https://kbbi.kemdikbud.go.id/entri/rumah",
    "entri": [
      {
        "nama": "rumah",
        "kata_dasar": ["rumah"],
        "makna": [...],
        "etimologi": "...",
        ...
      }
    ]
  }
}
```

### 3. Check standard/non-standard form
```
GET /api/check/:word
```

**Example:**
```bash
curl https://your-worker.workers.dev/api/check/rumah
```

**Response:**
```json
{
  "is_standard": true,
  "word": "rumah",
  "non_standard_forms": ["ruma"]
}
```

### 4. Get similar words (typo suggestions)
```
GET /api/similar/:word?limit=5
```

**Example:**
```bash
curl https://your-worker.workers.dev/api/similar/rumh?limit=5
```

**Response:**
```json
{
  "word": "rumh",
  "suggestions": [
    { "word": "rumah", "distance": 1 },
    { "word": "ruma", "distance": 1 }
  ]
}
```

### 5. Search words
```
GET /api/search?q=query&limit=10
```

**Example:**
```bash
curl https://your-worker.workers.dev/api/search?q=rum&limit=10
```

**Response:**
```json
{
  "query": "rum",
  "count": 10,
  "results": ["rumah", "rumania", "rumbia", ...]
}
```

### 6. API Statistics
```
GET /api/stats
```

**Response:**
```json
{
  "total_words": 112651,
  "api_version": "1.0.0",
  "endpoints": [...]
}
```

## Deployment Guide

### Prerequisites

1. **Cloudflare Account**: Sign up at [cloudflare.com](https://cloudflare.com)
2. **Wrangler CLI**: Already installed in this project
3. **Node.js**: Version 18 or higher

### Step 1: Prepare the Data

Process the KBBI JSON files and create KV-ready data:

```bash
npm run prepare-data
```

This will create:
- `kv-data/` directory with processed data
- Word index files
- Non-standard word mappings
- Bulk upload JSON files

### Step 2: Create KV Namespace

```bash
npx wrangler kv:namespace create KBBI_DATA
```

You'll get output like:
```
{ binding = "KBBI_DATA", id = "xxxxxxxxxxxxx" }
```

For preview (development):
```bash
npx wrangler kv:namespace create KBBI_DATA --preview
```

### Step 3: Update wrangler.toml

Edit `wrangler.toml` and replace the KV namespace IDs:

```toml
[[kv_namespaces]]
binding = "KBBI_DATA"
id = "your_production_namespace_id"
preview_id = "your_preview_namespace_id"
```

### Step 4: Upload Data to KV

Upload the processed data to Cloudflare KV:

```bash
cd kv-data

# Set your namespace ID
export KV_NAMESPACE_ID="your_namespace_id"

# Upload using the generated script
./upload-to-kv.sh
```

Or upload manually using the bulk upload files:

```bash
npx wrangler kv:bulk put kv-data/bulk_upload_1.json --namespace-id=your_namespace_id
npx wrangler kv:bulk put kv-data/bulk_upload_2.json --namespace-id=your_namespace_id
# ... continue for all bulk files
```

### Step 5: Test Locally

```bash
npm run dev
```

Visit `http://localhost:8787` to test the API locally.

### Step 6: Deploy to Cloudflare

```bash
npm run deploy
```

Your API will be deployed to `https://kbbi-api.your-subdomain.workers.dev`

## Usage in React Native App

```javascript
const KBBI_API_URL = 'https://your-worker.workers.dev';

// Check if word exists
async function checkWord(word) {
  const response = await fetch(`${KBBI_API_URL}/api/lookup/${word}`);
  return response.json();
}

// Get word details
async function getWordDetails(word) {
  const response = await fetch(`${KBBI_API_URL}/api/word/${word}`);
  return response.json();
}

// Get typo suggestions
async function getSuggestions(word) {
  const response = await fetch(`${KBBI_API_URL}/api/similar/${word}?limit=5`);
  return response.json();
}

// Search words
async function searchWords(query) {
  const response = await fetch(`${KBBI_API_URL}/api/search?q=${query}&limit=10`);
  return response.json();
}
```

## Performance Optimization

- **KV Storage**: All words are cached in Cloudflare KV (low-latency key-value store)
- **Edge Network**: Deployed globally for minimal latency
- **HTTP Caching**: Response caching with appropriate `Cache-Control` headers
- **CORS**: Pre-configured for cross-origin requests

## Monitoring

View logs and analytics:

```bash
npx wrangler tail
```

Or visit the Cloudflare Dashboard for detailed analytics.

## Cost Estimate

Cloudflare Workers Free Tier includes:
- 100,000 requests/day
- Unlimited KV reads
- 1,000 KV writes/day
- 1 GB KV storage

This should be sufficient for development and moderate production use.

## Data Source

KBBI dataset from: [kbbi-dataset-kbbi-v-main](https://github.com/damzaky/kumpulan-kata-bahasa-indonesia-KBBI)

**Copyright:** All data is owned by Badan Pengembangan dan Pembinaan Bahasa, Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi Republik Indonesia.

**License:** Non-commercial use only. See dataset README for details.

## Troubleshooting

### KV Upload Fails

If bulk upload fails due to size limits, split the data into smaller chunks or use individual key uploads.

### Workers Deployment Fails

- Ensure you're logged in: `npx wrangler login`
- Check your Cloudflare account has Workers enabled
- Verify wrangler.toml configuration

### Data Not Found

- Verify KV namespace is correctly bound in wrangler.toml
- Check data was uploaded successfully: `npx wrangler kv:key list --namespace-id=your_id`

## Next Steps

After deployment:
1. Test all endpoints with real data
2. Integrate with React Native app
3. Add rate limiting if needed
4. Set up custom domain (optional)
5. Monitor usage and performance

## Support

For issues or questions, please refer to:
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)
