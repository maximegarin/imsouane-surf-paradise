import * as ChambreModel from "../2_models/chambre.model.js";

export const getChambres = async (req, res) => {
  try {
    const chambres = await ChambreModel.getChambres();
    res.json(chambres);
  } catch (err) {
    console.error("[getChambres]", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const getChambre = async (req, res) => {
  try {
    const chambre = await ChambreModel.getChambreById(req.params.id);
    if (!chambre) return res.status(404).json({ message: "Chambre introuvable" });
    res.json(chambre);
  } catch (err) {
    console.error("[getChambre]", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const getChambresDisponibles = async (req, res) => {
  try {
    const { arrivee, depart } = req.query;
    if (!arrivee || !depart) {
      return res.status(400).json({ message: "Dates d'arrivée et de départ requises." });
    }
    const chambres = await ChambreModel.getChambresDisponibles(arrivee, depart);
    res.json(chambres);
  } catch (err) {
    console.error("[getChambresDisponibles]", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const getChambreParSlug = async (req, res) => {
  try {
    const chambre = await ChambreModel.getChambreBySlug(req.params.slug);
    if (!chambre) return res.status(404).json({ message: "Chambre introuvable" });
    // on joint les photos de la chambre (galerie de la page détail)
    chambre.photos = await ChambreModel.getPhotosByChambreId(chambre.id);
    res.json(chambre);
  } catch (err) {
    console.error("[getChambreParSlug]", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const createChambre = async (req, res) => {
  try {
    const data = {
      nom: req.body.nom,
      slug: req.body.slug,
      capacite: req.body.capacite,
      surface_m2: req.body.surface_m2 || null,
      prix_base: req.body.prix_base,
      description: req.body.description || null,
      vue: req.body.vue || null,
      terrasse: req.body.terrasse === true,
      composition_lits: req.body.composition_lits || null,
      actif: req.body.actif === undefined ? true : req.body.actif,
    };

    const insertId = await ChambreModel.createChambre(data);
    res.status(201).json({ message: "Chambre créée avec succès", id: insertId });
  } catch (err) {
    // slug en doublon (UNIQUE) -> conflit
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Ce slug est déjà utilisé, choisis-en un autre." });
    }
    console.error("[createChambre]", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const updateChambre = async (req, res) => {
  try {
    const data = {
      nom: req.body.nom,
      slug: req.body.slug,
      capacite: req.body.capacite,
      surface_m2: req.body.surface_m2 || null,
      prix_base: req.body.prix_base,
      description: req.body.description || null,
      vue: req.body.vue || null,
      terrasse: req.body.terrasse === true,
      composition_lits: req.body.composition_lits || null,
      actif: req.body.actif === undefined ? true : req.body.actif,
    };

    const success = await ChambreModel.updateChambreById(req.params.id, data);
    if (!success) return res.status(404).json({ message: "Chambre introuvable" });

    res.json({ message: "Chambre mise à jour avec succès" });
  } catch (err) {
    // slug en doublon (UNIQUE) -> conflit
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Ce slug est déjà utilisé, choisis-en un autre." });
    }
    console.error("[updateChambre]", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const deleteChambre = async (req, res) => {
  try {
    const success = await ChambreModel.deleteChambreById(req.params.id);
    if (!success) return res.status(404).json({ message: "Chambre introuvable" });

    res.json({ message: "Chambre supprimée avec succès" });
  } catch (err) {
    // FK : une chambre liée à des réservations ne peut pas être supprimée.
    if (err.code === "ER_ROW_IS_REFERENCED_2") {
      return res.status(409).json({
        message:
          "Impossible de supprimer : des réservations sont liées à cette chambre. Désactivez-la plutôt (actif = false).",
      });
    }
    console.error("[deleteChambre]", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
