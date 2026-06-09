// useRevealAuScroll.js — révèle un élément en douceur quand il entre dans l'écran.
// Utilise l'Intersection Observer (API native du navigateur, pas de lib lourde).
// Renvoie une "ref" à poser sur l'élément + un booléen "visible".
//
// Usage :
//   const [ref, visible] = useRevealAuScroll();
//   <section ref={ref} className={visible ? styles.visible : styles.cache}>
import { useState, useEffect, useRef } from "react";

export function useRevealAuScroll(options = {}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // L'observer surveille si l'élément entre dans le viewport.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(element); // une fois révélé, on arrête d'observer
        }
      },
      // threshold 0.15 = se déclenche quand 15% de l'élément est visible
      { threshold: 0.15, ...options }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [options]);

  return [ref, visible];
}
