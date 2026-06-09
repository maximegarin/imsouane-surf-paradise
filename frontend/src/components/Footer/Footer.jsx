// Footer.jsx — pied de page, affiché sur toutes les pages (layout global).
import { Link } from "react-router-dom";
import styles from "./Footer.module.scss";

function Footer() {
  const annee = new Date().getFullYear();   // année courante, automatique

  return (
    <footer className={styles.footer}>
      <div className={styles.contenu}>
        {/* Colonne 1 : identité du lieu */}
        <div className={styles.bloc}>
          <h3 className={styles.nom}>Imsouane Surf Paradise</h3>
          <p className={styles.baseline}>
            Une maison de famille face à l'océan, à Imsouane, Maroc.
          </p>
        </div>

        {/* Colonne 2 : navigation */}
        <nav className={styles.bloc}>
          <h4 className={styles.titreCol}>Explorer</h4>
          <Link to="/" className={styles.lien}>Accueil</Link>
          <Link to="/hebergement" className={styles.lien}>Hébergement</Link>
          <Link to="/reservation" className={styles.lien}>Réserver</Link>
        </nav>

        {/* Colonne 3 : contact */}
        <div className={styles.bloc}>
          <h4 className={styles.titreCol}>Contact</h4>
          <p className={styles.info}>Imsouane, région d'Agadir, Maroc</p>
          <a href="mailto:contact@imsouane-surf-paradise.com" className={styles.lien}>
            contact@imsouane-surf-paradise.com
          </a>
        </div>
      </div>

      <div className={styles.bas}>
        <p>© {annee} Imsouane Surf Paradise — Tous droits réservés.</p>
      </div>
    </footer>
  );
}

export default Footer;
