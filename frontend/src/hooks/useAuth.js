// useAuth.js — raccourci pour lire le contexte d'authentification.
// Au lieu d'écrire useContext(AuthContext) partout, on écrit useAuth().
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export function useAuth() {
  return useContext(AuthContext);
}
