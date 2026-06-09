import db from "../1_config/db.js";

/**
 * Récupérer toutes les saisons (triées par date de début).
 */
export const getSaisons = async () => {
  const [rows] = await db.query("SELECT * FROM saison ORDER BY date_debut");
  return rows;
};

/**
 * Récupérer une saison par son id.
 */
export const getSaisonById = async (id) => {
  const [rows] = await db.query("SELECT * FROM saison WHERE id = ?", [id]);
  return rows[0] || null;
};

/**
 * Créer une saison.
 */
export const createSaison = async (data) => {
  const [result] = await db.query(
    "INSERT INTO saison (nom, date_debut, date_fin, coefficient) VALUES (?, ?, ?, ?)",
    [data.nom, data.date_debut, data.date_fin, data.coefficient]
  );
  return result.insertId;
};

/**
 * Mettre à jour une saison.
 */
export const updateSaisonById = async (id, data) => {
  const [result] = await db.query(
    "UPDATE saison SET nom = ?, date_debut = ?, date_fin = ?, coefficient = ? WHERE id = ?",
    [data.nom, data.date_debut, data.date_fin, data.coefficient, id]
  );
  return result.affectedRows > 0;
};

/**
 * Supprimer une saison.
 */
export const deleteSaisonById = async (id) => {
  const [result] = await db.query("DELETE FROM saison WHERE id = ?", [id]);
  return result.affectedRows > 0;
};
