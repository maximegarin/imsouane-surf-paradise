// Reservation.jsx — ÉTAPE FINALE du parcours (le séjour est déjà composé ailleurs).
// Lit le ReservationContext (dates + chambres). Ici on ne modifie PLUS les dates/chambres :
// on ajoute les options, on saisit les coordonnées, et on confirme.
// Pour changer dates/chambres -> retour explicite vers /hebergement.
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import Seo from "../../components/Seo/Seo";
import { useReservation } from "../../hooks/useReservation";
import styles from "./Reservation.module.scss";

function Reservation() {
  const navigate = useNavigate();
  const {
    sejour, datesValides, nbVoyageurs, viderSejour,
  } = useReservation();

  // Garde-fou : si le séjour est vide/incomplet, on renvoie vers les hébergements.
  useEffect(() => {
    if (!datesValides || sejour.chambres.length === 0) {
      navigate("/hebergement", { replace: true });
    }
  }, [datesValides, sejour.chambres.length, navigate]);

  // --- Prestations disponibles (API) ---
  const [prestations, setPrestations] = useState([]);
  useEffect(() => {
    api.get("/prestations").then((res) => setPrestations(res.data)).catch(() => {});
  }, []);

  const prestationMenage = prestations.find((p) => p.categorie === "menage");
  const packsSurf = prestations.filter((p) => p.categorie === "pack_surf");

  // Le ménage est-il inclus ? (séjour >= 8 nuits) — calculé localement pour l'affichage,
  // mais c'est le BACK qui fait foi sur le prix (il ignore tout ménage payant si inclus).
  const nbNuits = datesValides
    ? Math.round(
        (new Date(sejour.dateDepart) - new Date(sejour.dateArrivee)) / 86400000
      )
    : 0;
  const menageInclus = nbNuits >= 8;

  // --- Options choisies (état local de cette étape) ---
  const [menageParChambre, setMenageParChambre] = useState([]); // ids chambres avec ménage payant
  const [packsChoisis, setPacksChoisis] = useState({});         // { [packId]: quantite }

  const basculerMenage = (chambreId) =>
    setMenageParChambre((m) =>
      m.includes(chambreId) ? m.filter((x) => x !== chambreId) : [...m, chambreId]
    );

  const changerPack = (packId, quantite) =>
    setPacksChoisis((prev) => {
      const copie = { ...prev };
      if (quantite <= 0) delete copie[packId];
      else copie[packId] = Math.min(quantite, nbVoyageurs); // plafonné au nb de voyageurs
      return copie;
    });

  // --- Consolidation des prestations pour le devis/la création ---
  const prestationsPourDevis = [];
  if (prestationMenage && !menageInclus && menageParChambre.length > 0) {
    prestationsPourDevis.push({
      prestation_id: prestationMenage.id,
      quantite: menageParChambre.length,
    });
  }
  Object.entries(packsChoisis).forEach(([id, q]) =>
    prestationsPourDevis.push({ prestation_id: Number(id), quantite: q })
  );

  // --- Devis live (recalcul à chaque changement d'option) ---
  const [devis, setDevis] = useState(null);
  const prestationsKey = JSON.stringify(prestationsPourDevis);
  useEffect(() => {
    if (!datesValides || sejour.chambres.length === 0) return;
    api
      .post("/reservations/estimation", {
        date_arrivee: sejour.dateArrivee,
        date_depart: sejour.dateDepart,
        chambres: sejour.chambres.map((c) => c.id),
        prestations: prestationsPourDevis,
      })
      .then((res) => setDevis(res.data))
      .catch(() => setDevis(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prestationsKey, sejour.dateArrivee, sejour.dateDepart]);

  // --- Coordonnées + soumission ---
  const [client, setClient] = useState({
    nom: "", prenom: "", email: "", telephone: "", consentement_marketing: false,
  });
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [erreurEnvoi, setErreurEnvoi] = useState(null);

  // Toutes les coordonnées sont obligatoires : prénom, nom, email (format), téléphone.
  const coordonneesCompletes =
    client.prenom.trim() !== "" &&
    client.nom.trim() !== "" &&
    /\S+@\S+\.\S+/.test(client.email) &&
    client.telephone.trim() !== "";

  // Champs "touchés" (quittés par l'utilisateur) -> on n'affiche le rouge
  // qu'après que le champ a été visité, pas dès l'arrivée sur la page.
  const [touches, setTouches] = useState({});
  const marquerTouche = (champ) => setTouches((t) => ({ ...t, [champ]: true }));

  // Un champ est "en erreur" s'il a été touché ET qu'il est invalide.
  const enErreur = (champ) => {
    if (!touches[champ]) return false;
    if (champ === "email") return !/\S+@\S+\.\S+/.test(client.email);
    return client[champ].trim() === "";
  };

  // classe d'input : ajoute le style erreur si le champ est invalide+touché
  const classeInput = (champ) =>
    `${styles.input} ${enErreur(champ) ? styles.inputErreur : ""}`;

  // message d'erreur affiché sous un champ invalide+touché
  const MESSAGES_ERREUR = {
    prenom: "Un prénom est requis.",
    nom: "Un nom est requis.",
    email: "Une adresse email valide est requise.",
    telephone: "Un numéro de téléphone est requis.",
  };

  const soumettre = async (e) => {
    e.preventDefault();
    setErreurEnvoi(null);
    setEnvoiEnCours(true);
    try {
      const res = await api.post("/reservations", {
        client,
        date_arrivee: sejour.dateArrivee,
        date_depart: sejour.dateDepart,
        nb_personnes: nbVoyageurs,
        chambres: sejour.chambres.map((c) => c.id),
        prestations: prestationsPourDevis,
      });
      // NOTE : on ne vide PAS le séjour ici. Si on le faisait, le garde-fou de
      // cette page (séjour vide -> /hebergement) se déclencherait et court-circuiterait
      // la navigation. Le séjour est vidé sur la page de CONFIRMATION (fin du parcours).
      navigate(
        `/reservation/paiement/${res.data.reservation_id}/${res.data.token_suivi}`
      );
    } catch (err) {
      if (err.response?.status === 409) {
        setErreurEnvoi(
          "Une chambre vient d'être réservée par quelqu'un d'autre. Revenez modifier votre séjour."
        );
      } else {
        setErreurEnvoi("Une erreur est survenue. Merci de réessayer.");
      }
    } finally {
      setEnvoiEnCours(false);
    }
  };

  // Si le garde-fou redirige, on n'affiche rien le temps de la redirection.
  if (!datesValides || sejour.chambres.length === 0) return null;

  return (
    <div className={styles.tunnel}>
      <Seo title="Finaliser ma réservation" noindex />
      {/* Retour explicite vers la composition */}
      <button className={styles.retourModif} onClick={() => navigate("/hebergement")}>
        ← Modifier mon séjour (dates ou chambres)
      </button>

      <header className={styles.intro}>
        <h1 className={styles.titre}>Finaliser votre réservation</h1>
      </header>

      <div className={styles.colonnes}>
        {/* ===== GAUCHE : coordonnées PUIS suppléments, dans une seule form ===== */}
        <div className={styles.parcours}>
          <form className={styles.formCoord} onSubmit={soumettre}>
            {/* --- 1. COORDONNÉES --- */}
            <section className={styles.bloc}>
              <h2 className={styles.question}>Vos coordonnées</h2>
              <p className={styles.mentionRequis}>
                <span className={styles.requis}>*</span> Tous les champs sont obligatoires.
              </p>
              <div className={styles.champs}>
                <label className={styles.label}>
                  <span className={styles.labelTexte}>Prénom <span className={styles.requis}>*</span></span>
                  <input type="text" className={classeInput("prenom")} required
                    value={client.prenom}
                    onChange={(e) => setClient({ ...client, prenom: e.target.value })}
                    onBlur={() => marquerTouche("prenom")} />
                  {enErreur("prenom") && <span className={styles.msgErreur}>{MESSAGES_ERREUR.prenom}</span>}
                </label>
                <label className={styles.label}>
                  <span className={styles.labelTexte}>Nom <span className={styles.requis}>*</span></span>
                  <input type="text" className={classeInput("nom")} required
                    value={client.nom}
                    onChange={(e) => setClient({ ...client, nom: e.target.value })}
                    onBlur={() => marquerTouche("nom")} />
                  {enErreur("nom") && <span className={styles.msgErreur}>{MESSAGES_ERREUR.nom}</span>}
                </label>
              </div>
              <div className={styles.champs}>
                <label className={styles.label}>
                  <span className={styles.labelTexte}>Email <span className={styles.requis}>*</span></span>
                  <input type="email" className={classeInput("email")} required
                    value={client.email}
                    onChange={(e) => setClient({ ...client, email: e.target.value })}
                    onBlur={() => marquerTouche("email")} />
                  {enErreur("email") && <span className={styles.msgErreur}>{MESSAGES_ERREUR.email}</span>}
                </label>
                <label className={styles.label}>
                  <span className={styles.labelTexte}>Téléphone <span className={styles.requis}>*</span></span>
                  <input type="tel" className={classeInput("telephone")} required
                    value={client.telephone}
                    onChange={(e) => setClient({ ...client, telephone: e.target.value })}
                    onBlur={() => marquerTouche("telephone")} />
                  {enErreur("telephone") && <span className={styles.msgErreur}>{MESSAGES_ERREUR.telephone}</span>}
                </label>
              </div>
            </section>

            {/* --- 2. SUPPLÉMENTS (à la fin, juste avant de confirmer) --- */}
            <section className={styles.bloc}>
              <h2 className={styles.question}>Composez votre séjour</h2>

              {/* Ménage */}
              {prestationMenage && (
                menageInclus ? (
                  <div className={styles.menageInclus}>
                    <h3 className={styles.menageInclusTitre}>Ménage hebdomadaire inclus ✓</h3>
                    <p>
                      Votre chambre est rafraîchie une fois par semaine. Besoin d'un coup de
                      propre supplémentaire&nbsp;? Parlez-en à notre équipe sur place, on fait
                      notre possible (env. {prestationMenage.prix} € / chambre). 🌿
                    </p>
                  </div>
                ) : (
                  <div className={styles.optionBloc}>
                    <div className={styles.optionInfos}>
                      <span className={styles.optionNom}>{prestationMenage.nom}</span>
                      <span className={styles.optionDesc}>
                        {prestationMenage.prix} € par chambre, un passage pendant le séjour.
                      </span>
                    </div>
                    {sejour.chambres.map((c) => {
                      const actif = menageParChambre.includes(c.id);
                      return (
                        <div key={c.id} className={styles.ligneMenage}>
                          <span>{c.nom}</span>
                          <div className={styles.compteur}>
                            <button type="button" onClick={() => basculerMenage(c.id)} disabled={!actif}>−</button>
                            <span>{actif ? 1 : 0}</span>
                            <button type="button" onClick={() => basculerMenage(c.id)} disabled={actif}>+</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              )}

              {/* Packs surf (individuels) */}
              {packsSurf.map((p) => {
                const q = packsChoisis[p.id] || 0;
                return (
                  <div key={p.id} className={styles.optionBloc}>
                    <div className={styles.optionInfos}>
                      <span className={styles.optionNom}>{p.nom}</span>
                      {p.description && <span className={styles.optionDesc}>{p.description}</span>}
                      <span className={styles.optionDesc}>
                        {p.prix} € par personne (max {nbVoyageurs})
                      </span>
                    </div>
                    <div className={styles.compteur}>
                      <button type="button" onClick={() => changerPack(p.id, q - 1)} disabled={q === 0}>−</button>
                      <span>{q}</span>
                      <button type="button" onClick={() => changerPack(p.id, q + 1)} disabled={q >= nbVoyageurs}>+</button>
                    </div>
                  </div>
                );
              })}
            </section>

            {erreurEnvoi && <p className={styles.erreur}>{erreurEnvoi}</p>}

            <label className={styles.optin}>
              <input type="checkbox"
                checked={client.consentement_marketing}
                onChange={(e) => setClient({ ...client, consentement_marketing: e.target.checked })} />
              J'accepte de recevoir des offres et nouvelles d'Imsouane Surf Paradise.
            </label>

            <button
              type="submit"
              className={styles.boutonValider}
              disabled={envoiEnCours || !coordonneesCompletes}
            >
              {envoiEnCours ? "Création en cours…" : "Procéder au paiement de l'acompte"}
            </button>
            {!coordonneesCompletes && (
              <p className={styles.aide}>
                Renseignez vos coordonnées (prénom, nom, email, téléphone) pour continuer.
              </p>
            )}
          </form>
        </div>

        {/* ===== DROITE : récap lecture seule ===== */}
        <aside className={styles.recap}>
          <h3 className={styles.recapTitre}>Votre séjour</h3>
          <p className={styles.recapDates}>{sejour.dateArrivee} → {sejour.dateDepart}</p>
          <p className={styles.recapVoy}>{nbVoyageurs} voyageur(s)</p>

          {devis && (
            <>
              <ul className={styles.recapLignes}>
                {devis.chambres.map((c) => (
                  <li key={c.chambre_id}><span>{c.nom}</span><span>{c.sous_total} €</span></li>
                ))}
                {devis.prestations.map((p) => (
                  <li key={p.prestation_id}>
                    <span>{p.nom} × {p.quantite}</span>
                    <span>{(Number(p.prix_unitaire) * p.quantite).toFixed(2)} €</span>
                  </li>
                ))}
              </ul>
              <div className={styles.recapTotal}><span>Total</span><span>{devis.montant_total} €</span></div>
              <div className={styles.recapPaiement}>
                <div><span className={styles.fort}>Acompte (30 %)</span><span className={styles.fort}>{devis.montant_acompte} €</span></div>
                <div><span>Solde sur place</span><span>{devis.montant_solde} €</span></div>
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}

export default Reservation;
