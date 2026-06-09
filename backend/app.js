import express from 'express' ;
import dotenv from 'dotenv' ;
import cors from 'cors' ;
import helmet from 'helmet' ;
import chambreRoutes from './5_routes/chambre.routes.js' ;
import authRoutes from './5_routes/auth.routes.js' ;
import reservationRoutes from './5_routes/reservation.routes.js' ;
import saisonRoutes from './5_routes/saison.routes.js' ;
import prestationRoutes from './5_routes/prestation.routes.js' ;
import paiementRoutes from './5_routes/paiement.routes.js' ;

// Initialisation de dotenv pour rendre les variables .env accessibles via process.env
dotenv.config() ;

// Création de l'instance Express (application principale)
const app = express() ;


app.use(express.json()) ;

// Activation du CORS pour autoriser les requêtes provenant du front
// Les origines autorisées viennent du .env (CORS_ORIGIN), séparées par des virgules
app.use(cors({
    origin: process.env.CORS_ORIGIN.split(','), // ex. "http://localhost:5173,http://localhost:5174"
    credentials: true                           // autorise les cookies
})) ;

// Activation de Helmet pour renforcer la sécurité HTTP
app.use(helmet()) ;


/**
 * ==========================
 * ROUTES DE L'APPLICATION
 * ==========================
 */

// Route de santé (health check) — vérifier d'un coup d'œil que l'API tourne
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "API Imsouane Surf en ligne 🌊" }) ;
}) ;

app.use("/api/auth", authRoutes) ;

app.use("/api/chambres", chambreRoutes) ;

app.use("/api/reservations", reservationRoutes) ;

app.use("/api/saisons", saisonRoutes) ;

app.use("/api/prestations", prestationRoutes) ;

app.use("/api/paiements", paiementRoutes) ;


// Export de l'application pour être utilisée dans server.js
export default app ;
