import db from "../1_config/db.js" ;

export const findAdminByEmail = async (email) => {
  const [rows] = await db.query("SELECT * FROM admin WHERE email = ?", [email]) ;
  return rows[0] ;
} ;

export const createAdmin = async (data) => {
  const [result] = await db.query(
    "INSERT INTO admin (nom, email, mot_de_passe, role) VALUES (?, ?, ?, ?)",
    [data.nom, data.email, data.mot_de_passe, data.role]
  ) ;
  return result.insertId ;
} ;

export const updateAdminPassword = async (email, passwordHash) => {
  const [result] = await db.query(
    "UPDATE admin SET mot_de_passe = ? WHERE email = ?",
    [passwordHash, email]
  ) ;
  return result.affectedRows > 0 ;
} ;
