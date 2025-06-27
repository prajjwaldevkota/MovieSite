// This file is no longer needed. All TMDB requests are now proxied through /api/tmdb/[...route] to keep the API key secure.

import axios from "axios";

const tmdb = axios.create({
  baseURL: "https://api.themoviedb.org/3",
});

export default tmdb; 