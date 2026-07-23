import type {Request,Response,NextFunction} from "express"
import jwt from "jsonwebtoken"

declare global {
    namespace Express {
        interface Request {
            userId?: string;
        }
    }
}

export const authenticate = async(req:Request , res:Response, next:NextFunction)=>{
    const token = req.cookies.accessToken;

    if(!token){
        res.status(401).json({message: "Unauthorized"});
    }

    try{
        const decoded = await jwt.verify(
            token,
            process.env.ACCESS_TOKEN_SECRET as string
        ) as { userId: string }

        req.userId = decoded.userId;
        
        next(); 
    }
    catch(error){
        console.log("Error in authentication",error)
        res.status(404).json({
            "message":"internal server error"
        })
    }
}