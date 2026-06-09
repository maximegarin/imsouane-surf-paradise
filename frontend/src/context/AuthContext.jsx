// =============================================================================
//  AuthContext.jsx — l'état d'authentification GLOBAL de l'app.
//  Fournit : l'admin connecté (ou null), et les fonctions login() / logout().
//  Accessible partout via le hook useAuth() (pas de "prop drilling").
// =============================================================================
import { createContext, useState, useEffect } from "react";
import api from "../api/axios";

// 1. On crée le "contexte" (le canal de diffusion de la donnée).
export const AuthContext = createContext(null);

// 2. Le "Provider" : un composant qui ENVELOPPE l'app et fournit la donnée.
export function AuthProvider({ children }) {
  // L'admin connecté : on tente de le relire depuis localStorage au démarrage
  // (pour rester connecté même après un rafraîchissement de page F5).
  const [admin, setAdmin] = useState(() => {
    const stocke = localStorage.getItem("admin");
    const initial = stocke ? JSON.parse(stocke) : null;

    // IMPORTANT : on applique le token sur axios TOUT DE SUITE (synchrone),
    // dès la création de l'état initial. Sinon, après un F5, le Dashboard
    // pourrait lancer son appel API AVANT que le token soit posé -> 401.
    if (initial?.token) {
      api.defaults.headers.common.Authorization = `Bearer ${initial.token}`;
    }
    return initial;
  });

  // À chaque CHANGEMENT d'admin (login / logout) : on (ré)applique ou retire
  // le token sur axios. (L'init synchrone ci-dessus gère le cas du F5.)
  useEffect(() => {
    if (admin?.token) {
      api.defaults.headers.common.Authorization = `Bearer ${admin.token}`;
    } else {
      delete api.defaults.headers.common.Authorization;
    }
  }, [admin]);

  // Connexion : appelle l'API, stocke le token + infos, renvoie true/false.
  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    const token = res.data.token;

    // Le token JWT contient { id, email, role } : on décode sa partie centrale
    // (payload) pour connaître le rôle, sans appel supplémentaire.
    const payload = JSON.parse(atob(token.split(".")[1]));

    const adminData = { token, email: payload.email, role: payload.role };
    setAdmin(adminData);
    localStorage.setItem("admin", JSON.stringify(adminData));
    return true;
  };

  // Déconnexion : on oublie tout.
  const logout = () => {
    setAdmin(null);
    localStorage.removeItem("admin");
  };

  return (
    <AuthContext.Provider value={{ admin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
