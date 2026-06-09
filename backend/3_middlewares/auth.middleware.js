import jwt from 'jsonwebtoken' ;
import 'dotenv/config' ;


export const authMiddleware = (req, res, next) => {

  const authHeader = req.headers.authorization ;

  if (!authHeader) return res.status(401).json({ message: " Token manquant " }) ;

  const token = authHeader.split(" ")[1] ;

  try {

    req.user = jwt.verify(token, process.env.JWT_SECRET) ;

    next() ;

  } catch (error) {
    return res.status(403).json({ message: "Token invalide" }) ;
  }
} ;
