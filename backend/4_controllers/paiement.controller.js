import * as PaiementModel from "../2_models/paiement.model.js";
import * as ReservationModel from "../2_models/reservation.model.js";
import { sendConfirmationReservation } from "../1_config/mailer.js";
import { randomUUID } from "crypto";

/**
 * Initier un paiement (acompte ou total).
 * Étape équivalente, en vrai Stripe, à la création d'un PaymentIntent /
 * d'une Checkout Session : ici on simule en créant une ligne `paiement`
 * et en renvoyant une référence.
 */
const initierPaiement = async (req, res, type) => {
  try {
    const reservation = await ReservationModel.getReservationById(req.params.reservationId);
    if (!reservation)
      return res.status(404).json({ message: "Réservation introuvable" });

    if (reservation.statut === "annulee")
      return res.status(409).json({ message: "Réservation annulée : paiement impossible." });

    // SÉCURITÉ : le montant est RELU EN BASE, jamais envoyé par le front.
    const montant =
      type === "acompte" ? reservation.montant_acompte : reservation.montant_total;

    const reference = "SIMU-" + randomUUID();

    const paiementId = await PaiementModel.createPaiement({
      reservation_id: reservation.id,
      montant,
      type,
      statut: "en_attente",
      reference,
    });

    // En vrai Stripe : on renverrait ici une URL de paiement (Checkout) ou un client_secret.
    res.status(201).json({
      message: "Paiement initié (simulation)",
      paiement_id: paiementId,
      type,
      montant,
      reference,
      etape_suivante: `POST /api/paiements/${paiementId}/confirmer (simule le webhook Stripe)`,
    });
  } catch (err) {
    console.error("[initierPaiement]", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const initierAcompte = (req, res) => initierPaiement(req, res, "acompte");
export const initierTotal = (req, res) => initierPaiement(req, res, "total");

/**
 * Confirmer un paiement = SIMULE LE WEBHOOK Stripe.
 * En vrai Stripe, cette route serait appelée par Stripe (serveur->serveur),
 * avec une SIGNATURE à vérifier. Ici, on simule l'événement "paiement réussi".
 */
export const confirmerPaiement = async (req, res) => {
  try {
    const paiement = await PaiementModel.getPaiementById(req.params.id);
    if (!paiement)
      return res.status(404).json({ message: "Paiement introuvable" });

    await PaiementModel.marquerPaiementReussi(paiement.id);

    // Le statut de la réservation suit le type de paiement réglé.
    const nouveauStatut = paiement.type === "acompte" ? "acompte_paye" : "soldee";
    await ReservationModel.updateReservationStatut(paiement.reservation_id, nouveauStatut);

    // E-mail de confirmation à la réception de l'acompte (réservation confirmée).
    // try/catch DÉDIÉ : si l'envoi échoue, le paiement reste validé (on logge seulement).
    if (paiement.type === "acompte") {
      try {
        const reservation = await ReservationModel.getReservationById(paiement.reservation_id);
        await sendConfirmationReservation(reservation);
      } catch (mailErr) {
        console.error("[confirmerPaiement] envoi e-mail échoué :", mailErr.message);
      }
    }

    res.json({
      message: "Paiement confirmé (simulation du webhook Stripe)",
      paiement_id: paiement.id,
      reservation_id: paiement.reservation_id,
      nouveau_statut_reservation: nouveauStatut,
    });
  } catch (err) {
    console.error("[confirmerPaiement]", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

/**
 * Back-office : historique des paiements d'une réservation.
 */
export const getPaiementsReservation = async (req, res) => {
  try {
    const paiements = await PaiementModel.getPaiementsByReservation(
      req.params.reservationId
    );
    res.json(paiements);
  } catch (err) {
    console.error("[getPaiementsReservation]", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
