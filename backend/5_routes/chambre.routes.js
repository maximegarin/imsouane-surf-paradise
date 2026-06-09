import express from "express";
import {
  getChambres,
  getChambre,
  getChambresDisponibles,
  getChambreParSlug,
  createChambre,
  updateChambre,
  deleteChambre,
} from "../4_controllers/chambre.controller.js";
import { validateChambre } from "../3_middlewares/validation.middleware.js";
import { authMiddleware } from "../3_middlewares/auth.middleware.js";
import { roleMiddleware } from "../3_middlewares/role.middleware.js";

const router = express.Router();


// Lecture : publique (le site vitrine affiche les chambres)
router.get("/", getChambres);

// IMPORTANT : les routes "littérales" (/disponibles, /slug/:slug) doivent être
// déclarées AVANT "/:id". Sinon Express ferait correspondre "disponibles" à :id.
router.get("/disponibles", getChambresDisponibles);

router.get("/slug/:slug", getChambreParSlug);

router.get("/:id", getChambre);

// Écriture : réservée aux admins (super_admin + admin)
router.post(
  "/",
  authMiddleware,
  roleMiddleware("super_admin", "admin"),
  validateChambre,
  createChambre
);

router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("super_admin", "admin"),
  validateChambre,
  updateChambre
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("super_admin", "admin"),
  deleteChambre
);


export default router;
