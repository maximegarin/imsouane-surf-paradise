# Imsouane Surf Paradise — Refonte du site

> Refonte complète du site du homestay surf familial à Imsouane (Maroc).
> Projet final TP Développeur·euse Web & Web Mobile — AFEC Bayonne.
> Également livrable professionnel réel pour le commanditaire (le père du développeur).

---

## 1. Contexte & enjeux

- **Double enjeu** : soutenance devant jury + site de production pour le client.
- **Date de soutenance** : 17 juin 2026.
- **Positionnement** : *« Pas un resort. Une maison de famille qui surfe. »*
  Ancienne maison de famille, ambiance authentique, calme et chaleureuse.
- **Concurrent direct** : Olo Surf & Nature (olosurfnature.com) — plus commercial,
  perçu comme « sans âme ». Différenciateur = **authenticité réelle** vs marketée.
- **Site actuel** : https://www.imsouane-surf-paradise.com/fr
  Stack héritée à remplacer (jQuery, jQuery UI, Flickity, Masonry, AOS, Bootstrap 3.4.1).

### Compétences visées (référentiel TP)
- **CCP1 — Front-end** : maquetter, UI statique & adaptable, UI dynamique, solution de gestion de contenu.
- **CCP2 — Back-end** : créer une base de données, composants d'accès aux données, back-end, composants de gestion de contenu.

---

## 2. Stack technique (confirmée)

| Couche | Choix |
|---|---|
| **Architecture** | MVC découplée : front et API REST séparés |
| **Front** | React + Vite (point d'entrée `main.jsx`), SCSS Modules |
| **API** | Express, architecture en couches numérotées (`1_config` → `5_routes`) |
| **Base de données** | MySQL (phpMyAdmin), SQL **brut** via `mysql2` (requêtes préparées) |
| **Sécurité** | Helmet · Zod (validation) · JWT (auth) · argon2 (hash mots de passe) |
| **Paiement** | Stripe (acompte 30 % + solde, ou paiement total) |
| **Images** | Cloudinary |
| **CMS** | Back-office admin **maison** (pas de CMS tiers) |
| **Hébergement** | À décider (Railway ou VPS) — 2 services : front + API |

### Justification des choix
- Réutilise l'architecture déjà maîtrisée (projet d'apprentissage `password-manager-api`).
- Séparation front/back nette → couvre proprement CCP1 et CCP2.
- SQL brut sur MySQL → défendable devant un jury qui a enseigné phpMyAdmin.
- Risque minimal compte tenu du délai serré.

### Compromis assumé
- Vite génère une SPA (rendu client) → **SEO plus faible** qu'un rendu serveur.
  À mitiger en fin de parcours : prerendering / pages vitrine pré-rendues + balises meta.

---

## 3. Direction artistique

**Typographie**
- Titres : **Young Serif** (chaleureux, artisanal)
- Corps : **Inter**

**Palette**
| Rôle | Couleur |
|---|---|
| Blanc vieilli (murs à la chaux) | `#F5F0E8` |
| Terracotta doux (tuiles) | `#B85C38` |
| Sable ocre (plage) | `#D4A96A` |
| Vert eucalyptus (jardin) | `#4A6741` |
| Encre marine (océan le soir) | `#1C2B3A` |

**Références visuelles**
- omaivillas.com — animations, apparition des images au scroll
- toadandco.com — esprit typographique

**Références d'esprit DA** (respiration, chaleur, sobriété, chill/spirituel)
- apartamentomagazine.com — éditorial, mise en page aérée
- masseriamoroseta.it — hôtellerie authentique, pierre/lumière, lenteur
- kinfolk.com — sobriété chaleureuse, beaucoup de blanc, typo serif
- pilgrimsurfsupply.com — surf premium, sobre
- mollusksurfshop.com — surf, artisanal et âme
- readcereal.com — travel/lifestyle, respiration extrême, minimalisme chaud

> Fil conducteur : **respiration des pages** (vide assumé), **chaleur des typos**,
> **sobriété sans froideur**, ambiance **chill voire spirituelle** du lieu.

**Effets cibles** : reveal par `clip-path`, fade + translateY au scroll (Intersection Observer),
zoom subtil du hero au chargement, grain film léger sur les sections.

---

## 4. Modèle de données

### Hébergements (7 chambres privées)

| Chambre | Capacité | Surface | Tarif (dès) | Atout |
|---|---|---|---|---|
| Argana Wooden Appartement | 5 | 60 m² | 99 € | appartement bois |
| Loubana | 4 | — | 75 € | — |
| Maazouza Appartement | 4 | 62 m² | 99 € | salon + cuisine |
| Mauringa 2 | 2 | 16 m² | 70 € | douche privative |
| Mauringa 1 | 2 | 12 m² | 70 € | terrasse + vue mer |
| Lazulite | 3 | 47 m² | 79 € | vue mer |
| Tamsrite | 4 | 30 m² | 79 € | suite familiale, terrasse, vue spot |

> ⚠️ Nommage « Mauringa 1 & 2 » à revoir côté contenu (ex. *Mauringa Terrasse* / *Mauringa Océan*).
> ⚠️ Tarifs « à partir de » = prix variables. Pour le 17 juin : garder un `prix_base` simple ;
> tarif saisonnier = évolution v2. On stocke un **prix figé (snapshot)** sur chaque réservation
> pour préserver l'historique même si les tarifs changent ensuite.

### Décisions de modélisation

- **Clients = guest checkout** (pas de compte). On stocke le client en base
  (nom, email, téléphone, consentement marketing RGPD). Suivi de réservation via un
  **token unique** dans un lien envoyé par email (pas de mot de passe).
  Terrain prévu pour ajouter des comptes plus tard (`password_hash`, `email_verifie`).
- **RBAC — 3 rôles** dans une seule table admin (colonne `role`) :
  - `super_admin` : le développeur — accès total
  - `admin` : le père — gestion complète
  - `gestionnaire` : gérant sur place — **réservations uniquement**
  - Contrôle via un `roleMiddleware` en plus du `authMiddleware` (JWT).
- **Petit-déjeuner inclus** (non modélisé).
- **Option ménage (+6 €)** modélisée dans une table `prestation` **unifiée** avec
  les futurs **packs surf** (colonne `categorie`).
- **Paiement** : table dédiée pour historiser acompte puis solde (2 transactions Stripe).

### Tables prévues
```
client                 — voyageurs (guest checkout)
admin                  — staff + rôle (RBAC)
chambre                — les 7 hébergements
photo                  — images d'une chambre (Cloudinary)
reservation            — un séjour
reservation_chambre    — liaison N..M (résa ↔ chambres), avec prix figé
prestation             — options payantes (ménage, futurs packs surf)
reservation_prestation — liaison N..M (résa ↔ prestations)
paiement               — transactions Stripe (acompte / solde)
```

---

## 5. Notes UX (côté front)
- Rassurer le client sur sa réservation : page de confirmation soignée, email récapitulatif,
  page « état de ma réservation » accessible via le token, badges de confiance.

### Backlog UI/UX (à traiter dans la passe DA, après le fonctionnel)
- [ ] **Navbar responsive** : pas de menu burger sur mobile (Header déborde). → menu burger < 768px.
- [ ] **Tunnel — spacing** : les chambres apparaissent trop bas dans la page, peu engageant.
      Revoir le rythme vertical / la respiration (le bloc dates prend trop de place avant les chambres).
- [ ] **Tunnel — visuel chambres** : ajouter une image représentative par chambre (façon Airbnb desktop),
      voire un petit carrousel d'images. Rend la sélection désirable (actuellement texte seul).
- [ ] **Général** : passe DA complète (hero accueil, photos, animations clip-path/reveal,
      grain film, transitions douces) — esprit Cereal/Kinfolk/Masseria Moroseta.
- [ ] **SEO** : meta par page + prerendering des pages vitrine (compromis SPA Vite), en toute fin.
- [ ] **Multilingue (i18n)** : site FR uniquement pour le jury. En PROD (clientèle surf
      internationale), prévoir FR/EN/DE via react-i18next (extraire tous les textes,
      fichiers de traduction, locale dynamique du calendrier date-fns). Gros chantier = post-jury.

---

## 6. Méthode de travail
- **Pas de vibe coding** : comprendre et maîtriser chaque couche, conventions de nommage
  standards (sérieux attendu par le jury).
- Ordre prévu : modèle de données (MCD → MLD → SQL) → scaffold API → premier CRUD complet
  → branchement front → Stripe → back-office admin → polish DA.

---

## 7. Référence d'architecture
Projet d'apprentissage à calquer (MVC en couches, sécurité Express) :
`Pays-Basque-Digital-Annuaire-2.0/AMBIANCES ADHERENTS/password-manager-api-main`
