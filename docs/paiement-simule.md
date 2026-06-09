# Le paiement (mode simulé) — comprendre en profondeur

> Objectif : maîtriser **comment** fonctionne notre étape de paiement, **pourquoi**
> elle est construite ainsi, et en quoi elle reproduit fidèlement la logique d'un
> vrai paiement (Stripe) — pour pouvoir le **présenter au jury** avec assurance.
>
> Rappel : on a choisi le **mode simulé** (pas de vrai compte Stripe). Mais
> l'architecture est **identique** à du vrai paiement : seule l'étape « la banque
> encaisse » est remplacée par un clic. Voir aussi `docs/stripe-fonctionnement.md`.

---

## 1. L'idée en une phrase

> Notre serveur **enregistre une intention de paiement** (l'acompte à régler),
> le client **déclenche le paiement**, et notre serveur **confirme** que c'est
> payé puis met à jour la réservation. En vrai Stripe, l'étape « confirmer » serait
> déclenchée par la banque (webhook). Chez nous, elle est déclenchée par un clic.

---

## 2. Les 3 états d'un paiement (vocabulaire)

Un paiement n'est pas binaire (« payé / pas payé »). Il a un **cycle de vie** :

| Statut | Signification |
|---|---|
| `en_attente` | l'intention existe, l'argent n'est pas (encore) encaissé |
| `reussi` | le paiement est confirmé, l'argent est « rentré » |
| `echoue` | la tentative a échoué (carte refusée…) |
| `rembourse` | (plus tard) l'argent a été rendu |

→ On stocke ça dans la table `paiement` (colonne `statut`). C'est ce qui permet de
savoir **exactement où en est l'argent** à tout moment.

---

## 3. Pourquoi DEUX étapes (initier puis confirmer) ?

C'est LE point clé, et c'est exactement ce que fait Stripe.

```
ÉTAPE A — INITIER : "je crée une intention de payer 207,90 €"
   → le serveur enregistre une ligne paiement (statut: en_attente)
   → il renvoie une référence

ÉTAPE B — CONFIRMER : "c'est payé !"
   → le serveur passe la ligne à statut: reussi
   → il met la réservation à statut: acompte_paye
```

**Pourquoi ne pas tout faire en une fois ?** Parce qu'entre A et B, il se passe
quelque chose qu'on ne contrôle pas : le client saisit sa carte, la banque vérifie,
accepte ou refuse. Ce délai impose de **séparer** « j'ai l'intention » de « c'est
confirmé ». En vrai Stripe :

- **A** = créer un *PaymentIntent* (côté serveur),
- entre les deux = Stripe encaisse la carte (le serveur ne voit jamais la carte),
- **B** = Stripe envoie un *webhook* « payment_intent.succeeded » au serveur.

Chez nous (simulé), l'étape « la banque encaisse » est remplacée par le **clic du
client sur "Payer"**, qui appelle directement l'étape B. **Tout le reste est identique.**

---

## 4. Le flux complet de NOTRE code (front + back)

```
1. Page /reservation : le client clique "Procéder au paiement de l'acompte"
        ↓
2. FRONT : POST /api/reservations
   → crée la réservation (statut: en_attente), renvoie { reservation_id, token_suivi }
        ↓
3. FRONT : navigate vers /reservation/paiement/:reservationId/:token
        ↓
4. PAGE PAIEMENT (au montage) : POST /api/paiements/acompte/:reservationId   [ÉTAPE A]
   → le BACK relit le montant de l'acompte EN BASE (jamais le front !)
   → crée une ligne paiement (type: acompte, statut: en_attente, référence "SIMU-...")
   → renvoie { paiement_id, montant }
        ↓
5. PAGE PAIEMENT : affiche le montant + un (faux) formulaire de carte
        ↓
6. Le client clique "Payer 207,90 €"
        ↓
7. FRONT : POST /api/paiements/:paiement_id/confirmer                         [ÉTAPE B]
   → le BACK passe le paiement à statut: reussi (+ date_paiement)
   → met la réservation à statut: acompte_paye
   → (idempotent : rejouer cet appel ne double rien)
        ↓
8. FRONT : navigate vers /reservation/confirmation/:token
   → "On a hâte de vous accueillir 🌊" + récap + acompte payé
```

---

## 5. Les fichiers concernés (où regarder)

**Back :**
| Fichier | Rôle |
|---|---|
| `2_models/paiement.model.js` | accès SQL : créer paiement, marquer réussi (idempotent), historique |
| `4_controllers/paiement.controller.js` | `initierAcompte` (étape A), `confirmerPaiement` (étape B) |
| `5_routes/paiement.routes.js` | les routes `/paiements/acompte/:id`, `/paiements/:id/confirmer` |

**Front :**
| Fichier | Rôle |
|---|---|
| `pages/Reservation/Reservation.jsx` | crée la résa → redirige vers la page paiement |
| `pages/Paiement/Paiement.jsx` | initie l'acompte (A), affiche le formulaire, confirme (B) |
| `App.jsx` | route `/reservation/paiement/:reservationId/:token` |

---

## 6. Les 4 principes de sécurité (à dire au jury) 🔒

Même en simulé, on applique les VRAIES règles de sécurité d'un paiement :

1. **Le montant est recalculé/relu CÔTÉ SERVEUR.** La page paiement n'envoie PAS le
   montant : c'est le back qui le relit en base (`reservation.montant_acompte`).
   → Impossible pour un client de modifier le prix dans le navigateur et payer 1 €.

2. **Le serveur ne voit jamais la carte.** Notre formulaire de carte est purement
   visuel (rien n'est envoyé). En vrai Stripe, la carte va directement à Stripe,
   jamais à notre serveur (conformité PCI-DSS).

3. **Idempotence.** Le `marquerPaiementReussi` contient `AND statut <> 'reussi'` :
   si l'étape B est rejouée (double-clic, webhook envoyé 2 fois par Stripe…), on ne
   crée pas deux paiements, on ne double pas le statut. Robuste.

4. **La confirmation fait foi, pas l'affichage.** C'est l'étape B (serveur) qui
   décide qu'un paiement est réussi et met à jour la base — pas un simple affichage
   front. En vrai, ce serait le webhook signé de Stripe.

---

## 7. Ce qui change pour passer en VRAI Stripe (plus tard)

Bonne nouvelle : **presque rien dans notre architecture**. Seule l'étape B change
de déclencheur :

| | Simulé (maintenant) | Vrai Stripe (prod) |
|---|---|---|
| Étape A (initier) | POST /paiements/acompte/:id | idem + créer un PaymentIntent Stripe |
| Saisie carte | faux formulaire | Stripe Elements / Checkout (carte → Stripe) |
| Étape B (confirmer) | le client clique "Payer" | **webhook signé** envoyé par Stripe |
| Mise à jour BDD | identique | identique |

→ Notre table `paiement`, nos statuts, notre logique de mise à jour de réservation
sont **déjà prêts**. C'est pour ça qu'on a conçu le simulé « comme du vrai ».
(Et rappel : en prod au Maroc, la passerelle réelle serait sans doute **CMI**, pas
Stripe — mais le principe « initier → confirmer → mettre à jour » reste le même.)

---

## 8. Pourquoi c'est un BON choix pour le jury

- Tu démontres la **maîtrise du cycle de paiement** (intention → confirmation → état),
  qui est la partie conceptuelle difficile — pas juste « brancher une lib ».
- Tu montres les **réflexes de sécurité** (montant serveur, idempotence, séparation
  carte/serveur).
- Tu assumes un **choix d'architecture lucide** : simulé pour la démo, mais structuré
  pour brancher une vraie passerelle sans tout réécrire.
- C'est **hors programme** (le TP n'exige pas le paiement en ligne) → valeur ajoutée
  qui te distingue.

---

## 9. Comment le tester

1. Compose un séjour → /reservation → remplis les coordonnées → "Procéder au paiement".
2. Tu arrives sur la page paiement : le **montant de l'acompte** s'affiche (relu en base).
3. Saisis n'importe quoi dans le faux formulaire → "Payer X €".
4. Tu es redirigé vers la confirmation.
5. **Vérifie en base** (ou dashboard admin) : la réservation est passée à
   `acompte_paye`, et la table `paiement` a une ligne `reussi`.
6. Test idempotence (avancé) : rejoue manuellement `POST /paiements/:id/confirmer`
   dans requests.http → le statut reste `reussi`, rien n'est doublé.

---

## En une phrase

> On **initie** une intention de paiement (montant relu en base), le client
> **déclenche** le paiement, le serveur **confirme** et met à jour la réservation —
> exactement le cycle d'un vrai paiement, où seule l'étape « la banque encaisse »
> est, chez nous, simulée par un clic.
