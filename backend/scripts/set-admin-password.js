import argon2 from "argon2";
import db from "../1_config/db.js";
import { updateAdminPassword } from "../2_models/admin.model.js";

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.log("Usage : node scripts/set-admin-password.js <email> <motDePasse>");
  process.exit(1);
}

const hash = await argon2.hash(password);
const ok = await updateAdminPassword(email, hash);

if (ok) {
  console.log(`Mot de passe mis à jour pour ${email} ✅`);
} else {
  console.log(`Aucun admin trouvé avec l'email : ${email}`);
}

process.exit(0);
