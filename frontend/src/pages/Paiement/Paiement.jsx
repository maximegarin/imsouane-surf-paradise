// Paiement.jsx — étape de paiement de l'acompte (SIMULÉE).
// Flux : on "initie" l'acompte côté API (crée une ligne paiement en_attente),
// on affiche un faux formulaire carte, et au clic "Payer" on "confirme" le paiement
// (ce qui simule le webhook Stripe : paiement réussi + statut résa mis à jour).
// Puis on redirige vers la page de confirmation via le token.
//
// ⚠️ Mode simulé : AUCUN vrai paiement, aucune vraie carte. Voir docs/paiement-simule.md
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import Seo from "../../components/Seo/Seo";
import styles from "./Paiement.module.scss";

function Paiement() {
  // L'URL contient l'id de réservation + le token de suivi.
  const { reservationId, token } = useParams();
  const navigate = useNavigate();

  // États du composant
  const [paiement, setPaiement] = useState(null);   // { paiement_id, montant, ... }
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [paiementEnCours, setPaiementEnCours] = useState(false);

  // 1. À l'arrivée : on INITIE l'acompte (équivalent : créer un PaymentIntent Stripe).
  //    L'API relit le montant EN BASE (jamais le front) et renvoie une référence.
  useEffect(() => {
    api
      .post(`/paiements/acompte/${reservationId}`)
      .then((res) => setPaiement(res.data))
      .catch(() => setErreur("Impossible d'initialiser le paiement."))
      .finally(() => setChargement(false));
  }, [reservationId]);

  // 2. Au clic "Payer" : on CONFIRME le paiement (simule le webhook Stripe).
  const payer = async (e) => {
    e.preventDefault();
    setPaiementEnCours(true);
    setErreur(null);
    try {
      await api.post(`/paiements/${paiement.paiement_id}/confirmer`);
      // Paiement "réussi" -> on rejoint la confirmation via le token.
      navigate(`/reservation/confirmation/${token}`);
    } catch {
      setErreur("Le paiement a échoué. Merci de réessayer.");
      setPaiementEnCours(false);
    }
  };

  if (chargement) return <p className={styles.message}>Préparation du paiement…</p>;
  if (erreur && !paiement) return <p className={styles.message}>{erreur}</p>;

  return (
    <section className={styles.paiement}>
      <Seo title="Paiement" noindex />
      <h1 className={styles.titre}>Paiement de l'acompte</h1>

      {/* Bandeau honnête : on est en mode démonstration */}
      <div className={styles.bandeauDemo}>
        Mode démonstration — aucun paiement réel n'est effectué.
        Utilisez n'importe quelles valeurs ci-dessous.
      </div>

      <div className={styles.montant}>
        <span>Montant à régler aujourd'hui</span>
        <strong>{paiement.montant} €</strong>
      </div>

      {/* Faux formulaire de carte (purement visuel, rien n'est envoyé à une banque) */}
      <form className={styles.carte} onSubmit={payer}>
        <label className={styles.label}>
          Numéro de carte
          <input className={styles.input} placeholder="4242 4242 4242 4242" />
        </label>
        <div className={styles.ligne}>
          <label className={styles.label}>
            Expiration
            <input className={styles.input} placeholder="12 / 28" />
          </label>
          <label className={styles.label}>
            CVC
            <input className={styles.input} placeholder="123" />
          </label>
        </div>

        {erreur && <p className={styles.erreur}>{erreur}</p>}

        <button type="submit" className={styles.bouton} disabled={paiementEnCours}>
          {paiementEnCours ? "Paiement en cours…" : `Payer ${paiement.montant} €`}
        </button>
      </form>

      <p className={styles.note}>
        Le solde sera réglé sur place. Paiement sécurisé (simulation).
      </p>
    </section>
  );
}

export default Paiement;
