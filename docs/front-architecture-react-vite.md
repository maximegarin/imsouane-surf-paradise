# Architecture du front — React + Vite (expliquée en détail)

> But : comprendre l'architecture AVANT de coder. Aligné sur la doc officielle
> https://react.dev/learn et les conventions courantes des projets React/Vite.
> Stack du projet : **React + Vite**, **JSX** (pas TypeScript), **SCSS Modules**
> (pas Tailwind), appels à l'API Express via **axios**.

---

## 1. Les 3 briques et qui fait quoi

| Brique | Rôle | Analogie |
|---|---|---|
| **Vite** | l'outil qui lance le serveur de dev et fabrique le build final | l'atelier / la chaîne de montage |
| **React** | la bibliothèque qui construit l'interface (composants, état) | les briques Lego de l'UI |
| **SCSS Modules** | le style, écrit à la main, scopé par composant | la peinture et la déco |

Point essentiel : **React ne dessine aucun style par défaut**. C'est une toile vierge.
Tout le design vient de TON SCSS. Le "look React froid" n'existe pas — il vient de
kits comme Bootstrap/Tailwind qu'on n'utilise PAS ici.

---

## 2. Vite, c'est quoi exactement ?

**Vite** (prononcé "vit", mot français choisi exprès) est un *build tool*. Il fait 2 choses :

1. **En développement** : un serveur local ultra-rapide (`npm run dev`) avec
   **HMR** (Hot Module Replacement) → tu sauvegardes, la page se met à jour
   instantanément sans rechargement complet.
2. **En production** : `npm run build` → il "compile" et optimise tout ton code
   (minifié, regroupé) dans un dossier `dist/` prêt à héberger.

Pourquoi Vite et pas Create-React-App (l'ancien standard) ? CRA est **déprécié**
(plus maintenu). Vite est devenu le standard recommandé : plus rapide, plus simple.
C'est aussi l'outil de ton projet d'apprentissage → cohérence.

---

## 3. Le point d'entrée : comment une page React démarre

C'est la chaîne la plus importante à comprendre. 3 fichiers s'enchaînent :

```
index.html   →   src/main.jsx   →   src/App.jsx   →   tous les composants
 (la coquille)    (le démarreur)     (le chef d'orchestre)
```

### a) `index.html` — la coquille vide
Une page HTML quasi vide, avec UN élément :
```html
<div id="root"></div>
<script type="module" src="/src/main.jsx"></script>
```
- `<div id="root">` = la "boîte" où React va injecter TOUTE l'application.
- le `<script>` charge `main.jsx` qui démarre tout.
→ Contrairement à un site classique multi-pages, il n'y a **qu'une seule** page HTML.
C'est une **SPA** (Single Page Application) : React change le contenu de `#root`
sans jamais recharger la page. (D'où le débat SEO qu'on a noté — on y reviendra.)

### b) `src/main.jsx` — le démarreur
Son seul job : "accroche React dans la div #root et affiche App".
```jsx
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';                 // styles globaux

createRoot(document.getElementById('root')).render(<App />);
```
- `createRoot(...)` cible la div `#root`.
- `.render(<App />)` dit : "affiche le composant App là-dedans".
→ On ne touche quasi jamais à ce fichier après l'avoir écrit.

### c) `src/App.jsx` — le chef d'orchestre
C'est le composant racine. Il contiendra surtout le **routeur** (voir §6) :
il décide quelle "page" afficher selon l'URL.

---

## 4. C'est quoi un "composant" ? (le cœur de React)

Un **composant** = une fonction JavaScript qui **retourne du JSX** (de l'UI).
C'est l'unité de base de React. Exemple minimal :

```jsx
function BoutonReserver() {
  return <button className="btn">Réserver</button>;
}
```

- C'est une **fonction** dont le nom commence par une **Majuscule** (obligatoire :
  React distingue tes composants `<BoutonReserver/>` des balises HTML `<button/>`).
- Elle **retourne du JSX** : ça ressemble à du HTML, mais c'est du JavaScript (§5).
- On la réutilise comme une balise : `<BoutonReserver />`.

**Pourquoi des composants ?** Pour découper l'interface en morceaux réutilisables et
indépendants : un `<Header/>`, une `<ChambreCard/>`, un `<Footer/>`... On assemble
des petits composants pour former des pages. (Exactement l'esprit "modulaire,
chacun sa fonction" que tu voulais côté back — même philosophie côté front.)

---

## 5. JSX : du HTML dans du JavaScript

Le **JSX** est la syntaxe qui permet d'écrire de l'UI dans tes fonctions. Règles
à connaître (les pièges classiques) :

| En HTML classique | En JSX | Pourquoi |
|---|---|---|
| `class="..."` | `className="..."` | `class` est un mot réservé en JS |
| `for="..."` (label) | `htmlFor="..."` | idem |
| attributs en minuscule | `camelCase` (`onClick`, `tabIndex`) | convention JS |
| plusieurs balises | un seul élément racine | une fonction retourne UNE chose |

- **Insérer du JavaScript dans le JSX** : on utilise des accolades `{ }`.
  ```jsx
  const nom = "Tamsrite";
  return <h2>Chambre {nom}</h2>;   // affiche "Chambre Tamsrite"
  ```
- **Un seul élément racine** : si tu veux retourner plusieurs balises, tu les
  enveloppes dans un fragment `<> ... </>` (une "boîte invisible") :
  ```jsx
  return (
    <>
      <h1>Titre</h1>
      <p>Texte</p>
    </>
  );
  ```

---

## 6. Les props : passer des données à un composant

Les **props** (properties) = les "arguments" qu'on donne à un composant, comme à
une fonction. C'est ainsi qu'un composant parent transmet des infos à un enfant.

```jsx
// Le composant enfant reçoit "props"
function ChambreCard({ nom, prix }) {     // on déstructure les props
  return <div className="card">{nom} — dès {prix} €</div>;
}

// Le parent l'utilise en passant des valeurs
<ChambreCard nom="Tamsrite" prix={79} />
```
→ Les props sont en **lecture seule** : un composant ne modifie jamais ses props,
il les reçoit. (Pour des données qui changent, on utilise l'état → §7.)

---

## 7. L'état (state) : des données qui changent dans le temps

Quand une donnée doit **évoluer** (un champ de formulaire, l'ouverture d'un menu,
la liste des chambres chargée depuis l'API), on utilise un **state** via le "hook"
`useState`.

```jsx
import { useState } from 'react';

function Compteur() {
  const [n, setN] = useState(0);          // valeur initiale : 0
  return <button onClick={() => setN(n + 1)}>Cliqué {n} fois</button>;
}
```
- `useState(0)` renvoie 2 choses : la **valeur** (`n`) et une **fonction pour la
  changer** (`setN`).
- Quand on appelle `setN(...)`, React **re-affiche** automatiquement le composant
  avec la nouvelle valeur. C'est ça la magie de React : tu changes l'état, l'UI
  se met à jour toute seule. Tu ne touches jamais le DOM à la main.

> Un **hook** = une fonction spéciale de React qui commence par `use` (`useState`,
> `useEffect`...). Règle : on les appelle toujours en haut d'un composant, jamais
> dans une condition ou une boucle.

---

## 8. `useEffect` : parler au monde extérieur (l'API)

Pour aller **chercher des données** (ex. la liste des chambres depuis ton API
Express), on utilise le hook `useEffect` : il exécute du code "après l'affichage",
par exemple un appel réseau.

```jsx
import { useState, useEffect } from 'react';
import api from '../api/axios';

function ListeChambres() {
  const [chambres, setChambres] = useState([]);   // au départ : tableau vide

  useEffect(() => {
    api.get('/chambres').then((res) => setChambres(res.data));
  }, []);                                          // [] = une seule fois au montage

  return (
    <div>
      {chambres.map((c) => (
        <ChambreCard key={c.id} nom={c.nom} prix={c.prix_base} />
      ))}
    </div>
  );
}
```
- `useEffect(() => {...}, [])` : le `[]` signifie "exécute une seule fois, au
  chargement du composant". Parfait pour charger des données au démarrage.
- `.map(...)` : on transforme chaque chambre en `<ChambreCard/>` (comme le `.map`
  qu'on a vu côté back !). Le `key={c.id}` aide React à suivre chaque élément.

→ C'est le **pont entre ton front et ton back** : `useEffect` appelle ton API
`http://localhost:3000/api/chambres`, et l'état stocke la réponse.

---

## 9. Le routage : plusieurs "pages" dans une SPA

Comme il n'y a qu'un `index.html`, c'est **React Router** (lib standard) qui
simule la navigation : il affiche le bon composant selon l'URL, sans recharger.

```jsx
// App.jsx (simplifié)
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<Accueil />} />
        <Route path="/hebergement" element={<Hebergement />} />
        <Route path="/chambre/:slug" element={<DetailChambre />} />
        <Route path="/reservation" element={<Reservation />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}
```
- chaque `<Route>` associe une **URL** à un **composant page**.
- `:slug` = partie variable (ex. `/chambre/tamsrite`).
- `<Header/>` et `<Footer/>` sont **hors** des Routes → affichés sur toutes les pages.

---

## 10. SCSS Modules : le style scopé, 100 % custom

Un fichier `Nom.module.scss` est **lié à un seul composant** : ses classes ne
"fuient" pas vers les autres composants (pas de conflit de noms). C'est le
standard pour un CSS maintenable.

```scss
/* ChambreCard.module.scss */
.card {
  font-family: 'Young Serif', serif;
  background: $blanc-vieilli;
  transition: transform .4s ease;
  &:hover { transform: scale(1.03); }   // nesting Sass
}
```
```jsx
/* ChambreCard.jsx */
import styles from './ChambreCard.module.scss';
function ChambreCard() {
  return <div className={styles.card}>...</div>;   // styles.card = nom unique généré
}
```
- `styles.card` devient un nom unique (genre `ChambreCard_card_x7f3`) → **zéro
  collision** entre composants.
- On garde **un fichier global** (`index.scss`) pour les variables de palette
  (`$terracotta`, `$sable`...), les polices, et le `reset` CSS.
- Tout ce qu'on a prévu pour la DA (clip-path reveal, grain, parallax,
  transitions) s'écrit ici, **sans aucune limite** — c'est l'inverse de Tailwind.

---

## 11. L'architecture de dossiers proposée

Conventions courantes React/Vite, adaptées à ton projet :

```
frontend/
├── index.html                 # la coquille (#root)
├── vite.config.js             # config de Vite
├── package.json
└── src/
    ├── main.jsx               # point d'entrée (monte <App/>)
    ├── App.jsx                # routeur + layout global
    ├── api/
    │   └── axios.js           # instance axios (baseURL = http://localhost:3000/api)
    ├── styles/
    │   ├── index.scss         # global : reset, variables palette, polices
    │   └── _variables.scss    # couleurs, typos (réutilisables partout)
    ├── components/            # briques réutilisables (UI)
    │   ├── Header/
    │   │   ├── Header.jsx
    │   │   └── Header.module.scss
    │   ├── Footer/
    │   ├── ChambreCard/
    │   └── ...
    ├── pages/                 # une "page" = un composant routé
    │   ├── Accueil/
    │   ├── Hebergement/
    │   ├── DetailChambre/
    │   ├── Reservation/
    │   └── admin/             # back-office (protégé)
    │       ├── Dashboard/
    │       ├── Login/
    │       └── ...
    └── context/               # état global partagé (ex. auth admin)
        └── AuthContext.jsx
```

Logique de rangement (même esprit que le back en couches) :
- **`components/`** = morceaux réutilisables, sans logique de page (boutons, cartes…).
- **`pages/`** = les écrans complets, associés à une route.
- **`api/`** = un seul endroit qui parle au back (comme ton `api/axios.js` d'appri).
- **`styles/`** = le global ; le reste du style est en `.module.scss` à côté de chaque composant.
- **`context/`** = données partagées par toute l'app (ex. "l'admin est-il connecté ?").

> Chaque composant a son **dossier** avec son `.jsx` + son `.module.scss` à côté :
> tout ce qui concerne un composant est au même endroit (facile à retrouver).

---

## 12. Comment le front parlera au back (rappel du flux global)

```
Navigateur (React, port 5173)
      │  axios.get('/chambres')
      ▼
API Express (port 3000)  →  MySQL (AlwaysData)
      │  réponse JSON
      ▼
React met à jour l'état (useState) → l'UI se redessine
```
- Le front et le back sont **2 serveurs séparés** (ton archi découplée).
- `api/axios.js` centralise l'URL de base et (plus tard) le token JWT admin.
- Le **CORS** qu'on a configuré côté Express (`CORS_ORIGIN=http://localhost:5173`)
  est précisément ce qui autorise le front à appeler l'API.

---

## 13. Les pièges & bonnes pratiques (qualité "standard")

1. **Noms de composants en Majuscule** (`<Header/>`, pas `<header/>` sauf balise HTML).
2. **`key` unique** sur chaque élément d'une liste `.map()` (sinon warning React).
3. **Ne jamais modifier un state directement** : toujours via `setX(...)`.
4. **Hooks en haut** du composant, jamais dans un `if`/`for`.
5. **Un composant = une responsabilité** (comme tes controllers). S'il devient gros,
   on le découpe.
6. **Le style reste dans le `.module.scss`** du composant ; pas de style "en dur"
   dans le JSX (sauf cas dynamique justifié).
7. **`.env` du front** (Vite) : les variables exposées au navigateur DOIVENT
   commencer par `VITE_` (ex. `VITE_API_URL`). On ne met JAMAIS de secret côté front.

---

## 14. Le compromis SEO (déjà noté, à traiter en fin de parcours)

Une SPA Vite est rendue **côté navigateur** → le contenu n'est pas dans le HTML
initial, ce qui peut gêner le référencement Google. Pour le site vitrine de ton
père (qui doit remonter sur Google), on prévoira en fin de projet :
- des **balises meta** par page (titre, description) via une lib légère,
- éventuellement un **prerendering** des pages vitrine (générer le HTML à l'avance).
Rien de bloquant pour développer ; c'est une optimisation de fin.

---

## En une phrase

> **Vite** lance et build le projet ; **React** assemble des **composants** (fonctions
> qui retournent du **JSX**) qui reçoivent des **props** et gèrent un **état** ; **React
> Router** simule les pages ; **axios** parle à ton API Express ; et **SCSS Modules**
> habille le tout avec un design 100 % maison, sans aucune contrainte de style.
