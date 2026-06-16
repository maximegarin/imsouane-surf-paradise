// Accueil.jsx — page d'accueil ÉDITORIALE (esprit Cereal : crème, photos nettes
// multi-formats posées comme un portfolio, beaucoup de vide, reveal au scroll).
// Images réelles servies depuis Cloudinary (voir la constante CLOUD ci-dessous).
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Reveal from "../../components/Reveal/Reveal";
import Lightbox from "../../components/Lightbox/Lightbox";
import Seo from "../../components/Seo/Seo";
import styles from "./Accueil.module.scss";

// ── Cloudinary ──────────────────────────────────────────────────────────────
// Toutes les images réelles sont hébergées sur Cloudinary. f_auto,q_auto =
// format (WebP/AVIF) + compression servis automatiquement selon le navigateur.
// Le cloud name vient du .env (VITE_CLOUDINARY_CLOUD) — pas secret (il apparaît
// dans chaque URL publique), mais gardé hors du code par cohérence avec
// VITE_API_URL. Repli "dsepfzneu" si la variable manque.
const CLOUD = import.meta.env.VITE_CLOUDINARY_CLOUD || "dsepfzneu";
const cld = (chemin) =>
  `https://res.cloudinary.com/${CLOUD}/image/upload/f_auto,q_auto/imsouane/${chemin}`;
const heroImg = (n) => cld(`hero/hero-${String(n).padStart(2, "0")}`);
const ambiance = (n) => cld(`ambiances/ambiance-${String(n).padStart(2, "0")}`);
const chambrePhoto = (slug, n = 1) =>
  cld(`chambres/${slug}/${slug}-${String(n).padStart(2, "0")}`);

// Carrousel hero — 4 slides (dossier imsouane/hero/). Crossfade auto lent.
const HERO_IMAGES = [heroImg(1), heroImg(2), heroImg(3), heroImg(4)];

// Visuels de l'accueil : slots "lieu"/"expérience" = photos d'ambiance ;
// slots "chambres" = vraies photos de chambre (cover).
const IMG = {
  lieuA: ambiance(2),               // petit-déjeuner marocain (repas partagés)
  lieu2: ambiance(4),               // terrasse mosaïque, vue baie
  lieu3: ambiance(8),               // terrasse oliviers
  ch1: chambrePhoto("lazulite"),    // teaser Lazulite
  ch2: chambrePhoto("tamsrite"),    // teaser Tamsrite
  ch3: chambrePhoto("mauringa-1"),  // teaser Mauringa
  experience: ambiance(1),          // la baie d'Imsouane (la longue vague)
};

// Photos d'ambiance du carrousel "Au fil des jours" : les 6 restantes,
// rythme alterné surf / calme.
const AMBIANCES = [
  ambiance(3),   // surfeur contre-jour
  ambiance(6),   // terrasse + arbre
  ambiance(5),   // longboarder
  ambiance(9),   // chambre vue mer
  ambiance(7),   // surfeur + rochers
  ambiance(10),  // patio
];

// Toutes les photos de l'accueil, dans l'ordre -> la lightbox navigue dessus.
const GALERIE = [
  IMG.lieuA, IMG.lieu2, IMG.lieu3, IMG.ch1, IMG.ch2, IMG.ch3, IMG.experience,
  ...AMBIANCES,
];

// Chambres mises en avant : le carrousel du bas affiche 1 card à la fois,
// et le texte descriptif à gauche change selon la card sélectionnée.
const CHAMBRES_APERCU = [
  {
    nom: "Tamsrite",
    slug: "tamsrite",
    tags: ["Jusqu'à 4 pers.", "Terrasse", "Vue spot"],
    desc: "Suite familiale face au spot. Un lit double, deux lits simples.",
    img: chambrePhoto("tamsrite"),
  },
  {
    nom: "Lazulite",
    slug: "lazulite",
    tags: ["2 pers.", "Vue mer", "Terrasse"],
    desc: "Un cocon lumineux, la mer pour seul horizon.",
    img: chambrePhoto("lazulite"),
  },
  {
    nom: "Mauringa",
    slug: "mauringa-1",
    tags: ["2 pers.", "Face océan", "Intime"],
    desc: "Simple et chaleureux, à deux pas des vagues.",
    img: chambrePhoto("mauringa-1"),
  },
  {
    nom: "Argana",
    slug: "argana-wooden-appartement",
    tags: ["Jusqu'à 5 pers.", "Appartement", "Cuisine"],
    desc: "Grand espace en bois, salon et cuisine pour les tribus.",
    img: chambrePhoto("argana-wooden-appartement"),
  },
];

// Photo cliquable : effet de survol (zoom + loupe) sur desktop, clic = ouvre la modale.
function PhotoZoom({ src, onOpen }) {
  return (
    <button type="button" className={styles.photoZoom} onClick={onOpen}>
      <img src={src} alt="" className={styles.img} />
      <span className={styles.loupe}>⤢</span>
    </button>
  );
}

function Accueil() {
  // index de la photo ouverte dans la lightbox (null = fermée)
  const [lbIndex, setLbIndex] = useState(null);
  // carrousel "chambres" du bas : index de la card affichée
  const [idxRefuge, setIdxRefuge] = useState(0);
  const nbRefuge = CHAMBRES_APERCU.length;
  const chambreActive = CHAMBRES_APERCU[idxRefuge];
  const refugePrec = () => setIdxRefuge((i) => (i - 1 + nbRefuge) % nbRefuge);
  const refugeSuiv = () => setIdxRefuge((i) => (i + 1) % nbRefuge);
  // carrousel "au fil des jours" : index de l'ambiance affichée
  const [idxAmbiance, setIdxAmbiance] = useState(0);
  const nbAmbiance = AMBIANCES.length;
  const ambiancePrec = () => setIdxAmbiance((i) => (i - 1 + nbAmbiance) % nbAmbiance);
  const ambianceSuiv = () => setIdxAmbiance((i) => (i + 1) % nbAmbiance);
  const total = HERO_IMAGES.length;
  // index courant : va de 0 à `total` (le dernier = CLONE de la 1ère image)
  const [indexHero, setIndexHero] = useState(0);
  // la piste a-t-elle une transition ? (on la coupe le temps du retour instantané)
  const [avecTransition, setAvecTransition] = useState(true);
  // volet d'intro : levé après l'arrivée du titre
  const [releve, setReleve] = useState(false);
  // intro terminée : on redescend le z-index du titre SOUS le header (anti-collision au scroll)
  const [introFini, setIntroFini] = useState(false);

  // F5 en milieu de page : le navigateur restaure la position de scroll par défaut.
  // On la désactive et on remonte tout en haut AVANT que l'intro (volet) ne se lance,
  // pour que l'animation parte bien du hero et non du milieu de page.
  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    window.scrollTo(0, 0);
  }, []);

  // défilement auto lent : on avance d'une image toutes les 9 secondes
  useEffect(() => {
    const t = setInterval(() => setIndexHero((i) => i + 1), 9000);
    return () => clearInterval(t);
  }, []);

  // quand la transition se termine SUR LE CLONE (index === total),
  // on revient à la vraie 1ère image (index 0) SANS animation -> illusion d'infini.
  const finTransition = () => {
    if (indexHero === total) {
      setAvecTransition(false);
      setIndexHero(0);
    }
  };

  // après le retour instantané, on réactive la transition pour la suite.
  useEffect(() => {
    if (!avecTransition) {
      const r = requestAnimationFrame(() => setAvecTransition(true));
      return () => cancelAnimationFrame(r);
    }
  }, [avecTransition]);

  // le volet se lève après que le titre soit arrivé (≈ 2,0 s)
  useEffect(() => {
    const t = setTimeout(() => setReleve(true), 2000);
    return () => clearTimeout(t);
  }, []);

  // une fois le volet levé (≈ 2,7 s), l'intro est finie -> z-index du titre redescend
  useEffect(() => {
    const t = setTimeout(() => setIntroFini(true), 2700);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className={styles.accueil}>
      <Seo
        path="/"
        description="Maison de famille face à l'océan à Imsouane, au Maroc. Surf à votre rythme, chambres et suites chaleureuses, réservation en ligne."
      />
      {/* ============ HERO (carrousel slide + volet d'intro intégré) ============ */}
      <section className={styles.hero}>
        {/* Carrousel : piste qui se décale vers la gauche (slide droite -> gauche).
            On ajoute un CLONE de la 1ère image à la fin pour la boucle infinie. */}
        <div className={styles.carrousel}>
          <div
            className={styles.track}
            style={{
              transform: `translateX(-${indexHero * 100}%)`,
              transition: avecTransition ? undefined : "none",
            }}
            onTransitionEnd={finTransition}
          >
            {[...HERO_IMAGES, HERO_IMAGES[0]].map((src, i) => (
              <div className={styles.slide} key={i}>
                <img src={src} alt="" className={styles.slideImg} />
              </div>
            ))}
          </div>
        </div>

        <div className={styles.heroDegrade} />

        {/* Le titre (UNIQUE) : au-dessus du volet, ancré à gauche, glisse de la gauche.
            Après l'intro, son z-index redescend pour passer SOUS le header au scroll. */}
        <div className={`${styles.heroContenu} ${introFini ? styles.heroContenuFini : ""}`}>
          <h1 className={styles.heroTitre}>Imsouane Surf Paradise</h1>
          <p className={styles.heroSlogan}>Une maison de famille qui surfe.</p>
        </div>

        {/* Le VOLET sombre : couvre tout, puis se lève DERRIÈRE le titre */}
        <div className={`${styles.volet} ${releve ? styles.voletReleve : ""}`} />

        {/* Bas de hero : "défiler" (centré) + dots de pagination (à droite, même ligne) */}
        <span className={styles.heroScroll}>défiler ↓</span>
        <div className={styles.dots}>
          {HERO_IMAGES.map((_, i) => (
            <button
              key={i}
              // dot actif = index modulo total -> sur le clone (index===total),
              // c'est le PREMIER dot qui est actif (revient à gauche).
              className={`${styles.dot} ${i === indexHero % total ? styles.dotActif : ""}`}
              onClick={() => setIndexHero(i)}
              aria-label={`Voir l'image ${i + 1}`}
            />
          ))}
        </div>
      </section>

      {/* ============ LE LIEU — composition asymétrique ============ */}
      <section className={styles.section}>
        <Reveal>
          <span className={styles.surTitre}>Le lieu</span>
        </Reveal>

        <div className={styles.lieu}>
          {/* Rangée 1 : texte intro (étroit, gauche) + grande photo paysage (droite, décalée bas) */}
          <div className={styles.lieuRangee1}>
            <Reveal className={styles.lieuTexte}>
              <h2 className={styles.titre}>Face à l'océan, le temps ralentit</h2>
              <p className={styles.paragraphe}>
                À Imsouane, là où la plus longue vague du Maroc déroule paisiblement,
                notre maison ouvre ses portes comme on accueille des proches.
              </p>
            </Reveal>

            <Reveal delai={120} className={styles.lieuPaysage}>
              <PhotoZoom src={IMG.lieu2} onOpen={() => setLbIndex(1)} />
            </Reveal>
          </div>

          {/* Rangée 2 : photo portrait (gauche, remontée -> profondeur) + texte (droite) */}
          <div className={styles.lieuRangee2}>
            <Reveal className={styles.lieuPortrait}>
              <PhotoZoom src={IMG.lieuA} onOpen={() => setLbIndex(0)} />
            </Reveal>

            <Reveal delai={120} className={styles.lieuTexte2}>
              <p className={styles.paragraphe}>
                Murs à la chaux, terrasses baignées de lumière, et le bruit de l'océan
                en fond. Pas de musique forte ni de cocktails à la chaîne — juste le
                rythme du surf, des repas partagés, et le silence quand il le faut.
              </p>
            </Reveal>
          </div>

          {/* Rangée 3 : légende à gauche + photo "épinglée" (portrait, légèrement inclinée) */}
          <div className={styles.lieuRangee3}>
            <Reveal className={styles.lieuLegende}>
              <p className={styles.lieuCitation}>
                «&nbsp;On vient pour les vagues, on reste pour le calme.&nbsp;»
              </p>
            </Reveal>

            <Reveal delai={120} className={styles.lieuEpingle}>
              <PhotoZoom src={IMG.lieu3} onOpen={() => setLbIndex(2)} />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============ CHAMBRES — galerie portfolio multi-formats ============ */}
      <section className={styles.section}>
        <Reveal>
          <span className={styles.surTitre}>Nos chambres</span>
          <h2 className={styles.titre}>Sept refuges, chacun son caractère</h2>
        </Reveal>

        <div className={styles.galerie}>
          <Reveal className={`${styles.galItem} ${styles.galPortrait}`}>
            <PhotoZoom src={IMG.ch1} onOpen={() => setLbIndex(3)} />
            <span className={styles.legende}>Lazulite — vue mer, terrasse</span>
          </Reveal>

          <Reveal delai={150} className={`${styles.galItem} ${styles.galPaysage}`}>
            <PhotoZoom src={IMG.ch2} onOpen={() => setLbIndex(4)} />
            <span className={styles.legende}>Tamsrite — face au spot de surf</span>
          </Reveal>

          <Reveal delai={300} className={`${styles.galItem} ${styles.galCarre}`}>
            <PhotoZoom src={IMG.ch3} onOpen={() => setLbIndex(5)} />
            <span className={styles.legende}>Mauringa — cocon pour deux</span>
          </Reveal>
        </div>

        <Reveal delai={200}>
          <Link to="/hebergement" className={styles.lienTexte}>
            Voir tous les hébergements →
          </Link>
        </Reveal>
      </section>

      {/* ============ AU FIL DES JOURS — carrousel d'ambiances (flèches + dots, esprit DA) ============ */}
      <section className={styles.ambiances}>
        <Reveal className={styles.ambiancesEntete}>
          <span className={styles.surTitre}>Au fil des jours</span>
        </Reveal>

        <Reveal delai={120} className={styles.ambiancesScene}>
          {/* key -> rejoue le fondu à chaque changement de photo */}
          <div key={idxAmbiance} className={styles.ambiancesFond}>
            <PhotoZoom
              src={AMBIANCES[idxAmbiance]}
              onOpen={() => setLbIndex(7 + idxAmbiance)}
            />
          </div>
        </Reveal>

        <div className={styles.ambiancesNav}>
          <button
            type="button"
            className={styles.ambiancesFleche}
            onClick={ambiancePrec}
            aria-label="Photo précédente"
          >
            ‹
          </button>
          <div className={styles.ambiancesDots}>
            {AMBIANCES.map((_, i) => (
              <button
                key={i}
                type="button"
                className={`${styles.ambiancesDot} ${i === idxAmbiance ? styles.ambiancesDotActif : ""}`}
                onClick={() => setIdxAmbiance(i)}
                aria-label={`Ambiance ${i + 1}`}
              />
            ))}
          </div>
          <button
            type="button"
            className={styles.ambiancesFleche}
            onClick={ambianceSuiv}
            aria-label="Photo suivante"
          >
            ›
          </button>
        </div>
      </section>

      {/* ============ EXPÉRIENCE — gros titre + photo, puis 2 colonnes (esprit Waaz) ============ */}
      <section className={styles.experience}>
        {/* Haut : surtitre + grand titre (gauche) + photo de surf (droite) */}
        <div className={styles.experienceHaut}>
          <Reveal className={styles.experienceTitreWrap}>
            <span className={styles.surTitre}>L'expérience</span>
            <h2 className={styles.experienceTitre}>Le surf,<br />à votre rythme</h2>
          </Reveal>

          <Reveal delai={120} className={styles.experienceImgWrap}>
            <PhotoZoom src={IMG.experience} onOpen={() => setLbIndex(6)} />
          </Reveal>
        </div>

        {/* Bas : deux colonnes de texte */}
        <div className={styles.experienceBas}>
          <Reveal className={styles.experienceCol}>
            <p className={styles.paragraphe}>
              Ici, pas de niveau à prouver. Que vous vous leviez sur une planche pour la
              première fois ou que vous traquiez la vague parfaite depuis des années,
              l'océan accueille chacun à sa mesure. On vous prête une planche, on vous
              montre le line-up, et on vous laisse trouver votre tempo.
            </p>
          </Reveal>

          <Reveal delai={150} className={styles.experienceCol}>
            <p className={styles.paragraphe}>
              La plus longue vague droite du Maroc déroule à quelques pas de la maison.
              Le matin pour les sessions au calme, l'après-midi pour les longues glisses
              dorées. Et quand la houle se repose, il reste la terrasse, le thé à la
              menthe et le bruit des vagues au loin.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ============ TROUVER SA CHAMBRE — texte (change) + carrousel 1 card ============ */}
      <section className={styles.refuge}>
        {/* Colonne gauche : titre + description qui CHANGENT selon la card active */}
        <Reveal className={styles.refugeTexte}>
          <span className={styles.surTitre}>Où poserez-vous vos valises&nbsp;?</span>

          {/* Bloc à hauteur réservée -> le contenu change mais le CTA dessous ne bouge pas */}
          <div className={styles.refugeInfos}>
            <h2 className={`${styles.titre} ${styles.refugeNom}`} key={chambreActive.nom}>
              {chambreActive.nom}
            </h2>
            <ul className={styles.refugeTags} key={`tags-${chambreActive.nom}`}>
              {chambreActive.tags.map((t) => (
                <li key={t} className={styles.refugeTag}>{t}</li>
              ))}
            </ul>
            <p className={`${styles.paragraphe} ${styles.refugeDesc}`} key={chambreActive.desc}>
              {chambreActive.desc}
            </p>
            <Link
              to={`/chambre/${chambreActive.slug}`}
              className={styles.lienTexte}
              key={`lien-${chambreActive.slug}`}
            >
              Plus d'informations →
            </Link>
          </div>

          {/* Navigation : flèches + petits points (style Waaz, discrets) */}
          <div className={styles.refugeNav}>
            <button
              type="button"
              className={styles.refugeFleche}
              onClick={refugePrec}
              aria-label="Chambre précédente"
            >
              ‹
            </button>
            <div className={styles.refugeDots}>
              {CHAMBRES_APERCU.map((c, i) => (
                <button
                  key={c.nom}
                  type="button"
                  className={`${styles.refugeDot} ${i === idxRefuge ? styles.refugeDotActif : ""}`}
                  onClick={() => setIdxRefuge(i)}
                  aria-label={c.nom}
                />
              ))}
            </div>
            <button
              type="button"
              className={styles.refugeFleche}
              onClick={refugeSuiv}
              aria-label="Chambre suivante"
            >
              ›
            </button>
          </div>

          <Link to="/reservation" className={styles.bouton}>
            Réserver votre séjour
          </Link>
        </Reveal>

        {/* Colonne droite : la card chambre active (1 à la fois), fondu au changement */}
        <Reveal delai={120} className={styles.refugeVisuel}>
          <img
            key={idxRefuge}
            src={chambreActive.img}
            alt={`Chambre ${chambreActive.nom}`}
            className={`${styles.img} ${styles.refugeImg}`}
          />
        </Reveal>
      </section>

      {/* Modale carrousel : ouverte au clic sur une photo */}
      {lbIndex !== null && (
        <Lightbox
          images={GALERIE}
          index={lbIndex}
          onIndex={setLbIndex}
          onClose={() => setLbIndex(null)}
        />
      )}
    </div>
  );
}

export default Accueil;
