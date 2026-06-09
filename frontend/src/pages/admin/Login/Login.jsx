// Login.jsx — page de connexion admin.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import Seo from "../../../components/Seo/Seo";
import styles from "./Login.module.scss";

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();   // pour rediriger après connexion

  // état des champs du formulaire (formulaire "contrôlé" par React)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erreur, setErreur] = useState(null);
  const [enCours, setEnCours] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();              // empêche le rechargement par défaut du form
    setErreur(null);
    setEnCours(true);
    try {
      await login(email, password);  // appelle l'API via le contexte
      navigate("/admin/dashboard");  // succès -> vers le dashboard
    } catch {
      setErreur("Email ou mot de passe incorrect.");
    } finally {
      setEnCours(false);
    }
  };

  return (
    <section className={styles.login}>
      <Seo title="Administration" noindex />
      <form className={styles.form} onSubmit={handleSubmit}>
        <h1 className={styles.titre}>Espace administration</h1>

        <label className={styles.label}>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={styles.input}
          />
        </label>

        <label className={styles.label}>
          Mot de passe
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={styles.input}
          />
        </label>

        {erreur && <p className={styles.erreur}>{erreur}</p>}

        <button type="submit" className={styles.bouton} disabled={enCours}>
          {enCours ? "Connexion…" : "Se connecter"}
        </button>
      </form>
    </section>
  );
}

export default Login;
