import * as ReservationModel from "../2_models/reservation.model.js";
import { getChambresByIds } from "../2_models/chambre.model.js";
import { getSaisons } from "../2_models/saison.model.js";
import { getPrestationsByIds } from "../2_models/prestation.model.js";
import { randomUUID } from "crypto";

/**
 * Coefficient saisonnier applicable à une nuit donnée.
 */

const getCoefficient = (date, saisons) => {
  const matches = saisons.filter(
    (s) => date >= new Date(s.date_debut) && date <= new Date(s.date_fin)
  );
  if (matches.length === 0) return 1;
  return Math.max(...matches.map((s) => Number(s.coefficient)));
};

/*
 * Sous-total d'une chambre sur tout le séjour, nuit par nuit.
 * Chaque nuit est facturée prix_base * coefficient de sa saison.
 */

const calcSousTotalChambre = (prixBase, dateArrivee, dateDepart, saisons) => {
  let total = 0;
  const jour = new Date(dateArrivee);
  const fin = new Date(dateDepart);

  while (jour < fin) {
    total += Number(prixBase) * getCoefficient(jour, saisons);
    jour.setDate(jour.getDate() + 1);
  }

  return Math.round(total * 100) / 100;
};

/**
 * Calcule le devis complet d'une réservation (prix saisonnier exact).
 * UTILISÉ PAR : l'estimation (affichage live) ET la création (POST réel).
 * -> une seule source de vérité pour le prix, jamais de divergence.
 *
 * Renvoie soit { erreur, statut } si données invalides, soit le détail calculé.
 * Ne touche PAS la base : c'est du pur calcul.
 */

const calculerDevis = async ({ date_arrivee, date_depart, chambres, prestations = [], nb_personnes }) => {
  // 1. Validation des dates
  const arrivee = new Date(date_arrivee);
  const depart = new Date(date_depart);
  const nbNuits = Math.round((depart - arrivee) / (1000 * 60 * 60 * 24));

  if (isNaN(arrivee) || isNaN(depart) || nbNuits < 1) {
    return { erreur: "Dates invalides (le départ doit être après l'arrivée).", statut: 400 };
  }

  // 2. Récupérer les chambres choisies + les saisons
  const chambresDB = await getChambresByIds(chambres);
  if (chambresDB.length !== chambres.length) {
    return { erreur: "Une ou plusieurs chambres sont introuvables.", statut: 400 };
  }

  // 2-bis. SÉCURITÉ capacité : la somme des capacités doit accueillir tous les
  // voyageurs. On ne fait jamais confiance au front (qui a déjà cette règle) :
  // on revérifie ici. nb_personnes est optionnel (l'estimation ne l'envoie pas
  // toujours) -> on ne contrôle que s'il est fourni.
  if (nb_personnes !== undefined) {
    const capaciteCumulee = chambresDB.reduce((somme, c) => somme + c.capacite, 0);
    if (capaciteCumulee < nb_personnes) {
      return {
        erreur: `Capacité insuffisante : ${capaciteCumulee} place(s) pour ${nb_personnes} voyageur(s).`,
        statut: 400,
      };
    }
  }

  const saisons = await getSaisons();

  // 3. Sous-total de chaque chambre (prix saisonnier, nuit par nuit)
  let montantTotal = 0;
  const lignesChambres = chambresDB.map((ch) => {
    const sousTotal = calcSousTotalChambre(ch.prix_base, date_arrivee, date_depart, saisons);
    montantTotal += sousTotal;
    return { chambre_id: ch.id, nom: ch.nom, nb_nuits: nbNuits, sous_total: sousTotal };
  });

  // Règle métier : 1 ménage par tranche de 7 jours.
  // Séjour >= 8 nuits (> 1 semaine) -> 1 ménage hebdomadaire INCLUS (gratuit).
  // Dans ce cas, le ménage n'est PAS proposé en option payante (extras sur place).
  const SEUIL_MENAGE_INCLUS = 8;
  const menageInclus = nbNuits >= SEUIL_MENAGE_INCLUS;

  // 4. Prestations (options)
  const lignesPrestations = [];
  if (prestations.length > 0) {
    const ids = prestations.map((p) => p.prestation_id);
    const prestationsDB = await getPrestationsByIds(ids);

    for (const p of prestations) {
      const presta = prestationsDB.find((x) => x.id === p.prestation_id);
      if (!presta) {
        return { erreur: "Une ou plusieurs prestations sont introuvables.", statut: 400 };
      }

      // Sécurité : si le séjour inclut déjà le ménage, on IGNORE toute ligne ménage
      // payante envoyée par le front (on ne facture jamais un ménage déjà inclus).
      if (presta.categorie === "menage" && menageInclus) {
        continue;
      }

      montantTotal += Number(presta.prix) * p.quantite;
      lignesPrestations.push({
        prestation_id: p.prestation_id,
        nom: presta.nom,
        quantite: p.quantite,
        prix_unitaire: presta.prix,
      });
    }
  }

  // 5. Totaux : total, acompte 30%, solde
  montantTotal = Math.round(montantTotal * 100) / 100;
  const montantAcompte = Math.round(montantTotal * 0.3 * 100) / 100;
  const montantSolde = Math.round((montantTotal - montantAcompte) * 100) / 100;

  return {
    nbNuits,
    lignesChambres,
    lignesPrestations,
    menage_inclus: menageInclus,   // le front affiche "Ménage inclus ✓" si vrai
    montant_total: montantTotal,
    montant_acompte: montantAcompte,
    montant_solde: montantSolde,
  };
};

// ---------------- ESTIMATION (prix live, sans enregistrer) ----------------
export const estimerReservation = async (req, res) => {
  try {
    const devis = await calculerDevis(req.body);
    if (devis.erreur) {
      return res.status(devis.statut).json({ message: devis.erreur });
    }
    // On renvoie le détail pour le récap (lignes + total + acompte + solde).
    res.json({
      nb_nuits: devis.nbNuits,
      chambres: devis.lignesChambres,
      prestations: devis.lignesPrestations,
      menage_inclus: devis.menage_inclus,
      montant_total: devis.montant_total,
      montant_acompte: devis.montant_acompte,
      montant_solde: devis.montant_solde,
    });
  } catch (err) {
    console.error("[estimerReservation]", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ---------------- CREATE ----------------
export const createReservation = async (req, res) => {
  try {
    const { client, date_arrivee, date_depart, nb_personnes } = req.body;

    // On réutilise EXACTEMENT le même calcul que l'estimation.
    const devis = await calculerDevis(req.body);
    if (devis.erreur) {
      return res.status(devis.statut).json({ message: devis.erreur });
    }

    // Token de suivi (lien email sans compte)
    const token = randomUUID();

    // Création en base (transaction + vérif dispo côté model)
    const data = {
      client,
      date_arrivee,
      date_depart,
      nb_personnes,
      montant_total: devis.montant_total,
      montant_acompte: devis.montant_acompte,
      token_suivi: token,
      chambres: devis.lignesChambres,
      prestations: devis.lignesPrestations,
    };

    const result = await ReservationModel.createReservation(data);

    res.status(201).json({
      success: true,
      message: "Réservation créée avec succès",
      reservation_id: result.reservationId,
      token_suivi: result.token_suivi,
      montant_total: devis.montant_total,
      montant_acompte: devis.montant_acompte,
    });
  } catch (err) {
    if (err.code === "CHAMBRE_INDISPONIBLE") {
      return res.status(409).json({
        message: `La chambre ${err.chambre_id} n'est pas disponible sur ces dates.`,
      });
    }
    console.error("[createReservation]", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ---------------- LISTE (back-office) ----------------
export const getReservations = async (req, res) => {
  try {
    const reservations = await ReservationModel.getReservations();
    res.json(reservations);
  } catch (err) {
    console.error("[getReservations]", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ---------------- DÉTAIL (back-office) ----------------
export const getReservation = async (req, res) => {
  try {
    const reservation = await ReservationModel.getReservationById(req.params.id);
    if (!reservation)
      return res.status(404).json({ message: "Réservation introuvable" });

    // Champ CALCULÉ (jamais stocké) : reste à régler = total - acompte.
    // Réservé au back-office (pas exposé dans le suivi client par token).
    reservation.reste_a_payer =
      Math.round(
        (Number(reservation.montant_total) - Number(reservation.montant_acompte)) * 100
      ) / 100;

    res.json(reservation);
  } catch (err) {
    console.error("[getReservation]", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ---------------- CHANGER LE STATUT (back-office) ----------------
export const updateStatut = async (req, res) => {
  try {
    const success = await ReservationModel.updateReservationStatut(
      req.params.id,
      req.body.statut
    );
    if (!success)
      return res.status(404).json({ message: "Réservation introuvable" });

    res.json({ message: "Statut mis à jour avec succès" });
  } catch (err) {
    console.error("[updateStatut]", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ---------------- SUIVI CLIENT (par token, sans compte) ----------------
export const getReservationByToken = async (req, res) => {
  try {
    const reservation = await ReservationModel.getReservationByToken(req.params.token);
    if (!reservation)
      return res.status(404).json({ message: "Réservation introuvable" });
    res.json(reservation);
  } catch (err) {
    console.error("[getReservationByToken]", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
