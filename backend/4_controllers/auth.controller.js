import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { findAdminByEmail, createAdmin } from '../2_models/admin.model.js';

// ---------------- REGISTER (réservé au super_admin) ----------------
export const register = async (req, res) => {
  try {
    const { nom, email, password, role } = req.body;

    const existing = await findAdminByEmail(email);
    if (existing)
      return res.status(409).json({ success: false, message: 'Email déjà utilisé' });

    const hash = await argon2.hash(password);
    const id = await createAdmin({ nom, email, mot_de_passe: hash, role });

    res.status(201).json({ success: true, message: 'Compte admin créé', id });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ success: false, message: 'Email déjà utilisé' });
    console.error('[register]', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ---------------- LOGIN ----------------
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email et mot de passe requis' });

    const admin = await findAdminByEmail(email);
    if (!admin)
      return res.status(400).json({ success: false, message: 'Email ou mot de passe incorrect' });

    const valid = await argon2.verify(admin.mot_de_passe, password);
    if (!valid)
      return res.status(400).json({ success: false, message: 'Email ou mot de passe incorrect' });

    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );

    res.status(200).json({ success: true, token });

  } catch (error) {
    console.error('[login]', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};
