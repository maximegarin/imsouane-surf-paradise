# Comment fonctionne Stripe (pour Imsouane Surf Paradise)

> Objectif : COMPRENDRE le paiement en ligne avant de l'implémenter.
> Cas du projet : **acompte 30 % payé en ligne** + **solde payé sur place** (ou paiement total en ligne en option).

---

## 1. L'idée de base : pourquoi Stripe ?

Tu ne veux **jamais** manipuler toi-même un numéro de carte bancaire :
- c'est ultra-réglementé (norme **PCI-DSS**),
- une fuite = catastrophe juridique.

Stripe joue **l'intermédiaire de confiance** : c'est **lui** qui reçoit la carte du client, la débite, et te dit juste « c'est payé » ou « ça a échoué ». Ton serveur ne voit **jamais** la carte.

```
Client (carte)  →  Stripe (encaisse)  →  ton serveur (reçoit "payé : oui/non")
```

---

## 2. Les 3 acteurs (à toujours garder en tête)

| Acteur | Rôle |
|---|---|
| **Le navigateur du client** (front) | affiche le formulaire de paiement fourni par Stripe, saisit la carte |
| **Ton serveur** (back Express) | crée l'intention de paiement, reçoit la confirmation, met à jour la BDD |
| **Stripe** (service externe) | encaisse la carte, gère la sécurité, **notifie** ton serveur |

---

## 3. Le vocabulaire Stripe (indispensable)

| Terme | C'est quoi |
|---|---|
| **Clé publique** (`pk_test_...`) | va dans le **front**. Pas secrète. Sert à initialiser le formulaire Stripe. |
| **Clé secrète** (`sk_test_...`) | va dans le **back uniquement** (`.env`). **JAMAIS** côté client, jamais sur Git. Sert à créer les paiements. |
| **PaymentIntent** | « une intention de paiement » : un objet Stripe qui représente UN paiement (montant, devise, statut). Créé par ton serveur. |
| **client_secret** | une clé temporaire liée à un PaymentIntent, envoyée au front pour qu'il puisse confirmer CE paiement précis. |
| **Webhook** | une requête que **Stripe envoie à TON serveur** pour le prévenir d'un événement (« paiement réussi ! »). |
| **Clé de webhook** (`whsec_...`) | sert à **vérifier** qu'un webhook vient bien de Stripe (et pas d'un pirate). |
| **Mode test / live** | en test, rien n'est réellement débité (cartes fictives). En live, vrai argent. |

---

## 4. Le montant : toujours en CENTIMES

Stripe travaille en **plus petite unité** de la devise. En euros :
- 222,00 € → tu envoies **`22200`** (centimes)
- 6,50 € → **`650`**

→ Règle : `montantStripe = Math.round(montantEuros * 100)`. (Évite les bugs de virgule flottante.)

---

## 5. LE FLUX COMPLET (acompte 30 %)

C'est le cœur. Lis-le lentement, étape par étape.

```
1. Le client a créé sa réservation (POST /api/reservations déjà codé)
   → statut "en_attente", montant_acompte = 222 € calculé CÔTÉ SERVEUR

2. Le client clique "Payer l'acompte"
        ↓
3. FRONT → demande à TON serveur de préparer le paiement
        ↓
4. TON SERVEUR :
   - relit le montant de l'acompte EN BASE (ne jamais croire le front !)
   - appelle Stripe : "crée un PaymentIntent de 22200 centimes EUR"
   - Stripe renvoie un PaymentIntent + un client_secret
   - ton serveur renvoie le client_secret au front
        ↓
5. FRONT :
   - avec la clé PUBLIQUE + le client_secret, Stripe.js affiche le champ carte
   - le client saisit sa carte → Stripe la valide directement (ton serveur ne la voit pas)
        ↓
6. STRIPE encaisse, puis envoie un WEBHOOK à ton serveur :
   "payment_intent.succeeded" (ou "...payment_failed")
        ↓
7. TON SERVEUR (route webhook) :
   - VÉRIFIE la signature du webhook (whsec_...)
   - retrouve la réservation liée au PaymentIntent
   - met à jour la table `paiement` (ligne acompte → statut "reussi")
   - met à jour `reservation.statut` → "acompte_paye"
        ↓
8. Le client voit "Acompte payé ✅", reçoit son email avec le lien de suivi (token)
```

---

## 6. POURQUOI les webhooks sont CRITIQUES (le piège n°1)

Question naturelle : *« pourquoi attendre un webhook ? Le front sait déjà que c'est payé ! »*

**Parce qu'on ne fait JAMAIS confiance au front pour confirmer un paiement.** Raisons :
- le client peut **fermer l'onglet** juste après le paiement (le front ne te prévient jamais),
- un pirate peut **fausser** un appel front disant « c'est payé » alors que non,
- le réseau peut couper entre le paiement et le retour.

→ La **SEULE source de vérité** d'un paiement réussi, c'est **le webhook envoyé par Stripe** (de serveur à serveur, signé). C'est lui qui déclenche la mise à jour de ta BDD.

> Règle d'or : **le front lance le paiement, le webhook le confirme.**

---

## 7. Comment ça se branche sur TA base de données

On a déjà tout préparé (souviens-toi) :

| Table / colonne | Rôle au moment du paiement |
|---|---|
| `paiement.stripe_payment_intent_id` | on y stocke l'id du PaymentIntent (le lien avec Stripe) |
| `paiement.type` | `acompte` (en ligne) / `solde` (sur place) / `total` |
| `paiement.statut` | `en_attente` → `reussi` (via webhook) ou `echoue` |
| `paiement.date_paiement` | rempli quand le webhook confirme |
| `reservation.statut` | passe à `acompte_paye` quand l'acompte est confirmé |

→ Le webhook fait **exactement** ce que ton `PATCH /statut` manuel fait déjà, mais déclenché par Stripe au lieu du gérant. **Ta logique de statut est déjà prête.**

---

## 8. Acompte en ligne vs solde sur place

Rappel du besoin :

| Paiement | Canal | Confirmation |
|---|---|---|
| Acompte 30 % | **Stripe** (en ligne) | webhook → automatique |
| Solde 70 % | **sur place** (espèces / TPE) | gérant → `PATCH /statut` (manuel, déjà codé) |
| Paiement total (option) | **Stripe** (en ligne) | webhook → automatique |

→ Stripe ne gère **que** la partie en ligne. Le solde sur place reste manuel (c'est voulu).

---

## 9. Deux façons d'intégrer Stripe (on choisira)

| Approche | Comment | Pour / Contre |
|---|---|---|
| **Stripe Checkout** (page hébergée) | ton serveur crée une "Checkout Session", tu **rediriges** le client vers une page de paiement **hébergée par Stripe** | ✅ le plus simple et le plus sûr (Stripe gère tout le formulaire, le design, la conformité). ❌ on quitte ton site le temps du paiement |
| **Payment Intents + Stripe Elements** | le champ carte est **intégré dans ta page**, look 100 % maison | ✅ contrôle total du design. ❌ plus de code front, plus de cas à gérer |

**Recommandation pour ton projet** : **Stripe Checkout**. Vu la deadline et l'enjeu sécurité, c'est le choix pro : tu codes moins, Stripe gère le plus risqué, et c'est parfaitement défendable au jury (« j'ai utilisé la solution hébergée pour la conformité PCI »).

---

## 10. Le mode TEST (pour développer sans argent réel)

- Tu actives le **mode test** dans le dashboard Stripe → clés `pk_test_` / `sk_test_`.
- Cartes de test fournies par Stripe, par exemple :
  - `4242 4242 4242 4242` → paiement **réussi**
  - une autre → paiement **refusé** (pour tester l'échec)
  - date d'expiration future quelconque, CVC quelconque.
- Pour tester les **webhooks en local**, on utilisera la **Stripe CLI** (`stripe listen`) qui transfère les événements Stripe vers ton `localhost`.

---

## 11. Les règles de SÉCURITÉ (à respecter absolument)

1. **Clé secrète** (`sk_...`) et **clé webhook** (`whsec_...`) → uniquement dans `.env`, **jamais** sur Git ni côté client.
2. **Recalculer le montant côté serveur** : on ne crée JAMAIS un PaymentIntent avec un montant venu du front. On relit l'acompte **en base**. (Sinon un client paie 1 € au lieu de 222 €.)
3. **Vérifier la signature du webhook** (`whsec_...`) : sinon n'importe qui pourrait t'envoyer un faux « c'est payé ».
4. **Idempotence** : un même webhook peut arriver 2 fois → ton code doit pouvoir le rejouer sans créer 2 paiements (on vérifie le statut avant de mettre à jour).
5. La route webhook lit le **corps brut** (`express.raw`), pas du JSON parsé (nécessaire pour vérifier la signature).

---

## 12. ⚠️ Point réel important : Stripe et le Maroc

Pour la **soutenance (mode test)** : Stripe fonctionne parfaitement, peu importe le pays. Aucun souci pour démontrer.

Pour le **vrai business de ton père au Maroc** : Stripe **n'est pas (ou mal) disponible** pour les comptes marocains côté encaissement réel. En production, il faudra peut-être :
- **CMI** (Centre Monétique Interbancaire, la passerelle de paiement marocaine de référence),
- ou **PayPal**,
- ou un montage via une entité européenne.

→ **Pour le jury, on code avec Stripe** (standard mondial, parfait pour démontrer la compétence). Et on note que la passerelle réelle de production sera à valider selon la disponibilité au Maroc. C'est une remarque qui montre ta lucidité métier.

---

## 13. Ce qu'on codera concrètement (récap)

1. `npm install stripe` + clés dans `.env` (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`).
2. `1_config/stripe.js` → initialise le client Stripe.
3. Une route **`POST /api/paiements/acompte/:reservationId`** → relit l'acompte en base, crée la Checkout Session, renvoie l'URL.
4. Une route **webhook `POST /api/paiements/webhook`** → vérifie la signature, met à jour `paiement` + `reservation.statut`.
5. Tests avec cartes de test + Stripe CLI.

→ Tout s'appuie sur ce qui existe déjà (table `paiement`, statuts de réservation). Stripe ne fait qu'**automatiser** la confirmation de l'acompte en ligne.

---

## En une phrase

> Ton serveur **crée** une intention de paiement (montant relu en base), Stripe **encaisse** la carte (ton serveur ne la voit jamais), et un **webhook signé** confirme le paiement → ton serveur met alors à jour `paiement` et le statut de la réservation. Le front lance, le webhook fait foi.
