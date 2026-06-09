import db from "../1_config/db.js";

/**
 * Récupérer toutes les chambres
 */
export const getChambres = async () => {
  // On joint la PREMIÈRE photo de chaque chambre (ordre le plus petit) pour
  // l'afficher sur la card. LEFT JOIN : une chambre sans photo reste listée.
  const [rows] = await db.query(
    `SELECT c.*,
            p.url AS photo_url,
            p.alt AS photo_alt
     FROM chambre c
     LEFT JOIN photo p
       ON p.id = (
         SELECT p2.id FROM photo p2
         WHERE p2.chambre_id = c.id
         ORDER BY p2.ordre ASC, p2.id ASC
         LIMIT 1
       )
     ORDER BY c.prix_base DESC`
  );
  return rows;
};

/**
 * Récupérer une chambre par son id
 */
export const getChambreById = async (id) => {
  const [rows] = await db.query(
    "SELECT * FROM chambre WHERE id = ?",
    [id]
  );
  return rows[0] || null;
};

/**
 * Récupérer les chambres DISPONIBLES sur une période [arrivee, depart[.
 * Principe : on prend toutes les chambres actives, SAUF celles déjà réservées
 * sur des dates qui chevauchent (hors réservations annulées).
 * Chevauchement : resa.date_arrivee < depart ET resa.date_depart > arrivee.
 */
export const getChambresDisponibles = async (arrivee, depart) => {
  const [rows] = await db.query(
    `SELECT * FROM chambre
     WHERE actif = TRUE
       AND id NOT IN (
         SELECT rc.chambre_id
         FROM reservation_chambre rc
         JOIN reservation r ON r.id = rc.reservation_id
         WHERE r.statut <> 'annulee'
           AND r.date_arrivee < ?
           AND r.date_depart  > ?
       )
     ORDER BY prix_base DESC`,
    [depart, arrivee]
  );
  return rows;
};

/**
 * Récupérer une chambre par son slug (pour l'URL /chambre/:slug).
 */
export const getChambreBySlug = async (slug) => {
  const [rows] = await db.query(
    "SELECT * FROM chambre WHERE slug = ?",
    [slug]
  );
  return rows[0] || null;
};

/**
 * Récupérer toutes les photos d'une chambre, triées par ordre d'affichage.
 */
export const getPhotosByChambreId = async (chambreId) => {
  const [rows] = await db.query(
    "SELECT id, url, alt FROM photo WHERE chambre_id = ? ORDER BY ordre ASC, id ASC",
    [chambreId]
  );
  return rows;
};

/**
 * Récupérer plusieurs chambres par leurs ids (utilisé par le calcul de réservation).
 * mysql2 sait étendre un tableau passé à "IN (?)".
 */
export const getChambresByIds = async (ids) => {
  const [rows] = await db.query(
    "SELECT * FROM chambre WHERE id IN (?)",
    [ids]
  );
  return rows;
};

/**
 * Créer une nouvelle chambre
 */
export const createChambre = async (data) => {
  const [result] = await db.query(
    `INSERT INTO chambre
     (nom, slug, capacite, surface_m2, prix_base, description, vue, terrasse, composition_lits, actif)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.nom,
      data.slug,
      data.capacite,
      data.surface_m2,
      data.prix_base,
      data.description,
      data.vue,
      data.terrasse,
      data.composition_lits,
      data.actif,
    ]
  );
  return result.insertId;
};

/**
 * Mettre à jour une chambre
 * Champs non modifiables : id, created_at
 */
export const updateChambreById = async (id, data) => {
  const [result] = await db.query(
    `UPDATE chambre
     SET nom = ?,
         slug = ?,
         capacite = ?,
         surface_m2 = ?,
         prix_base = ?,
         description = ?,
         vue = ?,
         terrasse = ?,
         composition_lits = ?,
         actif = ?
     WHERE id = ?`,
    [
      data.nom,
      data.slug,
      data.capacite,
      data.surface_m2,
      data.prix_base,
      data.description,
      data.vue,
      data.terrasse,
      data.composition_lits,
      data.actif,
      id,
    ]
  );
  return result.affectedRows > 0;
};

/**
 * Supprimer une chambre
 */
export const deleteChambreById = async (id) => {
  const [result] = await db.query(
    "DELETE FROM chambre WHERE id = ?",
    [id]
  );
  return result.affectedRows > 0;
};
