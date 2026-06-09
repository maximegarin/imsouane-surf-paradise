// RecapSejour.jsx — récap sticky du séjour en cours, branché sur le contexte.
// Affiche : dates, chambres ajoutées, capacité cumulée, prix live (via /estimation),
// et le bouton "Continuer" (actif seulement si le séjour est valide).
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { useReservation } from "../../hooks/useReservation";
import styles from "./RecapSejour.module.scss";

function RecapSejour() {
  const {
    sejour, datesValides, nbVoyageurs, capaciteCumulee, sejourValide, retirerChambre,
  } = useReservation();
  const navigate = useNavigate();

  const [devis, setDevis] = useState(null);
  const [chargement, setChargement] = useState(false);

  // ids des chambres -> clé stable pour la dépendance du useEffect
  const idsChambres = sejour.chambres.map((c) => c.id).join(",");

  // Recalcule le prix dès que dates ou chambres changent.
  useEffect(() => {
    if (!datesValides || sejour.chambres.length === 0) {
      setDevis(null);
      return;
    }
    setChargement(true);
    api
      .post("/reservations/estimation", {
        date_arrivee: sejour.dateArrivee,
        date_depart: sejour.dateDepart,
        chambres: sejour.chambres.map((c) => c.id),
        prestations: [],   // les options seront ajoutées à l'étape coordonnées
      })
      .then((res) => setDevis(res.data))
      .catch(() => setDevis(null))
      .finally(() => setChargement(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sejour.dateArrivee, sejour.dateDepart, idsChambres, datesValides]);

  return (
    <aside className={styles.recap}>
      <h3 className={styles.titre}>Votre séjour</h3>

      {/* Dates */}
      {datesValides ? (
        <p className={styles.dates}>
          {sejour.dateArrivee} → {sejour.dateDepart}
        </p>
      ) : (
        <p className={styles.vide}>Choisissez vos dates pour commencer.</p>
      )}

      {/* Chambres ajoutées */}
      {sejour.chambres.length > 0 && (
        <ul className={styles.lignes}>
          {sejour.chambres.map((c) => (
            <li key={c.id} className={styles.ligne}>
              <span>{c.nom}</span>
              <button
                className={styles.retirer}
                onClick={() => retirerChambre(c.id)}
                aria-label={`Retirer ${c.nom}`}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Indicateur de capacité cumulée (jamais de masquage : on informe) */}
      {datesValides && sejour.chambres.length > 0 && (
        <p
          className={`${styles.capacite} ${
            capaciteCumulee >= nbVoyageurs ? styles.capaciteOk : styles.capaciteManque
          }`}
        >
          Capacité : {capaciteCumulee} / {nbVoyageurs} voyageur(s)
          {capaciteCumulee < nbVoyageurs && " — ajoutez des chambres"}
        </p>
      )}

      {/* Prix live */}
      {chargement && <p className={styles.vide}>Calcul du prix…</p>}
      {devis && !chargement && (
        <>
          <div className={styles.total}>
            <span>Total</span>
            <span>{devis.montant_total} €</span>
          </div>
          <div className={styles.paiement}>
            <div className={styles.lignePaiement}>
              <span className={styles.fort}>Acompte aujourd'hui (30 %)</span>
              <span className={styles.fort}>{devis.montant_acompte} €</span>
            </div>
            <div className={styles.lignePaiement}>
              <span>Solde sur place</span>
              <span>{devis.montant_solde} €</span>
            </div>
          </div>
        </>
      )}

      {/* Bouton Continuer : actif seulement si le séjour est valide */}
      <button
        className={styles.bouton}
        disabled={!sejourValide}
        onClick={() => navigate("/reservation")}
      >
        Continuer
      </button>
      {!sejourValide && datesValides && sejour.chambres.length > 0 && (
        <p className={styles.note}>
          {capaciteCumulee < nbVoyageurs
            ? "Capacité insuffisante pour le nombre de voyageurs."
            : "Complétez votre séjour pour continuer."}
        </p>
      )}
    </aside>
  );
}

export default RecapSejour;
