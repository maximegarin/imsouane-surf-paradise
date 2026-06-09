import express from "express";
import {
  createReservation,
  estimerReservation,
  getReservations,
  getReservation,
  getReservationByToken,
  updateStatut,
} from "../4_controllers/reservation.controller.js";
import {
  validateReservation,
  validateEstimation,
  validateStatutReservation,
} from "../3_middlewares/validation.middleware.js";
import { authMiddleware } from "../3_middlewares/auth.middleware.js";
import { roleMiddleware } from "../3_middlewares/role.middleware.js";

const router = express.Router();


// Estimation de prix : publique, ne crée rien (affichage live du récap)
router.post("/estimation", validateEstimation, estimerReservation);

// Création : publique (le client réserve sans compte)
router.post("/", validateReservation, createReservation);

// Suivi client par token : public (lien envoyé par email)
router.get("/suivi/:token", getReservationByToken);

// Back-office : les 3 rôles peuvent consulter les réservations
router.get(
  "/",
  authMiddleware,
  roleMiddleware("super_admin", "admin", "gestionnaire"),
  getReservations
);

router.get(
  "/:id",
  authMiddleware,
  roleMiddleware("super_admin", "admin", "gestionnaire"),
  getReservation
);

// Back-office : changer le statut (confirmer / solder / annuler)
router.patch(
  "/:id/statut",
  authMiddleware,
  roleMiddleware("super_admin", "admin", "gestionnaire"),
  validateStatutReservation,
  updateStatut
);


export default router;
