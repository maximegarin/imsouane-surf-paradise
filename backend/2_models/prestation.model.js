import db from "../1_config/db.js";

/**
 * Récupérer toutes les prestations.
 */
export const getPrestations = async () => {
  const [rows] = await db.query("SELECT * FROM prestation ORDER BY nom");
  return rows;
};

/**
 * Récupérer une prestation par son id.
 */
export const getPrestationById = async (id) => {
  const [rows] = await db.query("SELECT * FROM prestation WHERE id = ?", [id]);
  return rows[0] || null;
};

/**
 * Récupérer plusieurs prestations par leurs ids (utilisé par le calcul de réservation).
 * mysql2 sait étendre un tableau passé à "IN (?)".
 */
export const getPrestationsByIds = async (ids) => {
  const [rows] = await db.query("SELECT * FROM prestation WHERE id IN (?)", [ids]);
  return rows;
};

/**
 * Créer une prestation.
 */
export const createPrestation = async (data) => {
  const [result] = await db.query(
    "INSERT INTO prestation (nom, description, prix, categorie, actif) VALUES (?, ?, ?, ?, ?)",
    [data.nom, data.description, data.prix, data.categorie, data.actif]
  );
  return result.insertId;
};

/**
 * Mettre à jour une prestation.
 */
export const updatePrestationById = async (id, data) => {
  const [result] = await db.query(
    "UPDATE prestation SET nom = ?, description = ?, prix = ?, categorie = ?, actif = ? WHERE id = ?",
    [data.nom, data.description, data.prix, data.categorie, data.actif, id]
  );
  return result.affectedRows > 0;
};

/**
 * Supprimer une prestation.
 */
export const deletePrestationById = async (id) => {
  const [result] = await db.query("DELETE FROM prestation WHERE id = ?", [id]);
  return result.affectedRows > 0;
};
