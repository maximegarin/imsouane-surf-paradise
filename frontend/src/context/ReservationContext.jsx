// =============================================================================
//  ReservationContext.jsx — l'état du SÉJOUR EN COURS, partagé par toute l'app.
//  (Même principe que AuthContext : une donnée globale lisible/modifiable partout,
//   sans "prop drilling".)
//
//  Porte : dates, voyageurs (adultes/enfants), chambres sélectionnées, options.
//  Expose : des fonctions pour modifier + des valeurs dérivées (capacité, validité).
//  Persistance : on garde le séjour dans localStorage pour survivre à un refresh.
// =============================================================================
import { createContext, useState, useEffect } from "react";

export const ReservationContext = createContext(null);

// Clé de stockage local (pour ne pas perdre le séjour au rafraîchissement).
const CLE_STOCKAGE = "sejour_en_cours";

export function ReservationProvider({ children }) {
  // État initial : relu depuis localStorage si présent, sinon valeurs par défaut.
  const [sejour, setSejour] = useState(() => {
    const stocke = localStorage.getItem(CLE_STOCKAGE);
    if (stocke) return JSON.parse(stocke);
    return {
      dateArrivee: "",
      dateDepart: "",
      adultes: 2,
      enfants: 0,
      chambres: [],   // tableau d'objets chambre complets (id, nom, capacite, prix_base…)
      options: {},    // { [prestationId]: quantite } pour les options NON-ménage
      menageParChambre: [], // ids de chambres avec ménage
    };
  });

  // À chaque changement du séjour : on le sauvegarde dans localStorage.
  useEffect(() => {
    localStorage.setItem(CLE_STOCKAGE, JSON.stringify(sejour));
  }, [sejour]);

  // --- Helpers de mise à jour (on modifie une partie sans écraser le reste) ---
  const setDates = (dateArrivee, dateDepart) =>
    setSejour((s) => ({ ...s, dateArrivee, dateDepart }));

  const setVoyageurs = (adultes, enfants) =>
    setSejour((s) => ({ ...s, adultes, enfants }));

  // Ajouter une chambre (objet complet) si pas déjà présente.
  const ajouterChambre = (chambre) =>
    setSejour((s) =>
      s.chambres.some((c) => c.id === chambre.id)
        ? s
        : { ...s, chambres: [...s.chambres, chambre] }
    );

  // Retirer une chambre (et son ménage éventuel, pour rester cohérent).
  const retirerChambre = (chambreId) =>
    setSejour((s) => ({
      ...s,
      chambres: s.chambres.filter((c) => c.id !== chambreId),
      menageParChambre: s.menageParChambre.filter((id) => id !== chambreId),
    }));

  const estDansSejour = (chambreId) =>
    sejour.chambres.some((c) => c.id === chambreId);

  // Vider entièrement le séjour (après réservation confirmée, ou reset manuel).
  const viderSejour = () =>
    setSejour({
      dateArrivee: "", dateDepart: "", adultes: 2, enfants: 0,
      chambres: [], options: {}, menageParChambre: [],
    });

  // --- Valeurs DÉRIVÉES (calculées à partir de l'état) ---
  const nbVoyageurs = sejour.adultes + sejour.enfants;

  // Capacité cumulée des chambres choisies (multi-chambres : on additionne).
  const capaciteCumulee = sejour.chambres.reduce((somme, c) => somme + c.capacite, 0);

  // Dates valides ? (les deux remplies + départ après arrivée)
  const datesValides =
    sejour.dateArrivee &&
    sejour.dateDepart &&
    new Date(sejour.dateDepart) > new Date(sejour.dateArrivee);

  // Le séjour peut-il passer à l'étape suivante ?
  // -> dates valides + au moins 1 chambre + capacité suffisante + au moins 1 adulte.
  const sejourValide =
    datesValides &&
    sejour.chambres.length > 0 &&
    capaciteCumulee >= nbVoyageurs &&
    sejour.adultes >= 1;

  return (
    <ReservationContext.Provider
      value={{
        sejour,
        setDates,
        setVoyageurs,
        ajouterChambre,
        retirerChambre,
        estDansSejour,
        viderSejour,
        setSejour,
        // dérivées
        nbVoyageurs,
        capaciteCumulee,
        datesValides,
        sejourValide,
      }}
    >
      {children}
    </ReservationContext.Provider>
  );
}
