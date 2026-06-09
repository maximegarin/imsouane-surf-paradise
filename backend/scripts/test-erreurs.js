// =============================================================================
//  scripts/test-erreurs.js
//  Prouve la gestion d'erreurs du projet :
//   1. une erreur DANS un model (SQL) est bien PROPAGÉE (pas avalée)
//   2. une erreur HORS model (argon2) est bien levée
//   3. le PATTERN try/catch du controller attrape les DEUX
//
//  Lancer depuis le dossier backend :  node scripts/test-erreurs.js
// =============================================================================
import argon2 from "argon2";
import db from "../1_config/db.js";
import * as ChambreModel from "../2_models/chambre.model.js";

let ok = 0;
let ko = 0;

// Helper : on ATTEND que la fonction lève une erreur (optionnellement un code précis).
const attendErreur = async (titre, fn, codeAttendu = null) => {
  try {
    await fn();
    console.log(`❌ ${titre}\n     → AUCUNE erreur levée (on en attendait une)`);
    ko++;
  } catch (err) {
    if (codeAttendu && err.code !== codeAttendu) {
      console.log(`❌ ${titre}\n     → code "${err.code}" reçu, "${codeAttendu}" attendu`);
      ko++;
    } else {
      console.log(`✅ ${titre}\n     → erreur bien levée : ${err.code || err.message}`);
      ok++;
    }
  }
};

// Helper : on ATTEND que la fonction réussisse sans lever.
const attendSucces = async (titre, fn) => {
  try {
    await fn();
    console.log(`✅ ${titre}`);
    ok++;
  } catch (err) {
    console.log(`❌ ${titre}\n     → erreur inattendue : ${err.message}`);
    ko++;
  }
};

console.log("\n=========================================");
console.log("   TESTS DE GESTION D'ERREURS");
console.log("=========================================\n");

// --- 1. Erreur DANS un model (SQL) : slug en doublon -------------------------
// "tamsrite" existe déjà → la base refuse (ER_DUP_ENTRY).
// On vérifie que le model PROPAGE cette erreur au lieu de l'avaler.
await attendErreur(
  "1. Model (SQL) : slug en doublon propage ER_DUP_ENTRY",
  () =>
    ChambreModel.createChambre({
      nom: "Test Erreur",
      slug: "tamsrite", // slug déjà pris dans le seed
      capacite: 2,
      surface_m2: null,
      prix_base: 50,
      description: null,
      vue: null,
      terrasse: false,
      composition_lits: null,
      actif: true,
    }),
  "ER_DUP_ENTRY"
);

// --- 2. Erreur HORS model (argon2) : hash invalide ---------------------------
// argon2.verify avec un hash vide n'est pas un vrai hash → ça lève.
await attendErreur(
  "2. Hors model (argon2) : verify('', ...) lève bien une erreur",
  () => argon2.verify("", "nimportequoi")
);

// --- 3. Le PATTERN du controller attrape une erreur SQL ----------------------
await attendSucces(
  "3. Pattern controller : try/catch attrape l'erreur SQL",
  async () => {
    let attrapee = false;
    try {
      await ChambreModel.createChambre({
        nom: "Test", slug: "tamsrite", capacite: 2, surface_m2: null,
        prix_base: 50, description: null, vue: null, terrasse: false,
        composition_lits: null, actif: true,
      });
    } catch (e) {
      attrapee = true; // ← ici le vrai controller ferait console.error + res.status(500)
    }
    if (!attrapee) throw new Error("le catch n'a pas attrapé l'erreur");
  }
);

// --- 4. Le PATTERN du controller attrape une erreur argon2 (hors model) ------
await attendSucces(
  "4. Pattern controller : try/catch attrape l'erreur argon2",
  async () => {
    let attrapee = false;
    try {
      await argon2.verify("", "x");
    } catch (e) {
      attrapee = true;
    }
    if (!attrapee) throw new Error("le catch n'a pas attrapé l'erreur");
  }
);

// --- 5. Contrôle : un appel valide ne lève PAS d'erreur ----------------------
await attendSucces(
  "5. Contrôle : getChambres() fonctionne sans erreur",
  async () => {
    const chambres = await ChambreModel.getChambres();
    if (!Array.isArray(chambres)) throw new Error("résultat inattendu");
  }
);

console.log("\n=========================================");
console.log(`   RÉSULTAT : ${ok} réussite(s), ${ko} échec(s)`);
console.log("=========================================\n");

await db.end();
process.exit(ko === 0 ? 0 : 1);
