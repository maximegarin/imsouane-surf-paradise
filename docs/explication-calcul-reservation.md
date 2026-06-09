# Décryptage ligne par ligne — le calcul de réservation

> But : relire `reservation.controller.js` en français parlé, ligne par ligne.
> Concentré sur `getCoefficient`, `calcSousTotalChambre` et `createReservation`.

---

## Bloc 1 — `getCoefficient` : « quel multiplicateur de prix pour cette nuit ? »

```js
const getCoefficient = (date, saisons) => {
```

On déclare une **fonction fléchée** stockée dans une constante `getCoefficient`.
Traduction orale : _« je crée une fonction qui prend deux choses : une `date` (une nuit précise) et `saisons` (la liste de toutes les saisons), et qui me rendra un nombre : le coefficient. »_
Le `(date, saisons) =>` ce sont les **paramètres** ; ce qui suit `=>` c'est le corps.

```js
const matches = saisons.filter(
  (s) => date >= new Date(s.date_debut) && date <= new Date(s.date_fin),
);
```

`saisons.filter(...)` veut dire : _« parcours toutes les saisons, et garde uniquement celles qui passent le test. »_
`.filter` rend un **nouveau tableau** avec seulement les éléments qui répondent « vrai » au test.
Pour chaque saison (appelée `s` ici, comme « saison »), le test est :

- `date >= new Date(s.date_debut)` → _« ma nuit est-elle après (ou égale à) le début de la saison ? »_
- `&&` → _« ET »_ (les deux conditions doivent être vraies)
- `date <= new Date(s.date_fin)` → _« ...et avant (ou égale à) la fin de la saison ? »_

`new Date(s.date_debut)` : la base nous renvoie les dates en **texte** (ex. `"2026-02-01"`). `new Date(...)` transforme ce texte en **vraie date** comparable. On compare donc des dates entre elles.
Résultat : `matches` = la liste des saisons qui **englobent** cette nuit (souvent 0, 1, ou 2 si elles se chevauchent).

```js
if (matches.length === 0) return 1;
```

_« Si aucune saison ne correspond (le tableau est vide, longueur 0), alors je renvoie 1. »_
`return 1` = coefficient neutre → on facture juste le prix de base, sans majoration.
Le `===` est une **égalité stricte** (compare valeur ET type) — en JS on l'utilise toujours plutôt que `==`.

```js
  return Math.max(...matches.map((s) => Number(s.coefficient)));
};
```

La ligne la plus dense. On la lit **de l'intérieur vers l'extérieur** :

1. `matches.map((s) => Number(s.coefficient))` → _« transforme ma liste de saisons en une liste de leurs coefficients (en nombres). »_
   `.map` = _« pour chaque élément, donne-moi une version transformée »_. Ici on extrait `s.coefficient`.
   `Number(...)` : la base renvoie le coefficient en texte (`"1.60"`), on le convertit en **nombre** (`1.60`) pour pouvoir comparer.
   Exemple : si deux saisons matchent, on obtient `[1.30, 1.60]`.
2. `...` (le **spread**) → _« étale ce tableau en arguments séparés »_.
   `Math.max([1.30, 1.60])` ne marcherait pas (Math.max ne sait pas lire un tableau).
   `Math.max(...[1.30, 1.60])` devient `Math.max(1.30, 1.60)` → là ça marche.
3. `Math.max(...)` → _« rends-moi le plus grand »_ → `1.60`.

Bilan oral : _« parmi toutes les saisons qui couvrent cette nuit, je garde le coefficient le plus élevé. »_
C'est notre règle : Forte affluence (×1.60) l'emporte sur Haute saison (×1.30).

---

## Bloc 2 — `calcSousTotalChambre` : « combien coûte CETTE chambre sur tout le séjour ? »

```js
const calcSousTotalChambre = (prixBase, dateArrivee, dateDepart, saisons) => {
```

Une fonction qui prend le prix de base de la chambre, les dates d'arrivée et de départ, et les saisons. Elle rendra le **sous-total** de cette chambre.

```js
let total = 0;
```

On crée une variable `total` à 0, qu'on va **faire grossir** nuit après nuit.
On utilise `let` (et non `const`) parce que sa valeur va **changer**. `const` = valeur fixe, `let` = valeur modifiable.

```js
const jour = new Date(dateArrivee);
const fin = new Date(dateDepart);
```

`jour` = la date d'arrivée transformée en vraie date ; ce sera notre **curseur** qui avance nuit par nuit.
`fin` = la date de départ ; la **borne** où on s'arrête.
(Note : `jour` est en `const` mais c'est un **objet Date** ; on modifiera son contenu interne, pas la constante elle-même — c'est autorisé.)

```js
  while (jour < fin) {
```

Une **boucle `while`** : _« tant que mon curseur `jour` est avant la date de fin, recommence. »_
La nuit du départ n'est **pas** facturée (on s'arrête à `< fin`, pas `<= fin`) : c'est logique, on paie les nuits **dormies**, pas le jour où on s'en va.

while (jour < fin) {
total += Number(prixBase) \* getCoefficient(jour, saisons); // ← coef DE CETTE nuit
jour.setDate(jour.getDate() + 1); // ← nuit suivante
}

=> À chaque tour, getCoefficient(jour, ...) est rappelé avec la nuit courante → donc le coefficient peut changer d'une nuit à l'autre dans le même séjour.

```js
total += Number(prixBase) * getCoefficient(jour, saisons);
```

Le cœur du calcul, pour la nuit en cours :

- `getCoefficient(jour, saisons)` → le multiplicateur de cette nuit (vu au Bloc 1).
- `Number(prixBase) * ...` → prix de base × coefficient = prix réel de la nuit.
- `total += ...` → raccourci pour `total = total + ...` → _« j'ajoute ce prix au cumul. »_

```js
jour.setDate(jour.getDate() + 1);
```

_« J'avance mon curseur d'un jour. »_
`jour.getDate()` lit le numéro du jour (ex. 10), on ajoute 1, et `setDate(11)` repositionne le curseur au lendemain. Astuce : JS gère tout seul les fins de mois (le 28 février devient le 1er mars). Sans cette ligne, la boucle tournerait à l'infini !

```js
  }
```

Fin de la boucle : on remonte au `while`, qui re-teste la condition. Quand `jour` atteint `fin`, on sort.

```js
  return Math.round(total * 100) / 100;
};
```

On renvoie le total, **arrondi à 2 décimales**. L'astuce `Math.round(x * 100) / 100` :

- `total * 100` → on décale 2 chiffres (74,059 → 7405,9)
- `Math.round(...)` → arrondi à l'entier (7406)
- `/ 100` → on remet la virgule (74,06)
  Pourquoi ? Les calculs à virgule flottante peuvent donner `74.05999999` ; on nettoie pour de l'argent propre.

---

## Bloc 3 — `createReservation` : le chef d'orchestre

```js
export const createReservation = async (req, res) => {
```

`export` → cette fonction est utilisable ailleurs (par les routes).
`async` → la fonction contient des opérations **asynchrones** (des `await`, ex. les requêtes en base qui prennent du temps).
`(req, res)` → le couple Express : `req` = la requête reçue, `res` = la réponse qu'on va renvoyer.

```js
  try {
```

On entre dans un `try` : _« tente ce qui suit ; si une erreur surgit, saute au `catch` en bas »_. Filet de sécurité.

```js
const {
  client,
  date_arrivee,
  date_depart,
  nb_personnes,
  chambres,
  prestations = [],
} = req.body;
```

C'est de la **déstructuration** : on extrait d'un coup plusieurs propriétés de `req.body` (le JSON envoyé par le client) dans des variables du même nom.
Au lieu d'écrire `const client = req.body.client; const date_arrivee = req.body.date_arrivee; ...`, on fait tout en une fois.
`prestations = []` → **valeur par défaut** : si le client n'envoie pas de prestations, on prend un tableau vide (évite les plantages plus loin).

```js
const arrivee = new Date(date_arrivee);
const depart = new Date(date_depart);
const nbNuits = Math.round((depart - arrivee) / (1000 * 60 * 60 * 24));
```

On transforme les dates texte en vraies dates.
`depart - arrivee` : soustraire deux dates donne un écart en **millisecondes**.
`/ (1000 * 60 * 60 * 24)` : on convertit ces millisecondes en **jours** (1000 ms × 60 s × 60 min × 24 h = nombre de ms dans une journée).
`Math.round(...)` : arrondi pour éviter les soucis de changement d'heure (été/hiver).
Résultat : `nbNuits` = nombre de nuits du séjour.

```js
if (isNaN(arrivee) || isNaN(depart) || nbNuits < 1) {
  return res
    .status(400)
    .json({
      message: "Dates invalides (le départ doit être après l'arrivée).",
    });
}
```

Triple garde-fou : _« si l'arrivée n'est pas une date valide, OU le départ non plus, OU le séjour fait moins d'1 nuit... »_
`isNaN(...)` = _« est-ce que ce n'est PAS un nombre / une date valide ? »_ (`NaN` = "Not a Number").
`||` = _« OU »_.
Si l'une de ces conditions est vraie → on renvoie un **400** (mauvaise requête) et on **arrête tout** avec `return`.
`.status(400).json({...})` : on fixe le code HTTP puis on envoie un message JSON. Le `return` empêche le code de continuer.

```js
const chambresDB = await ReservationModel.getChambresByIds(chambres);
```

`await` → _« attends que la base réponde avant de continuer »_.
On demande au model les chambres correspondant aux ids reçus. `chambresDB` = les vraies chambres (avec leurs prix) tirées de la base.
⚠️ On utilise **les prix de la base, pas ceux envoyés par le client** : sécurité (on ne fait jamais confiance au navigateur).

```js
if (chambresDB.length !== chambres.length) {
  return res
    .status(400)
    .json({ message: "Une ou plusieurs chambres sont introuvables." });
}
```

_« Si le nombre de chambres trouvées en base ne correspond pas au nombre demandé... »_ → c'est qu'un id était bidon → 400 et stop.
Exemple : on demande `[4, 5, 999]` (3) mais la base n'en trouve que 2 → `2 !== 3` → erreur.

```js
const saisons = await ReservationModel.getSaisons();
```

On récupère toutes les saisons une bonne fois (pour les passer au calcul de prix).

```js
let montantTotal = 0;
const lignesChambres = chambresDB.map((ch) => {
  const sousTotal = calcSousTotalChambre(
    ch.prix_base,
    date_arrivee,
    date_depart,
    saisons,
  );
  montantTotal += sousTotal;
  return { chambre_id: ch.id, nb_nuits: nbNuits, sous_total: sousTotal };
});
```

`montantTotal` à 0, qu'on va cumuler.
`chambresDB.map((ch) => {...})` : _« pour chaque chambre `ch`, fabrique une "ligne" de réservation. »_
À l'intérieur, pour chaque chambre :

- `sousTotal = calcSousTotalChambre(...)` → on calcule son prix sur le séjour (Bloc 2).
- `montantTotal += sousTotal` → on l'ajoute au cumul global.
- `return { chambre_id, nb_nuits, sous_total }` → on renvoie un petit objet décrivant cette ligne.
  `.map` rassemble tous ces objets dans `lignesChambres` (un par chambre). C'est ce qu'on insérera plus tard dans `reservation_chambre`.

```js
    let lignesPrestations = [];
    if (prestations.length > 0) {
```

On prépare un tableau vide pour les options. _« S'il y a au moins une prestation demandée... »_ (sinon on saute tout ce bloc).

```js
const ids = prestations.map((p) => p.prestation_id);
const prestationsDB = await ReservationModel.getPrestationsByIds(ids);
```

`prestations.map((p) => p.prestation_id)` → on extrait juste les ids (ex. `[1]`).
Puis on va chercher en base les vraies prestations (pour avoir leurs **vrais prix**).

```js
      for (const p of prestations) {
        const presta = prestationsDB.find((x) => x.id === p.prestation_id);
```

Une boucle `for...of` : _« pour chaque prestation `p` demandée par le client... »_
`prestationsDB.find((x) => x.id === p.prestation_id)` : _« retrouve dans les prestations de la base celle dont l'id correspond. »_
`.find` rend **le premier élément** qui matche (ou `undefined` si rien).

```js
if (!presta) {
  return res
    .status(400)
    .json({ message: "Une ou plusieurs prestations sont introuvables." });
}
```

`!presta` → _« si on n'a rien trouvé »_ (`!` = NON ; `undefined` est considéré « faux »).
→ id bidon → 400 et stop.

```js
        montantTotal += Number(presta.prix) * p.quantite;
        lignesPrestations.push({
          prestation_id: p.prestation_id,
          quantite: p.quantite,
          prix_unitaire: presta.prix,
        });
      }
    }
```

- `Number(presta.prix) * p.quantite` → prix de l'option × quantité (ex. ménage 6 € × 2 = 12 €).
- `montantTotal += ...` → ajouté au cumul.
- `lignesPrestations.push({...})` → _« ajoute cette ligne d'option au tableau. »_ `.push` ajoute un élément à la fin.
- On stocke `prix_unitaire: presta.prix` → le prix **figé** au moment de la résa.

```js
montantTotal = Math.round(montantTotal * 100) / 100;
const montantAcompte = Math.round(montantTotal * 0.3 * 100) / 100;
```

On arrondit le total à 2 décimales (même astuce qu'avant).
L'acompte = 30 % du total, arrondi pareil. `* 0.3` = trente pour cent.

```js
const token = randomUUID();
```

On génère un **identifiant unique aléatoire** (ex. `b7e8c1a2-...`). C'est le sésame qui ira dans le lien email pour que le client suive sa résa **sans compte**.

```js
const data = {
  client,
  date_arrivee,
  date_depart,
  nb_personnes,
  montant_total: montantTotal,
  montant_acompte: montantAcompte,
  token_suivi: token,
  chambres: lignesChambres,
  prestations: lignesPrestations,
};
```

On range **tout ce qu'on a préparé** dans un seul objet `data`, prêt à être inséré en base.
Astuce : écrire `client,` tout seul équivaut à `client: client` (raccourci quand la variable porte le même nom que la clé).

```js
const result = await ReservationModel.createReservation(data);
```

On confie `data` au model, qui fait la **transaction** (vérif dispo + insertions). On attend (`await`) son retour dans `result`.
👉 À partir d'ici, tu as dit que tu comprends le reste (on renvoie la réponse `201`, et le `catch` gère les erreurs).

---

## 🔬 Zooms ultra-littéraux (lecture symbole par symbole)

Ici on prend les expressions les plus denses et on les lit **token par token**, comme un débutant total. Une « callback » = une fonction qu'on **donne** à une autre fonction, et que celle-ci appellera elle-même.

---

### Zoom 1 — `(s) => date >= new Date(s.date_debut) && date <= new Date(s.date_fin)`

Cette ligne est une **fonction** donnée à `.filter`. `.filter` va l'appeler **une fois pour chaque saison**, en mettant la saison courante dans `s`. La fonction doit répondre **vrai** (on garde) ou **faux** (on jette).

Lecture mot à mot :

- `(s)` → _« je reçois une saison, je l'appelle `s` »_. Je ne choisis pas `s` moi-même : c'est `.filter` qui me la donne, une par une.
- `=>` → _« ...et voici ce que je réponds : »_
- `date` → la nuit qu'on examine (passée à `getCoefficient`).
- `>=` → _« supérieure ou égale à »_.
- `new Date(s.date_debut)` → le début de la saison `s`, converti de texte (`"2026-02-01"`) en vraie date.
- → donc `date >= new Date(s.date_debut)` se lit : _« ma nuit tombe-t-elle au début de la saison ou après ? »_ → répond `true` ou `false`.
- `&&` → _« ET »_ (les DEUX côtés doivent être vrais pour que le total soit vrai).
- `date <= new Date(s.date_fin)` → _« ma nuit tombe-t-elle avant ou pile à la fin de la saison ? »_

Bilan : _« garde cette saison seulement si ma nuit est COMPRISE entre son début et sa fin. »_
Exemple concret : nuit = 12 février. Saison "Forte affluence" = 1 → 28 février. `12 >= 1` (vrai) `&&` `12 <= 28` (vrai) → `true` → on garde. Saison "Basse" = juin→août → `12 février >= 1 juin` est faux → `false` → on jette.

---

### Zoom 2 — `Math.max(...matches.map((s) => Number(s.coefficient)))`

On déballe **de l'intérieur vers l'extérieur**, couche par couche.

1. `(s) => Number(s.coefficient)` → une mini-fonction : _« pour une saison `s`, donne son coefficient transformé en nombre »_. `Number("1.60")` devient `1.60` (sinon ça reste du texte, et `"1.60" > "1.30"` comparé en texte est dangereux).
2. `matches.map(...)` → _« applique cette mini-fonction à chaque saison gardée »_. Si `matches` = 2 saisons, on obtient un tableau de 2 nombres, ex. `[1.30, 1.60]`.
3. `...` (le **spread**) → _« étale ce tableau »_. `Math.max` n'accepte pas un tableau, mais des arguments séparés. Donc :
   - ❌ `Math.max([1.30, 1.60])` → ne sait pas faire → renvoie `NaN`.
   - ✅ `Math.max(...[1.30, 1.60])` → devient `Math.max(1.30, 1.60)`.
4. `Math.max(...)` → _« le plus grand des nombres »_ → `1.60`.

Résultat : on récupère le coefficient le plus élevé parmi les saisons qui chevauchent.

---

### Zoom 3 — `jour.setDate(jour.getDate() + 1)`

Fait avancer le curseur d'**un** jour. On lit de l'intérieur :

- `jour.getDate()` → _« quel est le numéro du jour ? »_ (ex. le 12 → renvoie `12`). ⚠️ `getDate` = jour du mois, à ne pas confondre avec `getDay` (jour de la semaine).
- `+ 1` → _« le lendemain »_ → `13`.
- `jour.setDate(13)` → _« repositionne le curseur au 13 »_.

Magie utile : si on est le 28 février et qu'on fait `setDate(29)` (qui n'existe pas), JS bascule **tout seul** au 1er mars. On n'a jamais à gérer les fins de mois nous-mêmes.

---

### Zoom 4 — `Math.round(total * 100) / 100`

Sert à arrondir une somme d'argent à 2 décimales proprement. Étapes avec un exemple (`total = 74.059`) :

- `total * 100` → `7405.9` (on pousse la virgule de 2 crans vers la droite).
- `Math.round(7405.9)` → `7406` (arrondi à l'entier le plus proche).
- `/ 100` → `74.06` (on ramène la virgule).

Pourquoi ce détour ? Parce qu'en informatique `0.1 + 0.2` ne fait pas exactement `0.3` (les nombres à virgule sont approximés en binaire). Pour de l'argent, on **force** un arrondi net à 2 chiffres.

---

### Zoom 5 — `const nbNuits = Math.round((depart - arrivee) / (1000 * 60 * 60 * 24))`

Calcule le nombre de nuits entre deux dates.

- `depart - arrivee` → soustraire deux dates donne un nombre de **millisecondes** d'écart (JS convertit les dates en nombre pour le calcul).
- `1000 * 60 * 60 * 24` → le nombre de millisecondes dans **une journée** : 1000 ms × 60 (secondes) × 60 (minutes) × 24 (heures) = `86 400 000`.
- `(...) / (...)` → millisecondes d'écart ÷ millisecondes par jour = **nombre de jours**.
- `Math.round(...)` → arrondi de sécurité (le passage à l'heure d'été/hiver peut donner 3,99 ou 4,01 jour ; on veut `4`).

---

### Zoom 6 — `if (isNaN(arrivee) || isNaN(depart) || nbNuits < 1)`

Trois tests reliés par des « OU » : si **au moins un** est vrai, on bloque.

- `isNaN(arrivee)` → _« arrivee n'est-elle PAS une date valide ? »_. `isNaN` = "is Not a Number". Si on a écrit `new Date("nimporte")`, ça donne une date invalide → `isNaN` répond `true`.
- `||` → _« OU »_.
- `isNaN(depart)` → pareil pour le départ.
- `nbNuits < 1` → _« le séjour fait-il moins d'une nuit ? »_ (départ avant ou égal à l'arrivée).

Si l'ensemble est vrai → `return res.status(400)...` : on renvoie une erreur **et** on stoppe net (le `return` empêche la suite de s'exécuter).

---

### Zoom 7 — `const { client, date_arrivee, prestations = [] } = req.body`

C'est de la **déstructuration**. `req.body` est l'objet JSON envoyé par le client, ex. :

```json
{ "client": {...}, "date_arrivee": "2026-03-10", "chambres": [4,5] }
```

- `const { client }` → _« crée une variable `client` et mets-y `req.body.client` »_. Le nom entre accolades doit correspondre à une clé du JSON.
- On en extrait plusieurs d'un coup au lieu d'écrire `const client = req.body.client; const date_arrivee = req.body.date_arrivee; ...`
- `prestations = []` → **valeur par défaut** : _« si `req.body.prestations` n'existe pas, prends un tableau vide »_. Ça évite un plantage si le client ne commande aucune option.

---

### Zoom 8 — `chambresDB.map((ch) => { ... return { chambre_id: ch.id, nb_nuits: nbNuits, sous_total: sousTotal }; })`

`.map` = _« transforme chaque chambre en autre chose, et range le tout dans un nouveau tableau »_.

- `(ch) => { ... }` → pour chaque chambre `ch` venue de la base...
- ...on calcule son `sousTotal`, on l'ajoute au cumul `montantTotal`...
- ...puis `return { chambre_id: ch.id, ... }` → on **fabrique un petit objet** décrivant la ligne.
- `chambre_id: ch.id` → la clé `chambre_id` reçoit la valeur `ch.id`.

À la fin, `lignesChambres` contient un objet par chambre. C'est exactement ce qu'on insérera dans la table `reservation_chambre`.

---

### Zoom 9 — `const presta = prestationsDB.find((x) => x.id === p.prestation_id)`

`.find` = _« rends-moi le PREMIER élément qui passe le test (ou rien) »_.

- `(x) => x.id === p.prestation_id` → _« cette prestation `x` (venue de la base) a-t-elle le même id que celle demandée par le client (`p`) ? »_
- `===` → égalité **stricte** (même valeur ET même type).
- Si trouvée → `presta` = l'objet prestation (avec son vrai prix). Si rien → `presta` vaut `undefined`.

Ligne suivante `if (!presta)` → `!` = _« NON »_. `!undefined` vaut `true`. Donc _« si on n'a rien trouvé, erreur 400 »_. On se sert du **vrai prix de la base** (`presta.prix`), jamais d'un prix envoyé par le client → sécurité.

---

### Zoom 10 — `lignesPrestations.push({ prestation_id: p.prestation_id, quantite: p.quantite, prix_unitaire: presta.prix })`

`.push(...)` = _« ajoute cet élément à la FIN du tableau »_.
On ajoute un objet décrivant la ligne d'option : quelle prestation, en quelle quantité, à quel prix figé (`presta.prix`, le prix au moment de la résa). Ce tableau servira à remplir `reservation_prestation`.

---

### Zoom 11 — `const montantAcompte = Math.round(montantTotal * 0.3 * 100) / 100`

- `montantTotal * 0.3` → 30 % du total (`0.3` = trente pour cent).
- `* 100 ... / 100` avec `Math.round` → l'arrondi propre à 2 décimales (voir Zoom 4).

Exemple : total `740` → `740 * 0.3 = 222` → acompte `222 €`.

---

### Zoom 12 — l'objet `data` et le raccourci `client,`

```js
const data = { client, date_arrivee, ... montant_total: montantTotal, ... };
```

- `client,` tout seul est un **raccourci** de `client: client` : quand la clé et la variable portent le même nom, on n'écrit qu'une fois.
- `montant_total: montantTotal` : ici la clé (`montant_total`, comme la colonne SQL) diffère du nom de variable (`montantTotal`), donc on écrit les deux.

On regroupe tout dans un seul paquet `data` pour le passer proprement au model (qui fera la transaction).

---

## Récap des notions JS croisées

| Notion                              | En une phrase                                   |
| ----------------------------------- | ----------------------------------------------- |
| `=>` fonction fléchée               | une façon courte d'écrire une fonction          |
| déstructuration `const { a } = obj` | extraire des propriétés d'un objet en variables |
| valeur par défaut `= []`            | valeur de secours si rien n'est fourni          |
| `.filter`                           | garder les éléments qui passent un test         |
| `.map`                              | transformer chaque élément en autre chose       |
| `.find`                             | trouver le premier élément qui matche           |
| `.push`                             | ajouter un élément à la fin d'un tableau        |
| spread `...`                        | étaler un tableau en arguments séparés          |
| `Math.max` / `Math.round`           | le plus grand / arrondir                        |
| `new Date()` + soustraction         | manipuler et comparer des dates                 |
| `async` / `await`                   | attendre une opération longue (base de données) |
| `Math.round(x*100)/100 `            | arrondir proprement à 2 décimales (argent)      |
| `===` / `!` / `\|\|` / `&&`         | égal strict / non / ou / et                     |
