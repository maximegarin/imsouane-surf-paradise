// Header.jsx — navigation. Menu en ligne sur desktop, burger sur mobile.
import { useState } from "react";
import { NavLink } from "react-router-dom";
import styles from "./Header.module.scss";

function Header() {
  const [ouvert, setOuvert] = useState(false); // menu mobile ouvert ?

  const lienClasse = ({ isActive }) =>
    isActive ? `${styles.lien} ${styles.actif}` : styles.lien;

  const fermer = () => setOuvert(false); // refermer après un clic sur un lien

  return (
    <header className={styles.header}>
      <NavLink to="/" className={styles.logo} onClick={fermer}>
        Imsouane Surf
      </NavLink>

      {/* Bouton burger : visible seulement en mobile (via le SCSS) */}
      <button
        className={styles.burger}
        onClick={() => setOuvert((o) => !o)}
        aria-label={ouvert ? "Fermer le menu" : "Ouvrir le menu"}
        aria-expanded={ouvert}
      >
        <span className={`${styles.barre} ${ouvert ? styles.barre1Ouvert : ""}`} />
        <span className={`${styles.barre} ${ouvert ? styles.barre2Ouvert : ""}`} />
        <span className={`${styles.barre} ${ouvert ? styles.barre3Ouvert : ""}`} />
      </button>

      {/* Navigation : en ligne sur desktop, panneau déroulant sur mobile */}
      <nav className={`${styles.nav} ${ouvert ? styles.navOuverte : ""}`}>
        <NavLink to="/" className={lienClasse} end onClick={fermer}>
          Accueil
        </NavLink>
        <NavLink to="/hebergement" className={lienClasse} onClick={fermer}>
          Nos chambres
        </NavLink>
        <NavLink to="/reservation" className={lienClasse} onClick={fermer}>
          Réserver
        </NavLink>
      </nav>
    </header>
  );
}

export default Header;
