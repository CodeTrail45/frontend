// File: pages/api/search.js

import axios from 'axios';

export default async function handler(req, res) {
  // Only accept GET requests.
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { q } = req.query;

  // Validate the query parameter (must be at least 3 characters)
  if (!q || typeof q !== 'string' || q.trim().length < 3) {
    return res.status(400).json({
      error: 'Missing or invalid query parameter. Please enter at least 3 characters.',
    });
  }

  try {
    // Use the SEARCH_API_URL environment variable if available.
    const baseUrl = process.env.SEARCH_API_URL || 'http://localhost:8000';
    // Call the FastAPI search endpoint.
    // Adjust the parameter name if needed. Here we pass "q".
    const response = await axios.get(`${baseUrl}/search_lyrics`, {
      params: { q: q.trim() },
    });
    return res.status(200).json(response.data);
  } catch (error) {
    console.error('Error fetching search results:', error);
    return res.status(500).json({ error: 'Error fetching search results' });
  }
}
