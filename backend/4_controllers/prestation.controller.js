import * as PrestationModel from "../2_models/prestation.model.js";

export const getPrestations = async (req, res) => {
  try {
    const prestations = await PrestationModel.getPrestations();
    res.json(prestations);
  } catch (err) {
    console.error("[getPrestations]", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const getPrestation = async (req, res) => {
  try {
    const prestation = await PrestationModel.getPrestationById(req.params.id);
    if (!prestation) return res.status(404).json({ message: "Prestation introuvable" });
    res.json(prestation);
  } catch (err) {
    console.error("[getPrestation]", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const createPrestation = async (req, res) => {
  try {
    const data = {
      nom: req.body.nom,
      description: req.body.description || null,
      prix: req.body.prix,
      categorie: req.body.categorie,
      actif: req.body.actif === undefined ? true : req.body.actif,
    };
    const id = await PrestationModel.createPrestation(data);
    res.status(201).json({ message: "Prestation créée avec succès", id });
  } catch (err) {
    console.error("[createPrestation]", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const updatePrestation = async (req, res) => {
  try {
    const data = {
      nom: req.body.nom,
      description: req.body.description || null,
      prix: req.body.prix,
      categorie: req.body.categorie,
      actif: req.body.actif === undefined ? true : req.body.actif,
    };
    const success = await PrestationModel.updatePrestationById(req.params.id, data);
    if (!success) return res.status(404).json({ message: "Prestation introuvable" });
    res.json({ message: "Prestation mise à jour avec succès" });
  } catch (err) {
    console.error("[updatePrestation]", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const deletePrestation = async (req, res) => {
  try {
    const success = await PrestationModel.deletePrestationById(req.params.id);
    if (!success) return res.status(404).json({ message: "Prestation introuvable" });
    res.json({ message: "Prestation supprimée avec succès" });
  } catch (err) {
    // FK : une prestation utilisée par des réservations ne peut pas être supprimée.
    if (err.code === "ER_ROW_IS_REFERENCED_2") {
      return res.status(409).json({
        message:
          "Impossible de supprimer : des réservations utilisent cette prestation. Désactivez-la plutôt (actif = false).",
      });
    }
    console.error("[deletePrestation]", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
