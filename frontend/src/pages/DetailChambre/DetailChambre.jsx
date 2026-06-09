// DetailChambre.jsx — page d'une chambre, identifiée par son slug dans l'URL.
// Mise en page façon Airbnb : galerie photo (ouvre une lightbox), colonne
// descriptive + caractéristiques à gauche, carte de réservation sticky à droite.
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../api/axios";
import SelecteurSejour from "../../components/SelecteurSejour/SelecteurSejour";
import Lightbox from "../../components/Lightbox/Lightbox";
import Seo from "../../components/Seo/Seo";
import { SITE_URL, SITE_NAME } from "../../config/site";
import { useReservation } from "../../hooks/useReservation";
import styles from "./DetailChambre.module.scss";

// image de secours si la chambre n'a pas (encore) de photo en base
const FALLBACK =
  "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1600&q=70";

function DetailChambre() {
  // useParams lit la partie variable de l'URL : /chambre/:slug
  const { slug } = useParams();

  const [chambre, setChambre] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [drawerOuvert, setDrawerOuvert] = useState(false);
  const [lbIndex, setLbIndex] = useState(null); // photo ouverte en lightbox (null = fermée)
  const [indexPhoto, setIndexPhoto] = useState(0); // photo affichée dans le carrousel

  const { datesValides, estDansSejour, ajouterChambre, retirerChambre } = useReservation();

  // On recharge si le slug change (navigation d'une chambre à une autre).
  useEffect(() => {
    setChargement(true);
    setErreur(null);
    setIndexPhoto(0); // on revient à la 1ère photo quand on change de chambre
    api
      .get(`/chambres/slug/${slug}`)
      .then((res) => setChambre(res.data))
      .catch(() => setErreur("Cette chambre est introuvable."))
      .finally(() => setChargement(false));
  }, [slug]);

  if (chargement) return <p className={styles.message}>Chargement…</p>;
  if (erreur) return <p className={styles.message}>{erreur}</p>;

  // Photos pour la galerie + la lightbox (fallback si aucune en base).
  const photos = chambre.photos && chambre.photos.length ? chambre.photos : [{ url: FALLBACK, alt: chambre.nom }];
  const images = photos.map((p) => p.url);

  // Caractéristiques affichées (on ne montre que ce qui existe).
  const caracs = [
    { label: "Capacité", valeur: `${chambre.capacite} voyageur${chambre.capacite > 1 ? "s" : ""}` },
    chambre.surface_m2 ? { label: "Surface", valeur: `${chambre.surface_m2} m²` } : null,
    chambre.vue ? { label: "Vue", valeur: chambre.vue } : null,
    chambre.terrasse ? { label: "Terrasse", valeur: "Oui" } : null,
    chambre.composition_lits ? { label: "Couchage", valeur: chambre.composition_lits } : null,
  ].filter(Boolean);

  // Bouton de réservation adaptatif.
  const ajoutee = estDansSejour(chambre.id);
  const handleClic = () => {
    if (!datesValides) setDrawerOuvert(true);
    else if (ajoutee) retirerChambre(chambre.id);
    else ajouterChambre(chambre);
  };
  let libelle = "Réserver";
  if (datesValides) libelle = ajoutee ? "✓ Ajouté à votre séjour" : "Ajouter au séjour";

  // Données structurées schema.org de la chambre (résultats enrichis Google).
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HotelRoom",
    name: chambre.nom,
    description: chambre.description || undefined,
    image: images[0],
    url: `${SITE_URL}/chambre/${slug}`,
    occupancy: { "@type": "QuantitativeValue", maxValue: chambre.capacite },
    containedInPlace: { "@type": "LodgingBusiness", name: SITE_NAME },
    offers: {
      "@type": "Offer",
      price: chambre.prix_base,
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <article className={styles.detail}>
      <Seo
        title={chambre.nom}
        path={`/chambre/${slug}`}
        description={chambre.description || `${chambre.nom} à Imsouane Surf Paradise.`}
        image={images[0]}
      />
      {/* JSON-LD propre à la chambre (peut vivre dans le body, les crawlers le lisent) */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <Link to="/hebergement" className={styles.retour}>
        ← Toutes les chambres
      </Link>

      <header className={styles.entete}>
        <h1 className={styles.nom}>{chambre.nom}</h1>
        <p className={styles.infos}>{caracs.map((c) => c.valeur).join(" · ")}</p>
      </header>

      {/* Carrousel : une photo à la fois, flèches + dots. Clic sur la photo -> lightbox. */}
      <div className={styles.carrousel}>
        <button
          type="button"
          className={styles.photoPrincipale}
          onClick={() => setLbIndex(indexPhoto)}
        >
          <img
            src={photos[indexPhoto].url}
            alt={photos[indexPhoto].alt || chambre.nom}
            className={styles.img}
          />
        </button>

        {photos.length > 1 && (
          <>
            <button
              type="button"
              className={`${styles.fleche} ${styles.flecheGauche}`}
              onClick={() => setIndexPhoto((i) => (i - 1 + photos.length) % photos.length)}
              aria-label="Photo précédente"
            >
              ‹
            </button>
            <button
              type="button"
              className={`${styles.fleche} ${styles.flecheDroite}`}
              onClick={() => setIndexPhoto((i) => (i + 1) % photos.length)}
              aria-label="Photo suivante"
            >
              ›
            </button>
          </>
        )}

        {photos.length > 1 && (
          <div className={styles.dots}>
            {photos.map((p, i) => (
              <button
                key={p.id ?? i}
                type="button"
                className={`${styles.dot} ${i === indexPhoto ? styles.dotActif : ""}`}
                onClick={() => setIndexPhoto(i)}
                aria-label={`Photo ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Deux colonnes : contenu (gauche) + carte de réservation sticky (droite) */}
      <div className={styles.colonnes}>
        <div className={styles.contenu}>
          {chambre.description && (
            <p className={styles.description}>{chambre.description}</p>
          )}

          <section className={styles.caracs}>
            <h2 className={styles.sousTitre}>Cette chambre</h2>
            <ul className={styles.caracsListe}>
              {caracs.map((c) => (
                <li key={c.label} className={styles.caracItem}>
                  <span className={styles.caracLabel}>{c.label}</span>
                  <span className={styles.caracValeur}>{c.valeur}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className={styles.carteResa}>
          <p className={styles.prix}>
            <span className={styles.prixLabel}>À partir de</span>
            <strong>{chambre.prix_base} €</strong> <span className={styles.prixUnite}>/ nuit</span>
          </p>

          <button
            type="button"
            className={`${styles.bouton} ${ajoutee ? styles.boutonAjoute : ""}`}
            onClick={handleClic}
          >
            {libelle}
          </button>

          <p className={styles.note}>
            {datesValides
              ? "Ajoutez cette chambre à votre séjour, le prix s'ajuste aux dates."
              : "Choisissez vos dates pour voir le prix total de votre séjour."}
          </p>

          {ajoutee && (
            <p className={styles.lienResa}>
              <Link to="/reservation">Voir ma réservation →</Link>
            </p>
          )}
        </aside>
      </div>

      <SelecteurSejour ouvert={drawerOuvert} onFermer={() => setDrawerOuvert(false)} />

      {/* Lightbox : ouverte au clic sur une photo */}
      {lbIndex !== null && (
        <Lightbox
          images={images}
          index={lbIndex}
          onIndex={setLbIndex}
          onClose={() => setLbIndex(null)}
        />
      )}
    </article>
  );
}

export default DetailChambre;
