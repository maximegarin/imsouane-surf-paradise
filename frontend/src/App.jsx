// App.jsx — composant racine : AuthProvider + routeur + layout.
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ReservationProvider } from "./context/ReservationContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";
import ScrollToTop from "./components/ScrollToTop/ScrollToTop";
import Accueil from "./pages/Accueil/Accueil";
import Hebergement from "./pages/Hebergement/Hebergement";
import DetailChambre from "./pages/DetailChambre/DetailChambre";
import Reservation from "./pages/Reservation/Reservation";
import Paiement from "./pages/Paiement/Paiement";
import Confirmation from "./pages/Confirmation/Confirmation";
import Login from "./pages/admin/Login/Login";
import Dashboard from "./pages/admin/Dashboard/Dashboard";
import styles from "./App.module.scss";

function App() {
  return (
    // AuthProvider enveloppe TOUTE l'app -> l'état de connexion est dispo partout.
    <AuthProvider>
      <ReservationProvider>
      <BrowserRouter>
        {/* remonte en haut à chaque changement de page */}
        <ScrollToTop />
        {/* layout colonne : Header en haut, contenu au milieu, Footer collé en bas */}
        <div className={styles.app}>
          <Header />

          <main className={styles.contenu}>
            <Routes>
              {/* Pages publiques */}
              <Route path="/" element={<Accueil />} />
              <Route path="/hebergement" element={<Hebergement />} />
              <Route path="/chambre/:slug" element={<DetailChambre />} />
              <Route path="/reservation" element={<Reservation />} />
              <Route path="/reservation/paiement/:reservationId/:token" element={<Paiement />} />
              <Route path="/reservation/confirmation/:token" element={<Confirmation />} />

              {/* Espace admin */}
              <Route path="/admin/login" element={<Login />} />
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute roles={["super_admin", "admin", "gestionnaire"]}>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </main>

          <Footer />
        </div>
      </BrowserRouter>
      </ReservationProvider>
    </AuthProvider>
  );
}

export default App;
