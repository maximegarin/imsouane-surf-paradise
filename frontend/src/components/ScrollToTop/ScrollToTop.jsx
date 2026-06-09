// ScrollToTop.jsx — remet la page en haut à chaque changement d'URL.
// React Router conserve la position de scroll lors d'une navigation interne :
// ce composant écoute le pathname et fait remonter en haut quand il change.
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]); // se relance uniquement quand l'URL (le chemin) change

  return null; // composant purement comportemental, n'affiche rien
}

export default ScrollToTop;
