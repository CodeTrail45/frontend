export const BASE_URL = 'http://107.20.46.108:8000';

export const API_ENDPOINTS = {
  SEARCH_LYRICS: `http://107.20.46.108:8000/search_lyrics`,
  ANALYZE_LYRICS: `${BASE_URL}/analyze_lyrics`,
  RE_ANALYZE: `${BASE_URL}/re_analyze`,
  COMMENTS: `${BASE_URL}/api/comments`,
  USER: `${BASE_URL}/api/user`,
  AUTH: {
    LOGIN: `${BASE_URL}/token`,
    REGISTER: `${BASE_URL}/register`
  }
}; 