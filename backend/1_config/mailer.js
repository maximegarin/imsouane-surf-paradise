// mailer.js — configuration Nodemailer (SMTP Brevo) + envoi des e-mails.
// Même logique que le projet d'apprentissage : un transporter partagé, un
// verify() au démarrage, puis des fonctions d'envoi dédiées.
import nodemailer from "nodemailer";
import "dotenv/config";

// Transporter = le "client SMTP" qui se connecte à Brevo avec nos identifiants.
export const transporter = nodemailer.createTransport({
  host: process.env.BREVO_SMTP_HOST,
  port: Number(process.env.BREVO_SMTP_PORT),
  secure: false, // STARTTLS sur le port 587 (Brevo)
  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_SMTP_PASS,
  },
});

// Au démarrage, on vérifie que la connexion SMTP fonctionne (log informatif).
transporter.verify((err) => {
  if (err) console.error("Erreur SMTP :", err.message);
  else console.log("SMTP online :)");
});

// Petit util : format de date FR (les dates SQL arrivent en "YYYY-MM-DD" ou Date).
const formatDate = (d) =>
  new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });

const euro = (montant) => `${Number(montant).toFixed(2)} €`;

/**
 * Envoi de l'e-mail de CONFIRMATION DE RÉSERVATION (acompte reçu).
 * On reçoit le dossier complet (client + chambres + montants + token_suivi).
 */
export const sendConfirmationReservation = async (reservation) => {
  const frontendUrl = process.env.FRONTEND_URL || process.env.CORS_ORIGIN || "http://localhost:5173";
  const lienSuivi = `${frontendUrl}/reservation/confirmation/${encodeURIComponent(reservation.token_suivi)}`;

  // Solde restant = total - acompte déjà réglé.
  const soldeRestant = Number(reservation.montant_total) - Number(reservation.montant_acompte);

  // Lignes des chambres réservées.
  const lignesChambres = (reservation.chambres || [])
    .map(
      (c) =>
        `<li style="margin-bottom:4px;">${c.chambre_nom} — ${c.nb_nuits} nuit(s) · ${euro(c.sous_total)}</li>`
    )
    .join("");

  await transporter.sendMail({
    from: process.env.MAIL_FROM || "Imsouane Surf Paradise <maxime.afec@gmail.com>",
    to: reservation.client_email,
    subject: "Votre réservation à Imsouane Surf Paradise est confirmée",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#1C2B3A;">
        <h2 style="color:#B85C38;">Merci ${reservation.client_prenom} !</h2>
        <p>Votre acompte a bien été reçu : <strong>votre séjour est confirmé</strong>. 🌊</p>

        <h3 style="margin-bottom:6px;">Votre séjour</h3>
        <p style="margin:0;">Du <strong>${formatDate(reservation.date_arrivee)}</strong>
        au <strong>${formatDate(reservation.date_depart)}</strong>
        · ${reservation.nb_personnes} voyageur(s)</p>

        <ul style="padding-left:18px;">${lignesChambres}</ul>

        <h3 style="margin-bottom:6px;">Paiement</h3>
        <p style="margin:0;">Total du séjour : <strong>${euro(reservation.montant_total)}</strong></p>
        <p style="margin:0;">Acompte réglé : <strong>${euro(reservation.montant_acompte)}</strong></p>
        <p style="margin:0;">Reste à régler sur place : <strong>${euro(soldeRestant)}</strong></p>

        <p style="margin-top:24px;">
          <a href="${lienSuivi}"
             style="display:inline-block;padding:12px 22px;background:#B85C38;color:#fff;border-radius:999px;text-decoration:none;">
            Voir ma réservation
          </a>
        </p>

        <p style="font-size:13px;color:#8A8276;margin-top:24px;">
          Référence de suivi : ${reservation.token_suivi}<br/>
          À très bientôt face à l'océan.
        </p>
      </div>
    `,
  });

  console.log(`E-mail de confirmation envoyé à ${reservation.client_email}`);
};
