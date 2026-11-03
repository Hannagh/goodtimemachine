// Cloudflare Worker: password-protected API for editing shows.json in the GitHub repo.
// Secrets (set in the Cloudflare dashboard, never in this file): ADMIN_PASSWORD, GITHUB_TOKEN

const ALLOWED_ORIGIN = 'https://hannagh.github.io';
const REPO = 'Hannagh/goodtimemachine';
const FILE_PATH = 'shows.json';
const BRANCH = 'main';
const MAX_SHOWS = 200;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
  'Vary': 'Origin',
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

async function sha256(text) {
  const data = new TextEncoder().encode(text);
  return new Uint8Array(await crypto.subtle.digest('SHA-256', data));
}

async function passwordMatches(provided, expected) {
  if (!expected) return false;
  const [a, b] = await Promise.all([sha256(provided), sha256(expected)]);
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

function toBase64(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  bytes.forEach(b => { binary += String.fromCharCode(b); });
  return btoa(binary);
}

function fromBase64(b64) {
  const binary = atob(b64.replace(/\n/g, ''));
  const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function githubHeaders(env) {
  return {
    Authorization: 'Bearer ' + env.GITHUB_TOKEN,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'good-time-machine-admin',
  };
}

const CONTENTS_URL = `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`;

async function readShowsFile(env) {
  const response = await fetch(`${CONTENTS_URL}?ref=${BRANCH}`, { headers: githubHeaders(env) });
  if (!response.ok) throw new Error('GitHub read failed (' + response.status + ')');
  const file = await response.json();
  return { sha: file.sha, data: JSON.parse(fromBase64(file.content)) };
}

function validateShows(input) {
  if (!input || !Array.isArray(input.shows)) return { error: 'Request must include a "shows" list.' };
  if (input.shows.length > MAX_SHOWS) return { error: 'Too many shows.' };

  const cleaned = [];
  for (const show of input.shows) {
    const venue = typeof show.venue === 'string' ? show.venue.trim() : '';
    const datetime = typeof show.datetime === 'string' ? show.datetime.trim() : '';
    const ticketUrl = typeof show.ticketUrl === 'string' ? show.ticketUrl.trim() : '';

    if (!venue || venue.length > 100) return { error: 'Each show needs a theater name (100 characters max).' };
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(datetime) || Number.isNaN(Date.parse(datetime))) {
      return { error: 'Each show needs a valid date and time.' };
    }
    if (ticketUrl) {
      let parsed;
      try { parsed = new URL(ticketUrl); } catch (e) { parsed = null; }
      if (!parsed || parsed.protocol !== 'https:' || ticketUrl.length > 500) {
        return { error: 'Ticket links must be valid https:// URLs.' };
      }
    }
    cleaned.push({ venue, datetime, ticketUrl });
  }

  cleaned.sort((a, b) => a.datetime.localeCompare(b.datetime));
  return { shows: cleaned };
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const authHeader = request.headers.get('Authorization') || '';
    const provided = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!(await passwordMatches(provided, env.ADMIN_PASSWORD))) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return json({ error: 'Incorrect password.' }, 401);
    }

    try {
      if (request.method === 'GET') {
        const { data } = await readShowsFile(env);
        return json({ shows: data.shows });
      }

      if (request.method === 'PUT') {
        let body;
        try { body = await request.json(); } catch (e) { return json({ error: 'Invalid request.' }, 400); }

        const result = validateShows(body);
        if (result.error) return json({ error: result.error }, 400);

        const { sha } = await readShowsFile(env);
        const content = JSON.stringify({ shows: result.shows }, null, 2) + '\n';

        const response = await fetch(CONTENTS_URL, {
          method: 'PUT',
          headers: { ...githubHeaders(env), 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: 'Update shows via admin page',
            content: toBase64(content),
            sha,
            branch: BRANCH,
          }),
        });
        if (!response.ok) return json({ error: 'GitHub save failed (' + response.status + ').' }, 502);

        return json({ shows: result.shows });
      }

      return json({ error: 'Method not allowed.' }, 405);
    } catch (e) {
      return json({ error: 'Server error: ' + e.message }, 500);
    }
  },
};
