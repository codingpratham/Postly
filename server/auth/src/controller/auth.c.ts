import type  { Request, Response } from "express";
import type { Register } from "../types/types.js";

export const register = async (req:Request, res:Response)=>{
    const {name, email, password} : Register = req.body

    if(!name || !email || !password){
        return res.status(400).json({message: "Please provide all required fields"});
    }

    
}