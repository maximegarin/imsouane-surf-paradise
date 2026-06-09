import { z } from 'zod' ;

export const validateChambre = (req, res, next) => {

  const schema = z.object({
    nom: z.string().min(1),
    slug: z.string().min(1),
    capacite: z.number().int().positive(),
    surface_m2: z.number().int().positive().optional().nullable(),
    prix_base: z.number().positive(),
    description: z.string().optional().nullable(),
    vue: z.string().optional().nullable(),
    terrasse: z.boolean().optional(),
    composition_lits: z.string().optional().nullable(),
    actif: z.boolean().optional()
  }) ;

  try {

    schema.parse(req.body) ;

    next();

  } catch (e) {

    return res
      .status(400)
      .json({ message: e.errors.map((err) => err.message).join(" , ") }) ;
  }
} ;


export const validateReservation = (req, res, next) => {

  const schema = z.object({
    client: z.object({
      nom: z.string().min(1),
      prenom: z.string().min(1),
      email: z.string().email(),
      telephone: z.string().min(1),
      consentement_marketing: z.boolean().optional()
    }),
    date_arrivee: z.string().min(1),
    date_depart: z.string().min(1),
    nb_personnes: z.number().int().positive(),
    chambres: z.array(z.number().int().positive()).min(1),
    prestations: z.array(z.object({
      prestation_id: z.number().int().positive(),
      quantite: z.number().int().positive()
    })).optional()
  }) ;

  try {

    schema.parse(req.body) ;

    next();

  } catch (e) {

    return res
      .status(400)
      .json({ message: e.errors.map((err) => err.message).join(" , ") }) ;
  }
} ;


export const validateEstimation = (req, res, next) => {

  const schema = z.object({
    date_arrivee: z.string().min(1),
    date_depart: z.string().min(1),
    chambres: z.array(z.number().int().positive()).min(1),
    prestations: z.array(z.object({
      prestation_id: z.number().int().positive(),
      quantite: z.number().int().positive()
    })).optional()
  }) ;

  try {

    schema.parse(req.body) ;

    next();

  } catch (e) {

    return res
      .status(400)
      .json({ message: e.errors.map((err) => err.message).join(" , ") }) ;
  }
} ;


export const validateSaison = (req, res, next) => {

  const schema = z.object({
    nom: z.string().min(1),
    date_debut: z.string().min(1),
    date_fin: z.string().min(1),
    coefficient: z.number().positive()
  }) ;

  try {

    schema.parse(req.body) ;

    next();

  } catch (e) {

    return res
      .status(400)
      .json({ message: e.errors.map((err) => err.message).join(" , ") }) ;
  }
} ;


export const validatePrestation = (req, res, next) => {

  const schema = z.object({
    nom: z.string().min(1),
    description: z.string().optional().nullable(),
    prix: z.number().positive(),
    categorie: z.enum(['menage', 'pack_surf', 'autre']),
    actif: z.boolean().optional()
  }) ;

  try {

    schema.parse(req.body) ;

    next();

  } catch (e) {

    return res
      .status(400)
      .json({ message: e.errors.map((err) => err.message).join(" , ") }) ;
  }
} ;


export const validateStatutReservation = (req, res, next) => {

  const schema = z.object({
    statut: z.enum(['en_attente', 'acompte_paye', 'soldee', 'annulee'])
  }) ;

  try {

    schema.parse(req.body) ;

    next();

  } catch (e) {

    return res
      .status(400)
      .json({ message: e.errors.map((err) => err.message).join(" , ") }) ;
  }
} ;


export const validateRegisterAdmin = (req, res, next) => {

  const schema = z.object({
    nom: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(8),
    role: z.enum(['super_admin', 'admin', 'gestionnaire'])
  }) ;

  try {

    schema.parse(req.body) ;

    next();

  } catch (e) {

    return res
      .status(400)
      .json({ message: e.errors.map((err) => err.message).join(" , ") }) ;
  }
} ;
