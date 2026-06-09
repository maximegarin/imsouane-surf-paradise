// =============================================================================
//  ProtectedRoute.jsx — le "videur" des pages admin.
//  Si personne n'est connecté -> redirige vers /admin/login.
//  Option : restreindre à certains rôles (RBAC côté UI).
//
//  ⚠️ Rappel sécurité : ceci protège l'AFFICHAGE (confort UX). La vraie
//  sécurité reste les middlewares JWT + rôles côté API (qui refusent les
//  données sans token valide). On ne fait jamais confiance au front.
// =============================================================================
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

function ProtectedRoute({ children, roles }) {
  const { admin } = useAuth();

  // 1. Pas connecté -> direction le login.
  if (!admin) {
    return <Navigate to="/admin/login" replace />;
  }

  // 2. Connecté mais rôle non autorisé (si une liste de rôles est exigée).
  if (roles && !roles.includes(admin.role)) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // 3. Tout est bon -> on affiche la page demandée.
  return children;
}

export default ProtectedRoute;
