# Plan — Refonte du parcours de réservation (Airbnb-like, sans panier)

> Objectif : réduire les clics et fluidifier. Inspiré d'Airbnb, MAIS adapté au
> modèle multi-chambres / dates communes. Pas de panier (le récap sticky EST le panier).
> Décision validée : **1 réservation = 1 créneau de dates commun à toutes les chambres.**

---

## 1. Ce qui change vs l'existant

| Avant | Après |
|---|---|
| Page Hébergement = liste de cartes → clic → page détail → bouton Réserver → page /reservation qui RE-demande les dates | Page Hébergement = **on compose son séjour sur place** (dates + voyageurs + sélection + récap) |
| Tunnel `/reservation` séparé qui redemande tout | Le tunnel ne garde que les **dernières étapes** (coordonnées + confirmation), alimenté par le récap |
| Beaucoup de clics, dates saisies 2 fois | Dates saisies **une seule fois**, tôt, et filtrent par capacité |

---

## 2. La nouvelle page Hébergement (cœur du parcours)

Structure verticale :

```
┌─────────────────────────────────────────────┐
│  BARRE DE RECHERCHE (en haut, sticky léger)  │
│  [Arrivée] [Départ] [Voyageurs ▼]            │
└─────────────────────────────────────────────┘
        ↓ (filtre : dispo sur dates + capacité >= voyageurs)
┌──────────────────────────┬──────────────────┐
│  LISTE CHAMBRES (gauche) │  RÉCAP "séjour"  │
│                          │  (droite, sticky)│
│  ┌────────────────────┐  │                  │
│  │ [carrousel] | desc │  │  Vos dates       │
│  │  images     | +    │  │  Chambres ajoutées│
│  │             | voir+│  │  Prix live       │
│  └────────────────────┘  │  Acompte/solde   │
│  (reveal au scroll)      │  [Continuer]     │
│  ...                     │                  │
└──────────────────────────┴──────────────────┘
```

### a) Barre de recherche (haut)
- Champs **Arrivée / Départ / Voyageurs**.
- Tant que dates non valides → on affiche les chambres en mode "vitrine" (consultation),
  sans bouton "ajouter" (ou bouton désactivé invitant à choisir les dates).
- Dès dates valides → appel `/chambres/disponibles`. **TOUTES les chambres dispo
  restent visibles et sélectionnables** (PAS de masquage/grisage selon la capacité).

### a-bis) Capacité = validation CUMULÉE (multi-chambres), pas un filtre
- Modèle multi-chambres : une famille de 12 compose plusieurs chambres dont la
  SOMME des capacités ≥ 12. Donc il faut voir TOUTES les chambres pour les combiner.
- Règle : `capacité cumulée = Σ capacite des chambres sélectionnées` ;
  réservation valide ⟺ `capacité cumulée ≥ voyageurs`.
- Feedback LIVE dans le récap : « Capacité : 4 / 12 voyageurs ».
- Le bouton **"Continuer" reste désactivé** tant que `capacité cumulée < voyageurs`,
  avec message clair (« Ajoutez des chambres : vos chambres accueillent 4 personnes
  sur 12 »). → on INFORME/ORIENTE, on ne cache jamais.

### b) Carte chambre enrichie (2 colonnes)
- **Gauche** : carrousel d'images (ou image principale au début, carrousel = passe DA).
- **Droite** : nom, infos (capacité, surface, vue), début de description, prix/nuit.
- Boutons : **"Ajouter au séjour"** (alimente le récap) + **"Voir plus"** (→ page dédiée).
- **Reveal au scroll** (fade + translateY) = effet déjà prévu dans la DA.

### c) Récap "séjour" (droite, sticky) = l'ex-panier
- Reprend le composant `RecapPrix` qu'on a DÉJÀ construit.
- Liste les chambres ajoutées + options + prix live (via `/estimation`).
- Bouton **"Continuer"** → étape coordonnées.
- Sur mobile : passe en bas (déjà géré).

---

## 3. La page chambre dédiée (immersive)
- Accessible via "Voir plus" ou clic sur la carte.
- Carrousel grand format, description complète, équipements, vue.
- Même bouton **"Ajouter au séjour"** (qui renvoie ensuite vers Hébergement/récap,
  ou ouvre le récap en overlay sur mobile).
- Sert à se PROJETER avant d'ajouter (le client hésitant).

---

## 4. L'état partagé : le vrai défi technique

Aujourd'hui, l'état du séjour (dates, sélection, options) vit dans la page `Reservation`.
Mais maintenant il doit être partagé entre **Hébergement**, **page chambre dédiée** et
**étape coordonnées**. → On le remonte dans un **Context** (comme AuthContext) :

```
ReservationContext  (nouveau)
  - dates (arrivée, départ), voyageurs
  - chambres sélectionnées
  - options (ménage par chambre, etc.)
  - fonctions : ajouter/retirer chambre, set dates, etc.
```

→ Toutes les pages lisent/écrivent ce contexte. Le récap sticky le lit. Cohérent et propre.
(C'est le même pattern que l'auth : un Context = une donnée partagée par toute l'app.)

---

## 5. Le parcours final (nombre de clics réduit)

```
1. Page Hébergement : saisir dates + voyageurs       (1 action)
2. Cliquer "Ajouter au séjour" sur 1+ chambres        (1 clic/chambre)
3. (optionnel) options dans le récap
4. "Continuer" → coordonnées                          (1 clic)
5. "Confirmer" → création + page confirmation         (1 clic)
```
vs l'ancien : hébergement → carte → détail → réserver → dates → ... (5-6 clics avant même de choisir).

---

## 6. Étapes de mise en œuvre (proposées, par ordre)

1. **Créer `ReservationContext`** (état séjour partagé) + le brancher dans App.
2. **Refondre la page Hébergement** : barre dates/voyageurs + filtre capacité + cartes 2 colonnes + "Ajouter au séjour".
3. **Déplacer le récap sticky** sur la page Hébergement (réutilise `RecapPrix`).
4. **Adapter la page chambre dédiée** : bouton "Ajouter au séjour".
5. **Simplifier `/reservation`** : ne garde que coordonnées + confirmation (plus de saisie dates/chambres, lues depuis le contexte). Rediriger vers Hébergement si le séjour est vide.
6. **Nettoyer** : retirer les doublons (l'ancien bloc dates/chambres du tunnel).
7. (Passe DA ensuite : carrousel, reveal, spacing — déjà au backlog.)

---

## 6-bis. Décisions UX complémentaires (validées 2026-05-31)

- **Deux objets DISTINCTS** (ne pas confondre) :
  - le **Sélecteur de séjour** = saisir dates + voyageurs (drawer) ;
  - le **Récap de séjour** = voir les chambres ajoutées + prix (sticky). Déjà construit.
- **Drawer en OVERLAY** (panneau qui glisse depuis la droite, fond assombri) — PAS de push
  du contenu (casse la mise en page, galère responsive). Pattern type Airbnb.
- **Calendrier** : bibliothèque **`react-day-picker`** (sélection de plage, dates
  désactivées, stylable SCSS à la DA). React ne fournit aucun calendrier natif ;
  on n'écrit pas un calendrier à la main (trop de pièges). Le reste (drawer, compteurs,
  récap, logique dispo) = notre code.
- **Voyageurs = adultes + enfants** séparés CÔTÉ FRONT uniquement (UX pro, "1 mineur ne
  réserve pas seul" → validation ≥ 1 adulte). On envoie le TOTAL dans `nb_personnes`
  à l'API. AUCUN changement de base (pas de colonne nb_adultes/nb_enfants).
- **Bouton chambre adaptatif** selon l'état des dates dans le contexte :
  - pas de dates → "Réserver" ouvre le sélecteur de séjour ;
  - dates saisies + dispo → "Ajouter au séjour" → devient "✓ Ajouté" ;
  - dates saisies + indispo → "Indisponible sur ces dates" (désactivé).
- **Après ajout** : PAS de redirection. Bouton "✓ Ajouté" + 2 routes proposées
  ("Voir les autres chambres" / "Voir ma réservation"). Récap/indicateur séjour
  accessible en permanence.
- **Options** : à l'étape COORDONNÉES (juste avant paiement), avec récap prix qui
  réagit EN DIRECT aux sélections d'options (via /estimation).
- **Page "Nos chambres"** : liste 2 colonnes pleine largeur (carrousel images gauche /
  desc droite), CTA "Plus d'informations" + "Réserver". Récupère le vide à droite.

## 7. Ce qu'on NE fait PAS (décidé)
- ❌ Pas de panier navbar (le récap sticky suffit).
- ❌ Pas de dates différentes par chambre (1 résa = 1 créneau commun).
- ❌ Pas de modification de résa déjà créée pour l'instant (éventuelle feature v2).
- ❌ Pas de masquage/grisage des chambres selon capacité (validation cumulée à la place).
- ❌ Pas de stockage adultes/enfants en base (front only, total envoyé).

---

## 8. Risques / points d'attention
- **Ampleur** : c'est une réorganisation, pas un petit ajout. Mais on réutilise beaucoup
  (RecapPrix, estimation, dispo, filtre capacité existent déjà).
- **Filtre capacité** : décider si chambre trop petite = masquée ou grisée+désactivée
  (grisée = le client voit qu'elle existe mais comprend pourquoi il ne peut pas).
- **Page chambre + ajout** : sur mobile, après "ajouter", où va le client ? (retour
  Hébergement avec récap visible = le plus simple).
