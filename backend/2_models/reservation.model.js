import db from "../1_config/db.js";

/**
 * Créer une réservation COMPLÈTE dans une TRANSACTION.
 * Tout réussit ensemble, ou rien n'est écrit (rollback).
 * Le try/catch ici sert UNIQUEMENT au rollback (nettoyage),
 * pas au log : l'erreur est relancée et loguée au niveau du controller.
 */
export const createReservation = async (data) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Vérifier la disponibilité de CHAQUE chambre sur les dates.
    //    Deux périodes [arrivée, départ[ se chevauchent si :
    //    existante.arrivée < nouvelle.départ  ET  existante.départ > nouvelle.arrivée
    for (const c of data.chambres) {
      const [rows] = await conn.query(
        `SELECT COUNT(*) AS nb
         FROM reservation_chambre rc
         JOIN reservation r ON r.id = rc.reservation_id
         WHERE rc.chambre_id = ?
           AND r.statut <> 'annulee'
           AND r.date_arrivee < ?
           AND r.date_depart  > ?`,
        [c.chambre_id, data.date_depart, data.date_arrivee]
      );

      if (rows[0].nb > 0) {
        const err = new Error("Chambre indisponible");
        err.code = "CHAMBRE_INDISPONIBLE";
        err.chambre_id = c.chambre_id;
        throw err;
      }
    }

    // 2. Client : on le retrouve par email, sinon on le crée (guest checkout).
    const [clientRows] = await conn.query(
      "SELECT id FROM client WHERE email = ?",
      [data.client.email]
    );

    let clientId;
    if (clientRows.length > 0) {
      clientId = clientRows[0].id;
    } else {
      const [clientResult] = await conn.query(
        `INSERT INTO client (nom, prenom, email, telephone, consentement_marketing)
         VALUES (?, ?, ?, ?, ?)`,
        [
          data.client.nom,
          data.client.prenom,
          data.client.email,
          data.client.telephone || null,
          data.client.consentement_marketing === true,
        ]
      );
      clientId = clientResult.insertId;
    }

    // 3. La réservation elle-même.
    const [resaResult] = await conn.query(
      `INSERT INTO reservation
       (client_id, date_arrivee, date_depart, nb_personnes, statut, montant_total, montant_acompte, token_suivi)
       VALUES (?, ?, ?, ?, 'en_attente', ?, ?, ?)`,
      [
        clientId,
        data.date_arrivee,
        data.date_depart,
        data.nb_personnes,
        data.montant_total,
        data.montant_acompte,
        data.token_suivi,
      ]
    );
    const reservationId = resaResult.insertId;

    // 4. Les lignes chambres (sous-total figé par chambre).
    for (const c of data.chambres) {
      await conn.query(
        `INSERT INTO reservation_chambre (reservation_id, chambre_id, nb_nuits, sous_total)
         VALUES (?, ?, ?, ?)`,
        [reservationId, c.chambre_id, c.nb_nuits, c.sous_total]
      );
    }

    // 5. Les lignes prestations (options), s'il y en a.
    for (const p of data.prestations) {
      await conn.query(
        `INSERT INTO reservation_prestation (reservation_id, prestation_id, quantite, prix_unitaire)
         VALUES (?, ?, ?, ?)`,
        [reservationId, p.prestation_id, p.quantite, p.prix_unitaire]
      );
    }

    await conn.commit();

    return { reservationId, token_suivi: data.token_suivi };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

/**
 * Mettre à jour le statut d'une réservation (back-office).
 */
export const updateReservationStatut = async (id, statut) => {
  const [result] = await db.query(
    "UPDATE reservation SET statut = ? WHERE id = ?",
    [statut, id]
  );
  return result.affectedRows > 0;
};

/**
 * Lister toutes les réservations (pour le back-office).
 */
export const getReservations = async () => {
  const [rows] = await db.query(
    `SELECT r.*, c.nom AS client_nom, c.prenom AS client_prenom, c.email AS client_email
     FROM reservation r
     JOIN client c ON c.id = r.client_id
     ORDER BY r.created_at DESC`
  );
  return rows;
};

/**
 * Récupérer une réservation COMPLÈTE (dossier) : client + chambres + prestations.
 * champ = "id" (back-office) ou "token_suivi" (suivi client sans compte).
 */
const getReservationComplete = async (champ, valeur) => {
  const [resaRows] = await db.query(
    `SELECT r.*, c.nom AS client_nom, c.prenom AS client_prenom,
            c.email AS client_email, c.telephone AS client_telephone
     FROM reservation r
     JOIN client c ON c.id = r.client_id
     WHERE r.${champ} = ?`,
    [valeur]
  );

  if (resaRows.length === 0) return null;

  const reservation = resaRows[0];

  const [chambres] = await db.query(
    `SELECT rc.chambre_id, rc.nb_nuits, rc.sous_total, ch.nom AS chambre_nom
     FROM reservation_chambre rc
     JOIN chambre ch ON ch.id = rc.chambre_id
     WHERE rc.reservation_id = ?`,
    [reservation.id]
  );

  const [prestations] = await db.query(
    `SELECT rp.prestation_id, rp.quantite, rp.prix_unitaire, p.nom AS prestation_nom
     FROM reservation_prestation rp
     JOIN prestation p ON p.id = rp.prestation_id
     WHERE rp.reservation_id = ?`,
    [reservation.id]
  );

  reservation.chambres = chambres;
  reservation.prestations = prestations;

  return reservation;
};

export const getReservationById = async (id) => {
  return getReservationComplete("id", id);
};

export const getReservationByToken = async (token) => {
  return getReservationComplete("token_suivi", token);
};
