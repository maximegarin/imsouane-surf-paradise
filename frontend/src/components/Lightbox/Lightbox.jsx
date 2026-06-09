// Lightbox.jsx — modale carrousel photo (fond sombre semi-transparent).
// Ouverte au clic sur une photo. Navigation : flèches écran, clavier (← → Échap),
// clic sur le fond = fermer. Boucle infinie sur les images.
import { useEffect } from "react";
import styles from "./Lightbox.module.scss";

function Lightbox({ images, index, onClose, onIndex }) {
  const total = images.length;

  // navigation circulaire
  const precedent = () => onIndex((index - 1 + total) % total);
  const suivant = () => onIndex((index + 1) % total);

  // raccourcis clavier + blocage du scroll de fond pendant l'ouverture
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") precedent();
      if (e.key === "ArrowRight") suivant();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  });

  return (
    // clic sur le fond -> ferme
    <div className={styles.overlay} onClick={onClose}>
      <button className={styles.fermer} onClick={onClose} aria-label="Fermer">✕</button>

      <button
        className={`${styles.fleche} ${styles.gauche}`}
        onClick={(e) => { e.stopPropagation(); precedent(); }}
        aria-label="Photo précédente"
      >
        ‹
      </button>

      {/* clic sur l'image elle-même : ne ferme pas */}
      <img
        src={images[index]}
        alt=""
        className={styles.image}
        onClick={(e) => e.stopPropagation()}
      />

      <button
        className={`${styles.fleche} ${styles.droite}`}
        onClick={(e) => { e.stopPropagation(); suivant(); }}
        aria-label="Photo suivante"
      >
        ›
      </button>

      <span className={styles.compteur}>{index + 1} / {total}</span>
    </div>
  );
}

export default Lightbox;
