import express from "express";
import {
  initierAcompte,
  initierTotal,
  confirmerPaiement,
  getPaiementsReservation,
} from "../4_controllers/paiement.controller.js";
import { authMiddleware } from "../3_middlewares/auth.middleware.js";
import { roleMiddleware } from "../3_middlewares/role.middleware.js";

const router = express.Router();


// Initier un paiement : public (le client paie sans compte)
router.post("/acompte/:reservationId", initierAcompte);

router.post("/total/:reservationId", initierTotal);

// Confirmer un paiement : SIMULE le webhook Stripe.
// (En vrai Stripe : route appelée par Stripe, avec signature à vérifier.)
router.post("/:id/confirmer", confirmerPaiement);

// Back-office : historique des paiements d'une réservation
router.get(
  "/reservation/:reservationId",
  authMiddleware,
  roleMiddleware("super_admin", "admin", "gestionnaire"),
  getPaiementsReservation
);


export default router;
