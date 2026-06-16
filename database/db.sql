SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE `admin` (
  `id` int(11) NOT NULL,
  `nom` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `mot_de_passe` varchar(255) NOT NULL,
  `role` enum('super_admin','admin','gestionnaire') NOT NULL DEFAULT 'gestionnaire',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ⚠️ Hash neutralisés : définir un vrai mot de passe après import (cf. README / contrôleur auth).
INSERT INTO `admin` (`id`, `nom`, `email`, `mot_de_passe`, `role`, `created_at`) VALUES
(1, 'super-admin', 'superadmin@imsouane-surf.test', 'A_REMPLACER_APRES_IMPORT', 'super_admin', '2026-05-30 20:15:59'),
(2, 'admin', 'admin@imsouane-surf.test', 'A_REMPLACER_APRES_IMPORT', 'admin', '2026-05-30 20:17:16'),
(3, 'gerant', 'gerant@imsouane-surf.test', 'A_REMPLACER_APRES_IMPORT', 'gestionnaire', '2026-05-30 20:17:44');

CREATE TABLE `chambre` (
  `id` int(11) NOT NULL,
  `nom` varchar(120) NOT NULL,
  `slug` varchar(140) NOT NULL,
  `capacite` tinyint(3) UNSIGNED NOT NULL,
  `surface_m2` smallint(5) UNSIGNED DEFAULT NULL,
  `prix_base` decimal(8,2) NOT NULL,
  `description` text DEFAULT NULL,
  `vue` varchar(60) DEFAULT NULL,
  `terrasse` tinyint(1) NOT NULL DEFAULT 0,
  `composition_lits` varchar(255) DEFAULT NULL,
  `actif` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `chambre` (`id`, `nom`, `slug`, `capacite`, `surface_m2`, `prix_base`, `description`, `vue`, `terrasse`, `composition_lits`, `actif`, `created_at`, `updated_at`) VALUES
(1, 'Argana Wooden Appartement', 'argana-wooden-appartement', 5, 60, 99.00, 'Appartement spacieux en bois, jusqu\'à 5 personnes.', NULL, 0, NULL, 1, '2026-05-30 20:15:59', '2026-05-30 20:15:59'),
(2, 'Loubana', 'loubana', 4, NULL, 75.00, 'Logement confortable pour 4 personnes.', NULL, 0, NULL, 1, '2026-05-30 20:15:59', '2026-05-30 20:15:59'),
(3, 'Maazouza Appartement', 'maazouza-appartement', 4, 62, 99.00, 'Appartement avec salon, 2 chambres séparées, salle de bain et cuisine équipée (réfrigérateur).', NULL, 0, NULL, 1, '2026-05-30 20:15:59', '2026-05-30 20:15:59'),
(4, 'Mauringa 2', 'mauringa-2', 2, 16, 70.00, 'Chambre double avec salle de bains privative et douche.', NULL, 0, '1 lit', 1, '2026-05-30 20:15:59', '2026-05-30 20:15:59'),
(5, 'Mauringa 1', 'mauringa-1', 2, 12, 70.00, 'Chambre double avec salle de bains privative, terrasse et vue sur la mer.', 'mer', 1, '2 lits', 1, '2026-05-30 20:15:59', '2026-05-30 20:15:59'),
(6, 'Lazulite', 'lazulite', 3, 47, 79.00, 'Suite avec 1 chambre, salle de bain avec douche et vue sur la mer.', 'mer', 1, '1 lit double + 1 lit simple', 1, '2026-05-30 20:15:59', '2026-05-30 20:15:59'),
(7, 'Tamsrite', 'tamsrite', 4, 30, 79.00, 'Suite familiale avec terrasse et superbe vue sur le spot de surf.', 'spot de surf', 1, '1 lit double + 2 lits simples', 1, '2026-05-30 20:15:59', '2026-05-30 20:15:59');

CREATE TABLE `client` (
  `id` int(11) NOT NULL,
  `nom` varchar(100) NOT NULL,
  `prenom` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `telephone` varchar(30) DEFAULT NULL,
  `consentement_marketing` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `paiement` (
  `id` int(11) NOT NULL,
  `reservation_id` int(11) NOT NULL,
  `montant` decimal(10,2) NOT NULL,
  `type` enum('acompte','solde','total') NOT NULL,
  `statut` enum('en_attente','reussi','echoue','rembourse') NOT NULL DEFAULT 'en_attente',
  `stripe_payment_intent_id` varchar(255) DEFAULT NULL,
  `date_paiement` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `photo` (
  `id` int(11) NOT NULL,
  `chambre_id` int(11) NOT NULL,
  `url` varchar(500) NOT NULL,
  `alt` varchar(255) DEFAULT NULL,
  `ordre` tinyint(3) UNSIGNED NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `photo` (`id`, `chambre_id`, `url`, `alt`, `ordre`) VALUES
(36, 1, 'https://res.cloudinary.com/dsepfzneu/image/upload/f_auto,q_auto/imsouane/chambres/argana-wooden-appartement/argana-wooden-appartement-01', 'Argana Wooden Appartement — vue principale', 0),
(37, 1, 'https://res.cloudinary.com/dsepfzneu/image/upload/f_auto,q_auto/imsouane/chambres/argana-wooden-appartement/argana-wooden-appartement-02', 'Argana Wooden Appartement — photo 2', 1),
(38, 1, 'https://res.cloudinary.com/dsepfzneu/image/upload/f_auto,q_auto/imsouane/chambres/argana-wooden-appartement/argana-wooden-appartement-03', 'Argana Wooden Appartement — photo 3', 2),
(39, 1, 'https://res.cloudinary.com/dsepfzneu/image/upload/f_auto,q_auto/imsouane/chambres/argana-wooden-appartement/argana-wooden-appartement-04', 'Argana Wooden Appartement — photo 4', 3),
(40, 1, 'https://res.cloudinary.com/dsepfzneu/image/upload/f_auto,q_auto/imsouane/chambres/argana-wooden-appartement/argana-wooden-appartement-05', 'Argana Wooden Appartement — photo 5', 4),
(41, 1, 'https://res.cloudinary.com/dsepfzneu/image/upload/f_auto,q_auto/imsouane/chambres/argana-wooden-appartement/argana-wooden-appartement-06', 'Argana Wooden Appartement — photo 6', 5),
(42, 1, 'https://res.cloudinary.com/dsepfzneu/image/upload/f_auto,q_auto/imsouane/chambres/argana-wooden-appartement/argana-wooden-appartement-07', 'Argana Wooden Appartement — photo 7', 6),
(43, 2, 'https://res.cloudinary.com/dsepfzneu/image/upload/f_auto,q_auto/imsouane/chambres/loubana/loubana-01', 'Loubana — vue principale', 0),
(44, 2, 'https://res.cloudinary.com/dsepfzneu/image/upload/f_auto,q_auto/imsouane/chambres/loubana/loubana-02', 'Loubana — photo 2', 1),
(45, 2, 'https://res.cloudinary.com/dsepfzneu/image/upload/f_auto,q_auto/imsouane/chambres/loubana/loubana-03', 'Loubana — photo 3', 2),
(46, 2, 'https://res.cloudinary.com/dsepfzneu/image/upload/f_auto,q_auto/imsouane/chambres/loubana/loubana-04', 'Loubana — photo 4', 3),
(47, 2, 'https://res.cloudinary.com/dsepfzneu/image/upload/f_auto,q_auto/imsouane/chambres/loubana/loubana-05', 'Loubana — photo 5', 4),
(48, 3, 'https://res.cloudinary.com/dsepfzneu/image/upload/f_auto,q_auto/imsouane/chambres/maazouza-appartement/maazouza-appartement-01', 'Maazouza Appartement — vue principale', 0),
(49, 3, 'https://res.cloudinary.com/dsepfzneu/image/upload/f_auto,q_auto/imsouane/chambres/maazouza-appartement/maazouza-appartement-02', 'Maazouza Appartement — photo 2', 1),
(50, 3, 'https://res.cloudinary.com/dsepfzneu/image/upload/f_auto,q_auto/imsouane/chambres/maazouza-appartement/maazouza-appartement-03', 'Maazouza Appartement — photo 3', 2),
(51, 3, 'https://res.cloudinary.com/dsepfzneu/image/upload/f_auto,q_auto/imsouane/chambres/maazouza-appartement/maazouza-appartement-04', 'Maazouza Appartement — photo 4', 3),
(52, 3, 'https://res.cloudinary.com/dsepfzneu/image/upload/f_auto,q_auto/imsouane/chambres/maazouza-appartement/maazouza-appartement-05', 'Maazouza Appartement — photo 5', 4),
(53, 5, 'https://res.cloudinary.com/dsepfzneu/image/upload/f_auto,q_auto/imsouane/chambres/mauringa-1/mauringa-1-01', 'Mauringa 1 — vue principale', 0),
(54, 5, 'https://res.cloudinary.com/dsepfzneu/image/upload/f_auto,q_auto/imsouane/chambres/mauringa-1/mauringa-1-02', 'Mauringa 1 — photo 2', 1),
(55, 5, 'https://res.cloudinary.com/dsepfzneu/image/upload/f_auto,q_auto/imsouane/chambres/mauringa-1/mauringa-1-03', 'Mauringa 1 — photo 3', 2),
(56, 4, 'https://res.cloudinary.com/dsepfzneu/image/upload/f_auto,q_auto/imsouane/chambres/mauringa-2/mauringa-2-01', 'Mauringa 2 — vue principale', 0),
(57, 4, 'https://res.cloudinary.com/dsepfzneu/image/upload/f_auto,q_auto/imsouane/chambres/mauringa-2/mauringa-2-02', 'Mauringa 2 — photo 2', 1),
(58, 4, 'https://res.cloudinary.com/dsepfzneu/image/upload/f_auto,q_auto/imsouane/chambres/mauringa-2/mauringa-2-03', 'Mauringa 2 — photo 3', 2),
(59, 6, 'https://res.cloudinary.com/dsepfzneu/image/upload/f_auto,q_auto/imsouane/chambres/lazulite/lazulite-01', 'Lazulite — vue principale', 0),
(60, 6, 'https://res.cloudinary.com/dsepfzneu/image/upload/f_auto,q_auto/imsouane/chambres/lazulite/lazulite-02', 'Lazulite — photo 2', 1),
(61, 6, 'https://res.cloudinary.com/dsepfzneu/image/upload/f_auto,q_auto/imsouane/chambres/lazulite/lazulite-03', 'Lazulite — photo 3', 2),
(62, 7, 'https://res.cloudinary.com/dsepfzneu/image/upload/f_auto,q_auto/imsouane/chambres/tamsrite/tamsrite-01', 'Tamsrite — vue principale', 0),
(63, 7, 'https://res.cloudinary.com/dsepfzneu/image/upload/f_auto,q_auto/imsouane/chambres/tamsrite/tamsrite-02', 'Tamsrite — photo 2', 1),
(64, 7, 'https://res.cloudinary.com/dsepfzneu/image/upload/f_auto,q_auto/imsouane/chambres/tamsrite/tamsrite-03', 'Tamsrite — photo 3', 2),
(65, 7, 'https://res.cloudinary.com/dsepfzneu/image/upload/f_auto,q_auto/imsouane/chambres/tamsrite/tamsrite-04', 'Tamsrite — photo 4', 3),
(66, 7, 'https://res.cloudinary.com/dsepfzneu/image/upload/f_auto,q_auto/imsouane/chambres/tamsrite/tamsrite-05', 'Tamsrite — photo 5', 4);

CREATE TABLE `prestation` (
  `id` int(11) NOT NULL,
  `nom` varchar(120) NOT NULL,
  `description` text DEFAULT NULL,
  `prix` decimal(8,2) NOT NULL,
  `categorie` enum('menage','pack_surf','autre') NOT NULL DEFAULT 'autre',
  `actif` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `prestation` (`id`, `nom`, `description`, `prix`, `categorie`, `actif`, `created_at`) VALUES
(1, 'Ménage pendant le séjour', 'Service de ménage quotidien.', 7.00, 'menage', 1, '2026-05-30 20:15:59'),
(2, 'Pack surf découverte', '3 cours de surf avec moniteur + location matériel.', 120.00, 'pack_surf', 1, '2026-05-30 20:53:28');

CREATE TABLE `reservation` (
  `id` int(11) NOT NULL,
  `client_id` int(11) NOT NULL,
  `date_arrivee` date NOT NULL,
  `date_depart` date NOT NULL,
  `nb_personnes` tinyint(3) UNSIGNED NOT NULL,
  `statut` enum('en_attente','acompte_paye','soldee','annulee') NOT NULL DEFAULT 'en_attente',
  `montant_total` decimal(10,2) NOT NULL DEFAULT 0.00,
  `montant_acompte` decimal(10,2) NOT NULL DEFAULT 0.00,
  `token_suivi` char(36) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `reservation_chambre` (
  `id` int(11) NOT NULL,
  `reservation_id` int(11) NOT NULL,
  `chambre_id` int(11) NOT NULL,
  `nb_nuits` smallint(5) UNSIGNED NOT NULL,
  `sous_total` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `reservation_prestation` (
  `id` int(11) NOT NULL,
  `reservation_id` int(11) NOT NULL,
  `prestation_id` int(11) NOT NULL,
  `quantite` smallint(5) UNSIGNED NOT NULL DEFAULT 1,
  `prix_unitaire` decimal(8,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `saison` (
  `id` int(11) NOT NULL,
  `nom` varchar(80) NOT NULL,
  `date_debut` date NOT NULL,
  `date_fin` date NOT NULL,
  `coefficient` decimal(4,2) NOT NULL DEFAULT 1.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `saison` (`id`, `nom`, `date_debut`, `date_fin`, `coefficient`, `created_at`) VALUES
(1, 'Haute saison', '2025-09-01', '2026-05-31', 1.30, '2026-05-30 20:15:59'),
(2, 'Basse saison', '2026-06-01', '2026-08-31', 1.00, '2026-05-30 20:15:59'),
(3, 'Haute saison', '2026-09-01', '2027-05-31', 1.30, '2026-05-30 20:15:59'),
(4, 'Forte affluence', '2026-02-01', '2026-02-28', 1.60, '2026-05-30 20:15:59'),
(5, 'Forte affluence', '2027-02-01', '2027-02-28', 1.60, '2026-05-30 20:15:59');

ALTER TABLE `admin`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_admin_email` (`email`);

ALTER TABLE `chambre`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_chambre_slug` (`slug`);

ALTER TABLE `client`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_client_email` (`email`);

ALTER TABLE `paiement`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_paiement_reservation` (`reservation_id`);

ALTER TABLE `photo`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_photo_chambre` (`chambre_id`);

ALTER TABLE `prestation`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `reservation`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_reservation_token` (`token_suivi`),
  ADD KEY `fk_reservation_client` (`client_id`);

ALTER TABLE `reservation_chambre`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_resa_chambre` (`reservation_id`,`chambre_id`),
  ADD KEY `fk_rc_chambre` (`chambre_id`);

ALTER TABLE `reservation_prestation`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_rp_reservation` (`reservation_id`),
  ADD KEY `fk_rp_prestation` (`prestation_id`);

ALTER TABLE `saison`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `admin`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

ALTER TABLE `chambre`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

ALTER TABLE `client`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

ALTER TABLE `paiement`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

ALTER TABLE `photo`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=72;

ALTER TABLE `prestation`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

ALTER TABLE `reservation`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

ALTER TABLE `reservation_chambre`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

ALTER TABLE `reservation_prestation`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

ALTER TABLE `saison`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

ALTER TABLE `paiement`
  ADD CONSTRAINT `fk_paiement_reservation` FOREIGN KEY (`reservation_id`) REFERENCES `reservation` (`id`) ON DELETE CASCADE;

ALTER TABLE `photo`
  ADD CONSTRAINT `fk_photo_chambre` FOREIGN KEY (`chambre_id`) REFERENCES `chambre` (`id`) ON DELETE CASCADE;

ALTER TABLE `reservation`
  ADD CONSTRAINT `fk_reservation_client` FOREIGN KEY (`client_id`) REFERENCES `client` (`id`);

ALTER TABLE `reservation_chambre`
  ADD CONSTRAINT `fk_rc_chambre` FOREIGN KEY (`chambre_id`) REFERENCES `chambre` (`id`),
  ADD CONSTRAINT `fk_rc_reservation` FOREIGN KEY (`reservation_id`) REFERENCES `reservation` (`id`) ON DELETE CASCADE;

ALTER TABLE `reservation_prestation`
  ADD CONSTRAINT `fk_rp_prestation` FOREIGN KEY (`prestation_id`) REFERENCES `prestation` (`id`),
  ADD CONSTRAINT `fk_rp_reservation` FOREIGN KEY (`reservation_id`) REFERENCES `reservation` (`id`) ON DELETE CASCADE;
SET FOREIGN_KEY_CHECKS = 1;
