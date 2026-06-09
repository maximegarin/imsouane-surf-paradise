// Dashboard.jsx — tableau de bord admin : liste des réservations + actions.
import { useState, useEffect } from "react";
import api from "../../../api/axios";
import { useAuth } from "../../../hooks/useAuth";
import Seo from "../../../components/Seo/Seo";
import styles from "./Dashboard.module.scss";

// libellés lisibles pour les statuts
const STATUTS = {
  en_attente: "En attente",
  acompte_paye: "Acompte payé",
  soldee: "Soldée",
  annulee: "Annulée",
};

function Dashboard() {
  const { admin, logout } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);

  // Charge les réservations (appel PROTÉGÉ : le token est envoyé par axios).
  const chargerReservations = () => {
    api
      .get("/reservations")
      .then((res) => setReservations(res.data))
      .catch(() => setErreur("Impossible de charger les réservations."))
      .finally(() => setChargement(false));
  };

  useEffect(() => {
    chargerReservations();
  }, []);

  // Changer le statut d'une réservation, puis recharger la liste.
  const changerStatut = async (id, statut) => {
    try {
      await api.patch(`/reservations/${id}/statut`, { statut });
      chargerReservations();
    } catch {
      setErreur("Impossible de mettre à jour le statut.");
    }
  };

  return (
    <section className={styles.dashboard}>
      <Seo title="Tableau de bord" noindex />
      <div className={styles.entete}>
        <div>
          <h1 className={styles.titre}>Réservations</h1>
          <p className={styles.sousTitre}>
            Connecté : {admin.email} ({admin.role})
          </p>
        </div>
        <button className={styles.deconnexion} onClick={logout}>
          Se déconnecter
        </button>
      </div>

      {chargement && <p className={styles.message}>Chargement…</p>}
      {erreur && <p className={styles.message}>{erreur}</p>}

      {!chargement && !erreur && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>Client</th>
                <th>Arrivée</th>
                <th>Départ</th>
                <th>Pers.</th>
                <th>Total</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((r) => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>
                    {r.client_prenom} {r.client_nom}
                    <br />
                    <span className={styles.email}>{r.client_email}</span>
                  </td>
                  <td>{r.date_arrivee?.slice(0, 10)}</td>
                  <td>{r.date_depart?.slice(0, 10)}</td>
                  <td>{r.nb_personnes}</td>
                  <td>{r.montant_total} €</td>
                  <td>
                    <span className={`${styles.badge} ${styles[r.statut]}`}>
                      {STATUTS[r.statut] || r.statut}
                    </span>
                  </td>
                  <td className={styles.actions}>
                    <button onClick={() => changerStatut(r.id, "acompte_paye")}>
                      Acompte
                    </button>
                    <button onClick={() => changerStatut(r.id, "soldee")}>
                      Soldée
                    </button>
                    <button onClick={() => changerStatut(r.id, "annulee")}>
                      Annuler
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default Dashboard;
