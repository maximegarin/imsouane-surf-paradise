// Intro.jsx — volet d'introduction (esprit Studio Waaz, lenteur "surf").
// Fond sombre + nom de la maison qui apparaît doucement, puis le volet se LÈVE
// pour révéler le site. Joué une fois par session (pas à chaque navigation).
import { useState, useEffect } from "react";
import styles from "./Intro.module.scss";

function Intro() {
  // Note : l'intro se rejoue à CHAQUE chargement (pas de verrou sessionStorage
  // pour l'instant, le temps de valider la DA). On pourra le remettre ensuite.
  const [actif, setActif] = useState(true);
  const [sort, setSort] = useState(false); // déclenche l'animation de sortie

  useEffect(() => {
    if (!actif) return;
    // empêche le scroll pendant l'intro
    document.body.style.overflow = "hidden";

    // après un temps de pause (lenteur), on lance la sortie
    const t1 = setTimeout(() => setSort(true), 2600);
    // puis on retire complètement le volet une fois l'animation finie
    const t2 = setTimeout(() => {
      setActif(false);
      document.body.style.overflow = "";
    }, 3800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      document.body.style.overflow = "";
    };
  }, [actif]);

  if (!actif) return null;

  return (
    <div className={styles.volet}>
      {/* le FOND sombre se lève ; le titre, lui, ne bouge pas */}
      <div className={`${styles.fond} ${sort ? styles.fondSort : ""}`} />
      {/* le titre arrive par la gauche puis RESTE en place (ni fondu ni mouvement) */}
      <h1 className={styles.nom}>Imsouane Surf Paradise</h1>
    </div>
  );
}

export default Intro;
