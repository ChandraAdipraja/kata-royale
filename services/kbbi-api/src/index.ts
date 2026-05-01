/**
 * KBBI API - Cloudflare Workers Backend
 * Indonesian Dictionary API for KBBI Assistant App
 */

interface Env {
  KBBI_DATA: KVNamespace;
}

interface KBBIEntry {
  status: string;
  data: {
    pranala: string;
    entri: Array<{
      nama: string;
      nomor: string;
      kata_dasar: string[];
      pelafalan: string;
      bentuk_tidak_baku: string[];
      varian: string[];
      makna: Array<{
        kelas: string[];
        submakna: string[];
        info: string;
        contoh: string[];
      }>;
      etimologi: string | null;
      kata_turunan: string[];
      gabungan_kata: string[];
      peribahasa: string[];
      idiom: string[];
    }>;
  };
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Levenshtein distance for typo suggestions
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

// Router
class Router {
  routes: Map<string, (request: Request, env: Env, params: any) => Promise<Response>>;

  constructor() {
    this.routes = new Map();
  }

  get(path: string, handler: (request: Request, env: Env, params: any) => Promise<Response>) {
    this.routes.set(`GET:${path}`, handler);
  }

  post(path: string, handler: (request: Request, env: Env, params: any) => Promise<Response>) {
    this.routes.set(`POST:${path}`, handler);
  }

  async handle(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // Handle CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Try exact match first
    const exactKey = `${method}:${path}`;
    if (this.routes.has(exactKey)) {
      const handler = this.routes.get(exactKey)!;
      return handler(request, env, {});
    }

    // Try pattern matching for dynamic routes
    for (const [routeKey, handler] of this.routes.entries()) {
      const colonIndex = routeKey.indexOf(':');
      const routeMethod = routeKey.substring(0, colonIndex);
      const routePath = routeKey.substring(colonIndex + 1);

      if (routeMethod !== method) continue;

      const pattern = routePath.replace(/:\w+/g, '([^/]+)');
      const regex = new RegExp(`^${pattern}$`);
      const match = path.match(regex);

      if (match) {
        const paramNames = (routePath.match(/:\w+/g) || []).map(p => p.slice(1));
        const params: any = {};
        paramNames.forEach((name, i) => {
          params[name] = match[i + 1];
        });
        return handler(request, env, params);
      }
    }

    return new Response('Not Found', {
      status: 404,
      headers: corsHeaders
    });
  }
}

// API Handlers

async function handleWordLookup(request: Request, env: Env, params: any): Promise<Response> {
  const { word } = params;

  if (!word) {
    return new Response(JSON.stringify({ error: 'Word parameter is required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const decodedWord = decodeURIComponent(word).toLowerCase();
  const data = await env.KBBI_DATA.get(decodedWord);

  if (data) {
    return new Response(JSON.stringify({
      exists: true,
      word: decodedWord
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600'
      },
    });
  }

  return new Response(JSON.stringify({
    exists: false,
    word: decodedWord
  }), {
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600'
    },
  });
}

async function handleWordDetails(request: Request, env: Env, params: any): Promise<Response> {
  const { word } = params;

  if (!word) {
    return new Response(JSON.stringify({ error: 'Word parameter is required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const decodedWord = decodeURIComponent(word).toLowerCase();
  const data = await env.KBBI_DATA.get(decodedWord);

  if (!data) {
    return new Response(JSON.stringify({
      error: 'Word not found',
      word: decodedWord
    }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const entry: KBBIEntry = JSON.parse(data);

  return new Response(JSON.stringify(entry), {
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600'
    },
  });
}

async function handleNonStandardCheck(request: Request, env: Env, params: any): Promise<Response> {
  const { word } = params;

  if (!word) {
    return new Response(JSON.stringify({ error: 'Word parameter is required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const decodedWord = decodeURIComponent(word).toLowerCase();

  // Get list of all words (we'll need to implement a separate index for this)
  // For now, we'll check if the word exists and look at bentuk_tidak_baku
  const data = await env.KBBI_DATA.get(decodedWord);

  if (!data) {
    // Check if this word is listed as non-standard in any other entry
    const indexData = await env.KBBI_DATA.get('__index_non_standard__');
    if (indexData) {
      const nonStandardIndex = JSON.parse(indexData);
      const standardForm = nonStandardIndex[decodedWord];

      if (standardForm) {
        return new Response(JSON.stringify({
          is_standard: false,
          word: decodedWord,
          standard_form: standardForm,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({
      is_standard: false,
      word: decodedWord,
      exists_in_kbbi: false,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const entry: KBBIEntry = JSON.parse(data);
  const hasNonStandard = entry.data.entri.some(e => e.bentuk_tidak_baku.length > 0);

  return new Response(JSON.stringify({
    is_standard: true,
    word: decodedWord,
    non_standard_forms: entry.data.entri[0]?.bentuk_tidak_baku || [],
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function handleSimilarWords(request: Request, env: Env, params: any): Promise<Response> {
  const { word } = params;
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit') || '5');

  if (!word) {
    return new Response(JSON.stringify({ error: 'Word parameter is required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const decodedWord = decodeURIComponent(word).toLowerCase();

  // Get word index
  const indexData = await env.KBBI_DATA.get('__index_words__');
  if (!indexData) {
    return new Response(JSON.stringify({
      error: 'Word index not found',
      suggestions: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const wordList: string[] = JSON.parse(indexData);

  // Calculate Levenshtein distance for all words
  const distances = wordList
    .map(w => ({
      word: w,
      distance: levenshteinDistance(decodedWord, w),
    }))
    .filter(d => d.distance > 0 && d.distance <= 3) // Only suggest words within distance 3
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);

  return new Response(JSON.stringify({
    word: decodedWord,
    suggestions: distances,
  }), {
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600'
    },
  });
}

async function handleSearchWords(request: Request, env: Env, params: any): Promise<Response> {
  const url = new URL(request.url);
  const query = url.searchParams.get('q');
  const limit = parseInt(url.searchParams.get('limit') || '10');

  if (!query) {
    return new Response(JSON.stringify({ error: 'Query parameter (q) is required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const searchQuery = query.toLowerCase();

  // Get word index
  const indexData = await env.KBBI_DATA.get('__index_words__');
  if (!indexData) {
    return new Response(JSON.stringify({
      error: 'Word index not found',
      results: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const wordList: string[] = JSON.parse(indexData);

  // Search for words that start with or contain the query
  const results = wordList
    .filter(w => w.includes(searchQuery))
    .sort((a, b) => {
      // Prioritize words that start with the query
      const aStarts = a.startsWith(searchQuery);
      const bStarts = b.startsWith(searchQuery);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return a.localeCompare(b);
    })
    .slice(0, limit);

  return new Response(JSON.stringify({
    query: searchQuery,
    count: results.length,
    results,
  }), {
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=600'
    },
  });
}

async function handleStats(request: Request, env: Env, params: any): Promise<Response> {
  const indexData = await env.KBBI_DATA.get('__index_words__');
  const wordCount = indexData ? JSON.parse(indexData).length : 0;

  return new Response(JSON.stringify({
    total_words: wordCount,
    api_version: '1.0.0',
    endpoints: [
      'GET /api/lookup/:word - Check if word exists',
      'GET /api/word/:word - Get word details',
      'GET /api/check/:word - Check if word is standard form',
      'GET /api/similar/:word - Get similar words (typo suggestions)',
      'GET /api/search?q=query - Search words',
      'GET /api/stats - API statistics',
    ],
  }), {
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600'
    },
  });
}

// Main worker
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const router = new Router();

    // Define routes
    router.get('/api/lookup/:word', handleWordLookup);
    router.get('/api/word/:word', handleWordDetails);
    router.get('/api/check/:word', handleNonStandardCheck);
    router.get('/api/similar/:word', handleSimilarWords);
    router.get('/api/search', handleSearchWords);
    router.get('/api/stats', handleStats);
    router.get('/', async (request, env, params) => {
      return new Response(JSON.stringify({
        message: 'KBBI API - Indonesian Dictionary API',
        version: '1.0.0',
        documentation: '/api/stats',
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
      });
    });

    return router.handle(request, env);
  },
};
