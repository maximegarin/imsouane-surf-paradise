// =============================================================================
//  api/axios.js — Le SEUL point qui parle à l'API Express.
//  On crée une instance axios pré-configurée (baseURL) : ainsi on écrit
//  api.get('/chambres') au lieu de l'URL complète à chaque fois.
// =============================================================================
import axios from "axios";

const api = axios.create({
  // baseURL lue depuis le .env du front (variable préfixée VITE_, obligatoire).
  // Repli sur localhost:3000 en dev si la variable n'est pas définie.
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
});

export default api;
