import db from "../1_config/db.js";

/**
 * Créer une ligne de paiement (statut initial : en_attente).
 * `reference` = identifiant de la transaction (ici simulé : "SIMU-...").
 * En vrai Stripe, ce serait le stripe_payment_intent_id.
 */
export const createPaiement = async (data) => {
  const [result] = await db.query(
    `INSERT INTO paiement (reservation_id, montant, type, statut, stripe_payment_intent_id)
     VALUES (?, ?, ?, ?, ?)`,
    [data.reservation_id, data.montant, data.type, data.statut, data.reference]
  );
  return result.insertId;
};

/**
 * Récupérer un paiement par son id.
 */
export const getPaiementById = async (id) => {
  const [rows] = await db.query("SELECT * FROM paiement WHERE id = ?", [id]);
  return rows[0] || null;
};

/**
 * Historique des paiements d'une réservation (back-office).
 */
export const getPaiementsByReservation = async (reservationId) => {
  const [rows] = await db.query(
    "SELECT * FROM paiement WHERE reservation_id = ? ORDER BY created_at",
    [reservationId]
  );
  return rows;
};

/**
 * Marquer un paiement comme réussi.
 * IDEMPOTENT : la clause "AND statut <> 'reussi'" empêche de re-traiter
 * deux fois le même paiement (cas d'un webhook envoyé en double).
 */
export const marquerPaiementReussi = async (id) => {
  const [result] = await db.query(
    "UPDATE paiement SET statut = 'reussi', date_paiement = NOW() WHERE id = ? AND statut <> 'reussi'",
    [id]
  );
  return result.affectedRows > 0;
};
