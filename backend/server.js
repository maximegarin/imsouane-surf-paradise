import 'dotenv/config' ;
import app from "./app.js" ;
import db from "./1_config/db.js" ;

const PORT = process.env.PORT || 3000 ;

app.listen(PORT, () => console.log(`Le serveur tourne sur http://localhost:${PORT}`)) ;
