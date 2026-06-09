// =============================================================================
//  role.middleware.js — Contrôle d'accès par rôle (RBAC)
//  S'utilise APRÈS authMiddleware (qui a rempli req.user à partir du token).
//  Exemple : roleMiddleware("super_admin", "admin")
// =============================================================================
export const roleMiddleware = (...roles) => {
  return (req, res, next) => {

    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Accès refusé : rôle insuffisant" }) ;
    }

    next() ;
  } ;
} ;
