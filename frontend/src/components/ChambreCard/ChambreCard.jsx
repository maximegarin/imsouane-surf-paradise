// ChambreCard.jsx — carte d'une chambre, façon Airbnb : photo de couverture
// arrondie en haut, puis nom + prix, caractéristiques, et un BOUTON ADAPTATIF
// qui gère l'ajout au séjour selon l'état du contexte (dates ? déjà ajoutée ?).
import { Link } from "react-router-dom";
import { useReservation } from "../../hooks/useReservation";
import styles from "./ChambreCard.module.scss";

// image de secours si une chambre n'a pas (encore) de photo en base
const FALLBACK =
  "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=70";

function ChambreCard({ chambre, onDemanderDates }) {
  const { datesValides, estDansSejour, ajouterChambre, retirerChambre } = useReservation();
  const ajoutee = estDansSejour(chambre.id);

  // Gère le clic sur le bouton selon l'état (sans suivre le <Link> de la carte).
  const handleBouton = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!datesValides) {
      onDemanderDates();
    } else if (ajoutee) {
      retirerChambre(chambre.id);
    } else {
      ajouterChambre(chambre);
    }
  };

  // Libellé du bouton selon l'état.
  let libelle = "Réserver";
  if (datesValides) libelle = ajoutee ? "✓ Ajouté à votre séjour" : "Ajouter au séjour";

  // Ligne de caractéristiques (on n'affiche que ce qui existe).
  const meta = [
    `${chambre.capacite} voyageur${chambre.capacite > 1 ? "s" : ""}`,
    chambre.surface_m2 ? `${chambre.surface_m2} m²` : null,
    chambre.vue ? `vue ${chambre.vue}` : null,
  ].filter(Boolean);

  return (
    <Link to={`/chambre/${chambre.slug}`} className={styles.card}>
      {/* Média : photo de couverture arrondie, zoom léger au survol */}
      <div className={styles.media}>
        <img
          src={chambre.photo_url || FALLBACK}
          alt={chambre.photo_alt || chambre.nom}
          className={styles.photo}
          loading="lazy"
        />
        {chambre.terrasse ? <span className={styles.badge}>Terrasse</span> : null}
      </div>

      {/* Corps */}
      <div className={styles.corps}>
        <div className={styles.ligneTitre}>
          <h3 className={styles.nom}>{chambre.nom}</h3>
          <span className={styles.prix}>
            <span className={styles.prixLabel}>À partir de</span>
            <span className={styles.prixValeur}>
              <strong>{chambre.prix_base} €</strong> / nuit
            </span>
          </span>
        </div>

        <p className={styles.meta}>{meta.join(" · ")}</p>

        {chambre.composition_lits && (
          <p className={styles.lits}>{chambre.composition_lits}</p>
        )}

        {/* Actions collées en bas -> alignées sur toutes les cards d'une ligne */}
        <div className={styles.actions}>
          {/* span (pas <a>) : la card EST déjà un <Link>, on évite l'imbrication */}
          <span className={styles.lienInfos}>Plus d'informations →</span>

          <button
            type="button"
            className={`${styles.bouton} ${ajoutee ? styles.boutonAjoute : ""}`}
            onClick={handleBouton}
          >
            {libelle}
          </button>
        </div>
      </div>
    </Link>
  );
}

export default ChambreCard;
