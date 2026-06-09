// Seo.jsx — métadonnées PAR PAGE, sans librairie.
// React 19 sait "remonter" automatiquement <title>, <meta> et <link> rendus
// dans un composant vers le <head> du document (et dédoublonne avec index.html).
//
// Usage :
//   <Seo title="Nos chambres" description="..." path="/hebergement" />
//   <Seo title="Réserver" noindex />   // page de tunnel : pas indexée
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION, OG_IMAGE } from "../../config/site";

function Seo({ title, description = SITE_DESCRIPTION, path = "", image = OG_IMAGE, noindex = false }) {
  // Titre complet : "Page — Imsouane Surf Paradise" (ou juste le site sur l'accueil).
  const fullTitle = title ? `${title} — ${SITE_NAME}` : SITE_NAME;
  const url = `${SITE_URL}${path}`;

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      {/* Pages de tunnel / admin : on demande aux moteurs de NE PAS indexer */}
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph (aperçus Facebook / WhatsApp / LinkedIn…) */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />

      {/* Twitter Card */}
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </>
  );
}

export default Seo;
