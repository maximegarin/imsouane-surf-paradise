// SelecteurSejour.jsx — drawer (panneau latéral) pour saisir dates + voyageurs.
// Écrit dans le ReservationContext. S'ouvre/se ferme via la prop `ouvert`/`onFermer`.
import { useState, useEffect } from "react";
import { DayPicker } from "react-day-picker";
import { fr } from "date-fns/locale";
import "react-day-picker/dist/style.css";   // styles de base de la lib (on surcharge ensuite)
import { useReservation } from "../../hooks/useReservation";
import styles from "./SelecteurSejour.module.scss";

function SelecteurSejour({ ouvert, onFermer }) {
  const { sejour, setDates, setVoyageurs, viderSejour } = useReservation();

  // État LOCAL du formulaire (on ne valide dans le contexte qu'au clic "Valider").
  // On initialise depuis le contexte si des valeurs existent déjà.
  const [plage, setPlage] = useState({
    from: sejour.dateArrivee ? new Date(sejour.dateArrivee) : undefined,
    to: sejour.dateDepart ? new Date(sejour.dateDepart) : undefined,
  });
  const [adultes, setAdultes] = useState(sejour.adultes);
  const [enfants, setEnfants] = useState(sejour.enfants);

  // À CHAQUE ouverture du drawer, on re-synchronise le formulaire local depuis
  // le contexte. (useState ne lit sa valeur initiale qu'au 1er montage ; sans cet
  // effet, rouvrir le drawer afficherait des valeurs périmées.)
  useEffect(() => {
    if (ouvert) {
      setPlage({
        from: sejour.dateArrivee ? new Date(sejour.dateArrivee) : undefined,
        to: sejour.dateDepart ? new Date(sejour.dateDepart) : undefined,
      });
      setAdultes(sejour.adultes);
      setEnfants(sejour.enfants);
    }
  }, [ouvert]);

  // Convertit une Date en chaîne AAAA-MM-JJ (format attendu par l'API/le contexte).
  const versISO = (date) => {
    const d = new Date(date);
    // on neutralise le décalage horaire pour ne pas perdre un jour
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
  };

  const valider = () => {
    if (plage?.from && plage?.to) {
      setDates(versISO(plage.from), versISO(plage.to));
    }
    setVoyageurs(adultes, enfants);
    onFermer();
  };

  // Réinitialise TOUT (option A) : le formulaire local ET le séjour validé
  // (dates + voyageurs + chambres). On vide aussi le contexte car les chambres
  // dépendent des dates -> on repart d'une page blanche, sans incohérence.
  const reinitialiser = () => {
    setPlage({ from: undefined, to: undefined });
    setAdultes(2);
    setEnfants(0);
    viderSejour();
  };

  // Si le drawer est fermé, on n'affiche rien.
  if (!ouvert) return null;

  return (
    // overlay sombre : un clic dessus ferme le drawer
    <div className={styles.overlay} onClick={onFermer}>
      {/* panneau : stopPropagation pour qu'un clic DANS le panneau ne ferme pas */}
      <aside className={styles.panneau} onClick={(e) => e.stopPropagation()}>
        <div className={styles.entete}>
          <h2 className={styles.titre}>Sélectionnez votre séjour</h2>
          <button className={styles.fermer} onClick={onFermer} aria-label="Fermer">
            ✕
          </button>
        </div>

        {/* --- Calendrier (sélection de plage) --- */}
        <div className={styles.bloc}>
          <h3 className={styles.sousTitre}>Dates</h3>
          <DayPicker
            mode="range"
            numberOfMonths={1}
            locale={fr}
            selected={plage}
            onSelect={setPlage}
            disabled={{ before: new Date() }}   // pas de dates passées
          />
        </div>

        {/* --- Voyageurs --- */}
        <div className={styles.bloc}>
          <h3 className={styles.sousTitre}>Voyageurs</h3>

          <div className={styles.ligneVoyageurs}>
            <div>
              <span className={styles.voyageurNom}>Adultes</span>
              <span className={styles.voyageurAge}>18 ans et +</span>
            </div>
            <div className={styles.compteur}>
              <button onClick={() => setAdultes((n) => Math.max(1, n - 1))} disabled={adultes <= 1}>
                −
              </button>
              <span>{adultes}</span>
              <button onClick={() => setAdultes((n) => n + 1)}>+</button>
            </div>
          </div>

          <div className={styles.ligneVoyageurs}>
            <div>
              <span className={styles.voyageurNom}>Enfants</span>
              <span className={styles.voyageurAge}>0 - 17 ans</span>
            </div>
            <div className={styles.compteur}>
              <button onClick={() => setEnfants((n) => Math.max(0, n - 1))} disabled={enfants <= 0}>
                −
              </button>
              <span>{enfants}</span>
              <button onClick={() => setEnfants((n) => n + 1)}>+</button>
            </div>
          </div>
        </div>

        <div className={styles.actions}>
          <button className={styles.reinit} onClick={reinitialiser}>
            Réinitialiser
          </button>
          <button className={styles.valider} onClick={valider}>
            Valider
          </button>
        </div>
      </aside>
    </div>
  );
}

export default SelecteurSejour;
