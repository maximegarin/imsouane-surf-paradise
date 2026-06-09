import mysql from "mysql2/promise" ;
import "dotenv/config" ;

const env = process.env ;

let db ;

async function initDB() {
  try {

    db = mysql.createPool({
      host: env.DB_HOST,
      user: env.DB_USER,
      password: env.DB_PASS,
      database: env.DB_NAME,

    }) ;

    await db.getConnection() ;
    console.log(`Connexion à la base de données ${env.DB_NAME} réussie :)`) ;

  } catch (error) {

    console.error("Erreur lors de la connexion à la base de données:", error.message) ;
    process.exit(1) ;

  }
}

await initDB() ;

export default db ;
