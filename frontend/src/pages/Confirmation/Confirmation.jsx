// Confirmation.jsx — page de confirmation chaleureuse après réservation.
// Récupère la réservation via son token (lien public, sans compte).
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../api/axios";
import { useReservation } from "../../hooks/useReservation";
import Seo from "../../components/Seo/Seo";
import styles from "./Confirmation.module.scss";

function Confirmation() {
  const { token } = useParams();
  const { viderSejour } = useReservation();
  const [resa, setResa] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);

  useEffect(() => {
    api
      .get(`/reservations/suivi/${token}`)
      .then((res) => setResa(res.data))
      .catch(() => setErreur("Réservation introuvable."))
      .finally(() => setChargement(false));
  }, [token]);

  // Parcours terminé : on vide le séjour en cours (le "panier"). Fait ICI, et pas
  // à la soumission, pour éviter de déclencher le garde-fou de la page /reservation.
  useEffect(() => {
    viderSejour();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (chargement) return <p className={styles.message}>Chargement…</p>;
  if (erreur) return <p className={styles.message}>{erreur}</p>;

  return (
    <section className={styles.confirmation}>
      <Seo title="Réservation confirmée" noindex />
      <p className={styles.salut}>🌊</p>
      <h1 className={styles.titre}>On a hâte de vous accueillir, {resa.client_prenom} !</h1>
      <p className={styles.intro}>
        Votre réservation est bien enregistrée. Un récapitulatif vous a été envoyé par email.
      </p>

      <div className={styles.carte}>
        <div className={styles.ligne}>
          <span>Arrivée</span>
          <span>{resa.date_arrivee?.slice(0, 10)}</span>
        </div>
        <div className={styles.ligne}>
          <span>Départ</span>
          <span>{resa.date_depart?.slice(0, 10)}</span>
        </div>
        <div className={styles.ligne}>
          <span>Chambres</span>
          <span>{resa.chambres?.map((c) => c.chambre_nom).join(", ")}</span>
        </div>
        <div className={styles.ligneTotal}>
          <span>Total du séjour</span>
          <span>{resa.montant_total} €</span>
        </div>
        <div className={styles.ligneAcompte}>
          <span>Acompte payé ✓ (30 %)</span>
          <span>{resa.montant_acompte} €</span>
        </div>
        <div className={styles.ligne}>
          <span>Solde à régler sur place</span>
          <span>
            {(Number(resa.montant_total) - Number(resa.montant_acompte)).toFixed(2)} €
          </span>
        </div>
      </div>

      <p className={styles.note}>
        Conservez ce lien pour suivre votre réservation à tout moment. Le solde se
        règle directement sur place à votre arrivée.
      </p>

      <Link to="/" className={styles.bouton}>
        Retour à l'accueil
      </Link>
    </section>
  );
}

export default Confirmation;
