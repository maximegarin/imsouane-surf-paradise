# Documentation Frontend — Imsouane Surf Paradise

> Doc d'étude complète du frontend **React + Vite** (JSX, SCSS Modules, sans TypeScript, sans Tailwind).
> Objectif : comprendre **chaque couche**, les **patterns** employés et le **flux de données**, pour pouvoir l'expliquer au jury.

---

## Table des matières

1. [Vue d'ensemble & stack](#1-vue-densemble--stack)
2. [Démarrage de l'app (le « boot »)](#2-démarrage-de-lapp-le-boot)
3. [Arborescence des fichiers](#3-arborescence-des-fichiers)
4. [Communication avec l'API (axios)](#4-communication-avec-lapi-axios)
5. [État global : la Context API](#5-état-global--la-context-api)
6. [Les hooks personnalisés](#6-les-hooks-personnalisés)
7. [Routage & navigation](#7-routage--navigation)
8. [Les styles (SCSS Modules)](#8-les-styles-scss-modules)
9. [Composants réutilisables](#9-composants-réutilisables)
10. [Les pages](#10-les-pages)
11. [Le parcours de réservation de bout en bout](#11-le-parcours-de-réservation-de-bout-en-bout)
12. [Patterns React clés (récap jury)](#12-patterns-react-clés-récap-jury)
13. [Sécurité côté front](#13-sécurité-côté-front)
14. [Dette technique & pistes](#14-dette-technique--pistes)

---

## 1. Vue d'ensemble & stack

Le frontend est une **SPA** (Single Page Application) : une seule page HTML (`index.html`), et React réécrit le contenu côté navigateur quand on navigue. Le serveur Express n'est appelé que pour les **données** (JSON via l'API), jamais pour générer des pages.

| Brique | Choix | Rôle |
|---|---|---|
| Build / dev server | **Vite** | Serveur de dev ultra-rapide + build de prod |
| UI | **React 19** (JSX) | Composants, état, rendu |
| Routage | **react-router-dom v7** | Navigation entre pages sans rechargement |
| HTTP | **axios** | Appels à l'API Express |
| Dates | **react-day-picker** + **date-fns** | Calendrier de sélection des dates |
| Styles | **SCSS Modules** (`sass`) | Styles scopés par composant + variables |

Scripts (`package.json`) :
- `npm run dev` → serveur de dev Vite (hot reload).
- `npm run build` → build optimisé dans `dist/`.
- `npm run preview` → prévisualise le build de prod.
- `npm run lint` → ESLint.

---

## 2. Démarrage de l'app (le « boot »)

L'ordre de montage est important — c'est lui qui rend l'état global disponible partout.

```
index.html  (<div id="root">)
   └── main.jsx                → createRoot(...).render(<App/>)  + import styles globaux
        └── App.jsx
             └── <AuthProvider>            (état d'authentification global)
                  └── <ReservationProvider>(état du séjour global)
                       └── <BrowserRouter> (routeur)
                            ├── <ScrollToTop/>  (remonte en haut à chaque page)
                            ├── <Header/>
                            ├── <main> <Routes>…</Routes> </main>
                            └── <Footer/>
```

**`main.jsx`** est le point d'entrée : il monte `<App/>` dans `#root`, enveloppé dans `<StrictMode>` (aide au dev, détecte les effets mal écrits), et importe **une seule fois** les styles globaux (`styles/index.scss`).

**Pourquoi les Providers enveloppent tout ?** Pour que n'importe quel composant, aussi profond soit-il, puisse lire l'auth ou le séjour **sans qu'on lui passe la donnée de parent en parent** (anti « prop drilling »).

---

## 3. Arborescence des fichiers

```
src/
├── main.jsx               # point d'entrée
├── App.jsx                # racine : providers + routeur + layout
├── App.module.scss        # layout "sticky footer"
│
├── api/
│   └── axios.js           # instance axios pré-configurée (baseURL)
│
├── context/               # état GLOBAL (Context API)
│   ├── AuthContext.jsx    # admin connecté + login/logout
│   └── ReservationContext.jsx  # séjour en cours (dates, chambres, options)
│
├── hooks/                 # logique réutilisable
│   ├── useAuth.js         # raccourci vers AuthContext
│   ├── useReservation.js  # raccourci vers ReservationContext
│   └── useRevealAuScroll.js  # apparition au scroll (IntersectionObserver)
│
├── routes/
│   └── ProtectedRoute.jsx # garde des pages admin (redirige si non connecté)
│
├── components/            # composants réutilisables (UI partagée)
│   ├── Header/  Footer/  ScrollToTop/
│   ├── Reveal/            # wrapper "apparition au scroll"
│   ├── Lightbox/          # modale carrousel photo
│   ├── ChambreCard/       # carte chambre (page Nos chambres)
│   ├── SelecteurSejour/   # drawer dates + voyageurs
│   ├── RecapSejour/       # récap sticky (prix live)
│   └── Intro/             # ⚠️ orphelin (plus importé, voir §14)
│
├── pages/                 # une vue par route
│   ├── Accueil/
│   ├── Hebergement/       # liste des chambres ("Nos chambres")
│   ├── DetailChambre/     # page d'une chambre (carrousel + résa)
│   ├── Reservation/       # étape finale : coordonnées + options
│   ├── Paiement/          # paiement simulé de l'acompte
│   ├── Confirmation/      # récap après paiement
│   └── admin/Login/ , admin/Dashboard/
│
└── styles/
    ├── _variables.scss    # palette, typos, espacements (le "design system")
    └── index.scss         # styles globaux (reset, body, polices)
```

**Convention** : un composant = un dossier = `Nom.jsx` + `Nom.module.scss`. Le style vit **à côté** du composant qu'il habille.

---

## 4. Communication avec l'API (axios)

`api/axios.js` crée **une seule instance** axios partagée :

```js
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
});
```

- **`baseURL`** : on écrit `api.get("/chambres")` au lieu de l'URL complète à chaque fois.
- **`import.meta.env.VITE_API_URL`** : variable d'environnement du front. Avec Vite, **seules** les variables préfixées `VITE_` sont exposées au navigateur (sécurité). En dev, on retombe sur `localhost:3000/api`.
- **Un seul point d'entrée réseau** : si l'URL de l'API change (mise en prod), on ne modifie qu'**un** fichier.

> 🔑 Le **token JWT** d'admin est posé sur cette instance par `AuthContext` (`api.defaults.headers.common.Authorization`). Donc tous les appels admin l'envoient automatiquement.

---

## 5. État global : la Context API

React permet de partager une donnée à tout un sous-arbre via **3 ingrédients** : `createContext`, un `Provider`, et `useContext`. Le projet a **deux** contextes.

### 5.1 `AuthContext` — l'admin connecté

Fournit `{ admin, login, logout }`.

Points techniques importants :

- **Initialisation paresseuse (`useState(() => …)`)** : au démarrage, on relit l'admin depuis `localStorage` → on **reste connecté après un F5**.
  ```js
  const [admin, setAdmin] = useState(() => {
    const stocke = localStorage.getItem("admin");
    const initial = stocke ? JSON.parse(stocke) : null;
    if (initial?.token) api.defaults.headers.common.Authorization = `Bearer ${initial.token}`;
    return initial;
  });
  ```
- **Pose synchrone du token** : on applique le `Authorization` **dans l'initialiseur** (pas seulement dans un `useEffect`). Sinon, après F5, le Dashboard pourrait lancer son appel API **avant** que le token soit posé → `401`. (C'est un vrai bug qu'on a corrigé.)
- **Décodage du JWT côté front** : `JSON.parse(atob(token.split(".")[1]))` lit le *payload* du token (`{ id, email, role }`) pour connaître le rôle **sans appel réseau** supplémentaire. ⚠️ On lit, on ne **vérifie** pas : la vérification de signature reste côté back.

### 5.2 `ReservationContext` — le séjour en cours

C'est le **cœur** du parcours de réservation. Il porte tout le « panier » :

```js
{ dateArrivee, dateDepart, adultes, enfants, chambres: [], options: {}, menageParChambre: [] }
```

Patterns clés :

- **Persistance localStorage** : un `useEffect([sejour])` resauvegarde le séjour à chaque changement → survit au refresh.
- **Mises à jour fonctionnelles & immuables** : on ne mute jamais l'objet, on en recrée un :
  ```js
  const setDates = (a, d) => setSejour((s) => ({ ...s, dateArrivee: a, dateDepart: d }));
  ```
  Le `(s) => …` garantit qu'on part **toujours** de la valeur la plus récente.
- **Valeurs DÉRIVÉES (jamais stockées)** : on **recalcule** ce qui peut l'être, au lieu de le mémoriser (sinon risque de désynchronisation).
  ```js
  const nbVoyageurs   = sejour.adultes + sejour.enfants;
  const capaciteCumulee = sejour.chambres.reduce((s, c) => s + c.capacite, 0);
  const datesValides  = dateArrivee && dateDepart && new Date(depart) > new Date(arrivee);
  const sejourValide  = datesValides && chambres.length > 0 && capaciteCumulee >= nbVoyageurs && adultes >= 1;
  ```
  > 💡 **Capacité cumulée** : plusieurs chambres ⇒ on **additionne** les capacités (logique multi-chambres), on ne masque jamais une chambre — on **informe** seulement.

---

## 6. Les hooks personnalisés

Un *hook* = une fonction réutilisable qui encapsule de la logique React.

- **`useAuth()`** / **`useReservation()`** : simples raccourcis `useContext(...)`. Évite d'importer le contexte partout et rend le code lisible (`const { admin } = useAuth()`).

- **`useRevealAuScroll(options)`** : apparition au scroll **sans librairie**, via l'**IntersectionObserver** natif.
  - Renvoie `[ref, visible]`. On pose `ref` sur l'élément ; `visible` passe à `true` quand 15 % de l'élément entre dans l'écran.
  - `observer.unobserve()` après révélation → on n'observe plus inutilement (perf).
  - `return () => observer.disconnect()` → **nettoyage** quand le composant disparaît (évite les fuites mémoire).

---

## 7. Routage & navigation

Géré par **react-router-dom v7** dans `App.jsx`.

```jsx
<Routes>
  <Route path="/" element={<Accueil />} />
  <Route path="/hebergement" element={<Hebergement />} />
  <Route path="/chambre/:slug" element={<DetailChambre />} />
  <Route path="/reservation" element={<Reservation />} />
  <Route path="/reservation/paiement/:reservationId/:token" element={<Paiement />} />
  <Route path="/reservation/confirmation/:token" element={<Confirmation />} />
  <Route path="/admin/login" element={<Login />} />
  <Route path="/admin/dashboard" element={
    <ProtectedRoute roles={["super_admin","admin","gestionnaire"]}><Dashboard /></ProtectedRoute>
  } />
</Routes>
```

Notions :
- **Paramètres d'URL** (`:slug`, `:token`) → lus côté page avec **`useParams()`**.
- **Navigation programmatique** → **`useNavigate()`** (ex. après soumission du formulaire).
- **`<NavLink>`** (Header) → applique une classe `actif` automatiquement sur le lien de la page courante.
- **`ProtectedRoute`** → si pas d'`admin`, `<Navigate to="/admin/login" replace />`. Si rôle non autorisé, redirige vers le dashboard. ⚠️ C'est du **confort UX** : la vraie sécurité est côté API (middlewares JWT + rôles).
- **`ScrollToTop`** → composant « comportemental » (`return null`) : un `useEffect([pathname])` fait `window.scrollTo(0,0)` à **chaque changement d'URL** (dans une SPA, le scroll ne se réinitialise pas tout seul).

---

## 8. Les styles (SCSS Modules)

### 8.1 Pourquoi SCSS Modules ?
Un fichier `*.module.scss` voit ses classes **renommées automatiquement** (ex. `.card` → `card_a1b2c3`). Conséquence : **pas de collision** de noms entre composants, chaque style est **scopé**. On les utilise via un objet importé :

```jsx
import styles from "./ChambreCard.module.scss";
<div className={styles.card}>…</div>
```

### 8.2 Le « design system » : `_variables.scss`
Toutes les couleurs, polices, espacements et mesures vivent à **un seul endroit** :

```scss
$blanc-vieilli: #F5F0E8;  $terracotta: #B85C38;  $encre-marine: #1C2B3A; …
$font-titre: 'Young Serif';  $font-corps: 'Inter';
$espace-xs … $espace-xl;  $largeur-max: 1200px;  $hauteur-header: 5.5rem;
```
On les importe dans chaque module : `@use "../../styles/variables" as *;`. Changer une valeur ici → **tout le site suit**.

### 8.3 Styles globaux : `index.scss`
Importé **une fois** dans `main.jsx` : import des polices Google, *reset* léger (`margin/padding 0`, `box-sizing: border-box`), styles de base du `body` et des titres.

### 8.4 Layout global : `App.module.scss`
Technique du **sticky footer** : `.app { display:flex; flex-direction:column; min-height:100vh }` + `.contenu { flex:1 }` → le `<main>` pousse le footer en bas même sur une page courte.

---

## 9. Composants réutilisables

| Composant | Rôle | À retenir |
|---|---|---|
| **Header** | Nav desktop + burger mobile | `NavLink` (classe active), menu plein écran en `position:fixed` sous 768px |
| **Footer** | Pied de page | Palette sobre (terracotta = seul accent), labels crème atténués |
| **ScrollToTop** | Remonte en haut au changement d'URL | `useEffect([pathname])` |
| **Reveal** | Enveloppe un contenu et le fait apparaître au scroll | s'appuie sur `useRevealAuScroll` ; prop `delai` pour des cascades |
| **Lightbox** | Modale carrousel photo plein écran | nav circulaire (`%`), clavier (← → Échap), `body overflow hidden`, clic sur fond = fermer |
| **ChambreCard** | Carte d'une chambre (style Airbnb) | photo couverture, **prix « À partir de »**, bouton d'ajout **adaptatif**, actions collées en bas (`margin-top:auto`) |
| **SelecteurSejour** | Drawer dates + voyageurs | **état local** du formulaire, validé dans le contexte au clic « Valider » |
| **RecapSejour** | Récap sticky + **prix live** | appelle `/reservations/estimation` à chaque changement dates/chambres |

### Détails marquants

**Lightbox** — navigation circulaire :
```js
const precedent = () => onIndex((index - 1 + total) % total);
const suivant   = () => onIndex((index + 1) % total);
```
Le modulo `%` fait boucler proprement (dernière → première). Même technique que les carrousels.

**ChambreCard** — bouton **adaptatif** selon le contexte :
- pas de dates valides → « Réserver » qui **ouvre le drawer** ;
- dates valides + non ajoutée → « Ajouter au séjour » ;
- déjà ajoutée → « ✓ Ajouté à votre séjour » (et un re-clic retire).
`e.preventDefault()` + `e.stopPropagation()` empêchent le clic bouton de suivre le `<Link>` de la carte.

**SelecteurSejour** — pourquoi un **état local** ?
On ne veut écrire dans le contexte global **qu'au clic « Valider »** (sinon le prix se recalculerait à chaque demi-saisie). Un `useEffect([ouvert])` resynchronise le formulaire local depuis le contexte **à chaque ouverture** (car `useState` ne lit sa valeur initiale qu'au 1er montage).

---

## 10. Les pages

### Accueil (`pages/Accueil`)
La plus riche visuellement. Contient :
- **Hero** : carrousel d'images en **slide infini** (clone de la 1ère image + `onTransitionEnd` qui réinitialise sans animation), **dots cliquables**, et une **intro à volet** (le volet `position:fixed` couvre l'écran, le titre glisse depuis la gauche, puis le volet se lève). Minuteries pilotées par `useEffect`/`setTimeout` + bascule `introFini` qui fait repasser le titre **sous** le header (anti-collision au scroll).
- **F5 → retour en haut** : `window.history.scrollRestoration = "manual"` + `scrollTo(0,0)` pour que l'intro reparte du hero.
- **« Le lieu »** : composition éditoriale **désalignée** (grilles asymétriques, formats variés, `margin-top` négatif pour la profondeur, ombre douce).
- **Bandeau texture sable** (séparateur fin, `background-image`).
- **« L'expérience »** : gros titre + photo + 2 colonnes de texte (esprit Studio Waaz).
- **Carrousel « Nos chambres »** : 1 card à la fois, le **texte change** selon la card (clé `key` qui rejoue l'anim), dots + flèches, lien « Plus d'informations ».
- **Lightbox** branchée sur les 7 photos éditoriales.

> Les images de l'accueil sont des **constantes front** (assets de marque), volontairement **pas** en base (cf. choix d'archi).

### Hebergement — « Nos chambres » (`pages/Hebergement`)
- `useEffect([])` → `GET /chambres` (avec photo de couverture jointe côté back).
- 3 états gérés : **chargement / erreur / données** (pattern classique).
- Affiche une **grille de `ChambreCard`** + le `RecapSejour` sticky, et un bouton qui ouvre le `SelecteurSejour`.

### DetailChambre (`pages/DetailChambre`)
- `useParams()` → `slug` → `GET /chambres/slug/:slug` (renvoie la chambre **+ ses photos**).
- **Carrousel** : 1 photo à la fois, **flèches + dots**, clic → **Lightbox**. `indexPhoto` réinitialisé quand le slug change.
- Colonne gauche : description + **caractéristiques** en grille label/valeur (on n'affiche que les champs renseignés via `.filter(Boolean)`).
- Colonne droite : **carte de réservation sticky** (prix « À partir de », bouton adaptatif).

### Reservation — étape finale (`pages/Reservation`)
- **Garde-fou** : si le séjour est vide/incomplet → redirection vers `/hebergement`.
- Charge les **prestations** (`GET /prestations`), gère le **ménage** (inclus si ≥ 8 nuits — calcul d'affichage, le **back fait foi**) et les **packs surf** (à venir).
- **Devis live** : `POST /reservations/estimation` recalculé à chaque changement d'option (clé `prestationsKey = JSON.stringify(...)`).
- **Validation des coordonnées** : tous les champs requis, états `touches`/`enErreur` → on n'affiche le rouge **qu'après** que le champ a été quitté (`onBlur`).
- **Soumission** : `POST /reservations` → redirige vers `/reservation/paiement/:id/:token`. On **ne vide pas** le séjour ici (sinon le garde-fou se déclencherait) — il sera vidé sur la page de confirmation.

### Paiement (`pages/Paiement`) — **simulé**
- À l'arrivée : `POST /paiements/acompte/:reservationId` (équivaut à créer un *PaymentIntent* Stripe ; le **montant est relu en base**).
- Au clic « Payer » : `POST /paiements/:id/confirmer` (simule le **webhook Stripe** « paiement réussi ») → redirige vers la confirmation.
- Faux formulaire de carte + bandeau « mode démonstration » honnête. (Voir `docs/paiement-simule.md`.)
- 👉 C'est ici, côté back, que part l'**e-mail de confirmation** (Nodemailer/Brevo) une fois l'acompte confirmé.

### Confirmation (`pages/Confirmation`)
- Récap final (« acompte payé », solde restant). **Vide le séjour** (`viderSejour()`) au montage = fin du parcours.

### Admin Login / Dashboard
- `Login` → `useAuth().login()` ; `Dashboard` protégé par `ProtectedRoute` (RBAC d'affichage).

---

## 11. Le parcours de réservation de bout en bout

```
 Nos chambres / Détail chambre
   │  (SelecteurSejour écrit dates+voyageurs dans le ReservationContext)
   │  (ChambreCard "Ajouter au séjour" -> ajoute la chambre au contexte)
   ▼
 RecapSejour (sticky)   ── POST /reservations/estimation ──► prix live
   │  bouton "Continuer" (actif si sejourValide)
   ▼
 /reservation  (coordonnées + options)
   │  POST /reservations/estimation (devis avec options)
   │  POST /reservations  ──► { reservation_id, token_suivi }
   ▼
 /reservation/paiement/:id/:token
   │  POST /paiements/acompte/:id      (initie, montant relu EN BASE)
   │  POST /paiements/:id/confirmer    (simule webhook -> statut "acompte_paye")
   │                                    └─► e-mail de confirmation (back)
   ▼
 /reservation/confirmation/:token   (récap + viderSejour())
```

**Fil rouge** : le `ReservationContext` est la **source de vérité** côté front pendant toute la composition ; le **prix** et les **montants** sont **toujours recalculés par l'API** (jamais inventés par le front).

---

## 12. Patterns React clés (récap jury)

1. **Context API + Provider** pour l'état global (auth, séjour) → pas de prop drilling.
2. **Hooks personnalisés** pour factoriser la logique (`useReservation`, `useRevealAuScroll`).
3. **Initialisation paresseuse** `useState(() => …)` + **persistance localStorage** → survie au F5.
4. **Mises à jour immuables & fonctionnelles** `setX(prev => ({...prev, …}))`.
5. **Valeurs dérivées non stockées** (capacité, validité, prix) → zéro désynchronisation.
6. **`useEffect` avec tableau de dépendances** maîtrisé (`[slug]`, `[pathname]`, `[ouvert]`, clés stringifiées pour des tableaux/objets).
7. **Nettoyage des effets** (`return () => …`) : observers, timers.
8. **Composants contrôlés** (inputs liés à l'état, validation `touched`/`error`).
9. **Rendu conditionnel** des 3 états chargement/erreur/données.
10. **Navigation** : `useParams`, `useNavigate`, `<NavLink>`, route protégée, scroll reset.
11. **SCSS Modules** : styles scopés + design system centralisé.
12. **APIs natives** (IntersectionObserver) plutôt que des libs lourdes.

---

## 13. Sécurité côté front

> Règle d'or du projet : **on ne fait jamais confiance au front.**

- **Montants & prix** : toujours **relus/recalculés côté API** (estimation, acompte). Le front ne fait qu'**afficher**.
- **`ProtectedRoute`** protège l'**affichage** des pages admin (confort), **pas** les données : l'API refuse toute requête sans **JWT valide** + **rôle** autorisé.
- **JWT** : on **décode** le payload côté front pour l'UX (afficher le rôle), mais la **vérification de signature** est exclusivement côté back.
- **Variables d'env** : seules les `VITE_*` sont exposées au navigateur. Les secrets (DB, SMTP, JWT_SECRET) restent dans le `.env` **backend**, jamais côté front.

---

## 14. Dette technique & pistes

- **`components/Intro/`** : orphelin (plus importé depuis la refonte de l'accueil). À supprimer après confirmation.
- **Packs surf** : le code de `Reservation` les gère déjà (catégorie `pack_surf`), mais aucun n'est seedé → section vide tant qu'on n'en ajoute pas en base.
- **Images** : photos de chambres = vraies données (table `photo`) ; images éditoriales de l'accueil = placeholders Unsplash en dur, à remplacer par les vraies photos.
- **i18n (FR/EN/DE)** : prévu **post-jury**.
- **SEO / pré-rendu** : une SPA est peu friendly SEO par défaut → à traiter plus tard (meta + éventuel pré-rendu).
- **Accessibilité** : `aria-label` présents sur les contrôles clés ; à auditer plus largement.

---

*Dernière mise à jour : générée à partir du code source actuel (`frontend/src`).*
