CREATE TABLE client (
  id                     INT AUTO_INCREMENT PRIMARY KEY,
  nom                    VARCHAR(100)  NOT NULL,
  prenom                 VARCHAR(100)  NOT NULL,
  email                  VARCHAR(255)  NOT NULL,
  telephone              VARCHAR(30),
  consentement_marketing BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at             TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_client_email (email)
) ENGINE=InnoDB;

CREATE TABLE admin (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  nom          VARCHAR(100)  NOT NULL,
  email        VARCHAR(255)  NOT NULL,
  mot_de_passe VARCHAR(255)  NOT NULL,
  role         ENUM('super_admin', 'admin', 'gestionnaire')
                             NOT NULL DEFAULT 'gestionnaire',
  created_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_admin_email (email)
) ENGINE=InnoDB;

CREATE TABLE chambre (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  nom              VARCHAR(120)   NOT NULL,
  slug             VARCHAR(140)   NOT NULL,
  capacite         TINYINT UNSIGNED NOT NULL,
  surface_m2       SMALLINT UNSIGNED,
  prix_base        DECIMAL(8,2)   NOT NULL,
  description      TEXT,
  vue              VARCHAR(60),
  terrasse         BOOLEAN        NOT NULL DEFAULT FALSE,
  composition_lits VARCHAR(255),
  actif            BOOLEAN        NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP
                                  ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_chambre_slug (slug)
) ENGINE=InnoDB;

CREATE TABLE photo (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  chambre_id INT          NOT NULL,
  url        VARCHAR(500) NOT NULL,
  alt        VARCHAR(255),
  ordre      TINYINT UNSIGNED NOT NULL DEFAULT 0,
  CONSTRAINT fk_photo_chambre
    FOREIGN KEY (chambre_id) REFERENCES chambre(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE saison (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  nom         VARCHAR(80)   NOT NULL,
  date_debut  DATE          NOT NULL,
  date_fin    DATE          NOT NULL,
  coefficient DECIMAL(4,2)  NOT NULL DEFAULT 1.00,
  created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE prestation (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  nom         VARCHAR(120)  NOT NULL,
  description TEXT,
  prix        DECIMAL(8,2)  NOT NULL,
  categorie   ENUM('menage', 'pack_surf', 'autre') NOT NULL DEFAULT 'autre',
  actif       BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE reservation (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  client_id       INT          NOT NULL,
  date_arrivee    DATE         NOT NULL,
  date_depart     DATE         NOT NULL,
  nb_personnes    TINYINT UNSIGNED NOT NULL,
  statut          ENUM('en_attente', 'acompte_paye', 'soldee', 'annulee')
                               NOT NULL DEFAULT 'en_attente',
  montant_total   DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  montant_acompte DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  token_suivi     CHAR(36)     NOT NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_reservation_token (token_suivi),
  CONSTRAINT fk_reservation_client
    FOREIGN KEY (client_id) REFERENCES client(id)
) ENGINE=InnoDB;

CREATE TABLE reservation_chambre (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  reservation_id INT          NOT NULL,
  chambre_id     INT          NOT NULL,
  nb_nuits       SMALLINT UNSIGNED NOT NULL,
  sous_total     DECIMAL(10,2) NOT NULL,
  UNIQUE KEY uq_resa_chambre (reservation_id, chambre_id),
  CONSTRAINT fk_rc_reservation
    FOREIGN KEY (reservation_id) REFERENCES reservation(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_rc_chambre
    FOREIGN KEY (chambre_id) REFERENCES chambre(id)
) ENGINE=InnoDB;

CREATE TABLE reservation_prestation (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  reservation_id INT          NOT NULL,
  prestation_id  INT          NOT NULL,
  quantite       SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  prix_unitaire  DECIMAL(8,2) NOT NULL,
  CONSTRAINT fk_rp_reservation
    FOREIGN KEY (reservation_id) REFERENCES reservation(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_rp_prestation
    FOREIGN KEY (prestation_id) REFERENCES prestation(id)
) ENGINE=InnoDB;

CREATE TABLE paiement (
  id                       INT AUTO_INCREMENT PRIMARY KEY,
  reservation_id           INT          NOT NULL,
  montant                  DECIMAL(10,2) NOT NULL,
  type                     ENUM('acompte', 'solde', 'total') NOT NULL,
  statut                   ENUM('en_attente', 'reussi', 'echoue', 'rembourse')
                                        NOT NULL DEFAULT 'en_attente',
  stripe_payment_intent_id VARCHAR(255),
  date_paiement            TIMESTAMP NULL,
  created_at               TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_paiement_reservation
    FOREIGN KEY (reservation_id) REFERENCES reservation(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;
