// Hebergement.jsx — charge les chambres depuis l'API et les affiche.
import { useState, useEffect } from "react";
import api from "../../api/axios";
import ChambreCard from "../../components/ChambreCard/ChambreCard";
import SelecteurSejour from "../../components/SelecteurSejour/SelecteurSejour";
import RecapSejour from "../../components/RecapSejour/RecapSejour";
import Seo from "../../components/Seo/Seo";
import { useReservation } from "../../hooks/useReservation";
import styles from "./Hebergement.module.scss";

function Hebergement() {
  // 3 morceaux d'état : les données, le chargement, l'erreur éventuelle.
  const [chambres, setChambres] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);

  // TEST étape 2 : ouverture du drawer sélecteur de séjour
  const [drawerOuvert, setDrawerOuvert] = useState(false);
  const { sejour, datesValides, nbVoyageurs } = useReservation();

  // useEffect avec [] : s'exécute UNE fois, au montage de la page.
  useEffect(() => {
    api
      .get("/chambres")                       // appel à l'API Express
      .then((res) => setChambres(res.data))   // succès -> on stocke les chambres
      .catch(() => setErreur("Impossible de charger les hébergements."))
      .finally(() => setChargement(false));   // dans tous les cas, on arrête le "chargement"
  }, []);

  return (
    <section className={styles.hebergement}>
      <Seo
        title="Nos chambres"
        path="/hebergement"
        description="Sept chambres et suites face à l'océan à Imsouane : vues mer, terrasses, appartements. Choisissez votre refuge et réservez en ligne."
      />
      <h1 className={styles.titre}>Nos chambres</h1>
      <p className={styles.intro}>
        Sept chambres &amp; suites, chacune avec son caractère, face à l'océan.
      </p>

      {/* Barre de recherche du séjour */}
      <div className={styles.barreSejour}>
        <button className={styles.boutonSejour} onClick={() => setDrawerOuvert(true)}>
          {datesValides
            ? `${sejour.dateArrivee} → ${sejour.dateDepart} · ${nbVoyageurs} voyageur(s)`
            : "Choisir mes dates et voyageurs"}
        </button>
      </div>

      <SelecteurSejour ouvert={drawerOuvert} onFermer={() => setDrawerOuvert(false)} />

      {/* État 1 : chargement en cours */}
      {chargement && <p className={styles.message}>Chargement…</p>}

      {/* État 2 : une erreur est survenue */}
      {erreur && <p className={styles.message}>{erreur}</p>}

      {/* État 3 : les données -> grille de chambres (gauche) + récap (droite) */}
      {!chargement && !erreur && (
        <div className={styles.colonnes}>
          <div className={styles.grille}>
            {chambres.map((chambre) => (
              <ChambreCard
                key={chambre.id}
                chambre={chambre}
                onDemanderDates={() => setDrawerOuvert(true)}
              />
            ))}
          </div>

          <RecapSejour />
        </div>
      )}
    </section>
  );
}

export default Hebergement;
