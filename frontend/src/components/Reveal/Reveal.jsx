// Reveal.jsx — enveloppe un contenu et le fait apparaître en douceur au scroll.
// Évite de répéter la logique ref/visible dans chaque section.
//   <Reveal><h2>...</h2></Reveal>
//   <Reveal delai={150}>...</Reveal>   // léger décalage (cascade)
import { useRevealAuScroll } from "../../hooks/useRevealAuScroll";
import styles from "./Reveal.module.scss";

function Reveal({ children, delai = 0, className = "" }) {
  const [ref, visible] = useRevealAuScroll();

  return (
    <div
      ref={ref}
      className={`${styles.reveal} ${visible ? styles.visible : ""} ${className}`}
      style={{ transitionDelay: `${delai}ms` }}
    >
      {children}
    </div>
  );
}

export default Reveal;
