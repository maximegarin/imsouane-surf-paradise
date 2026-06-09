import * as SaisonModel from "../2_models/saison.model.js";

export const getSaisons = async (req, res) => {
  try {
    const saisons = await SaisonModel.getSaisons();
    res.json(saisons);
  } catch (err) {
    console.error("[getSaisons]", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const getSaison = async (req, res) => {
  try {
    const saison = await SaisonModel.getSaisonById(req.params.id);
    if (!saison) return res.status(404).json({ message: "Saison introuvable" });
    res.json(saison);
  } catch (err) {
    console.error("[getSaison]", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const createSaison = async (req, res) => {
  try {
    const data = {
      nom: req.body.nom,
      date_debut: req.body.date_debut,
      date_fin: req.body.date_fin,
      coefficient: req.body.coefficient,
    };
    const id = await SaisonModel.createSaison(data);
    res.status(201).json({ message: "Saison créée avec succès", id });
  } catch (err) {
    console.error("[createSaison]", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const updateSaison = async (req, res) => {
  try {
    const data = {
      nom: req.body.nom,
      date_debut: req.body.date_debut,
      date_fin: req.body.date_fin,
      coefficient: req.body.coefficient,
    };
    const success = await SaisonModel.updateSaisonById(req.params.id, data);
    if (!success) return res.status(404).json({ message: "Saison introuvable" });
    res.json({ message: "Saison mise à jour avec succès" });
  } catch (err) {
    console.error("[updateSaison]", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const deleteSaison = async (req, res) => {
  try {
    const success = await SaisonModel.deleteSaisonById(req.params.id);
    if (!success) return res.status(404).json({ message: "Saison introuvable" });
    res.json({ message: "Saison supprimée avec succès" });
  } catch (err) {
    console.error("[deleteSaison]", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
