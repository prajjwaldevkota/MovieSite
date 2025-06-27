import axios from 'axios';

export async function POST(req) {
  try {
    const { searchParams } = new URL(req.url);
    const route = req.nextUrl.pathname.split('/api/tmdb/')[1];
    const body = await req.json();
    const { queryParams } = body;

    const response = await axios.get(`https://api.themoviedb.org/3/${route}`, {
      params: {
        ...queryParams,
        api_key: process.env.TMDB_API_KEY,
      },
    });
    return new Response(JSON.stringify(response.data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('TMDB Proxy Error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch from TMDB' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 