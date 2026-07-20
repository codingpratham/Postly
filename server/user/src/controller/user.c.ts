import type { Request, Response } from "express";
import { prisma } from "../utils/prisma.js";

export const userme = async (req:Request,res:Response)=>{
    const userId = req.userId

    if(!userId){
        res.status(211).json({
            message:"User not found"
        })
        return
    }

    try{
        const user = await prisma.user.findUnique({
            where: { id: userId },
        })
        if(!user){
            return res.status(404).json({ message: "User not found" })
        }
        return res.status(200).json({ user })
    }catch(error){
        return res.status(500).json({ message: "Server error" })
    }

}

export const updateUser = async (req: Request, res: Response)=>{
    const userId = req.userId

    if(!userId){
        res.status(211).json({
            message:"User not found"
        })
        return
    }

    const { name, email ,bio} = req.body

    try{
        const user = await prisma.user.update({
            where:{
                id:userId
            },
            data:{
                name,
                email,
                bio,
                isOnboarded:true
            }
        })

        res.status(200).json({
            message:"User updated successfully",
            user
        })
    }catch(error){
        return res.status(500).json({ message: "Server error" })
    }
}

export const deleteUser = async (req: Request, res: Response)=>{
    const userId = req.userId

    if(!userId){
        res.status(211).json({
            message:"User not found"
        })
        return
    }

    try {
        const user= await prisma.user.delete({
            where:{
                id:userId
            }
        })

        res.status(200).json({
            message:"User deleted successfully",
            user
        })
    } catch (error) {
        res.status(500).json({
            message:"Server error"
        })
        return
    
    }
}

export const getAllUsers = async (req: Request, res: Response)=>{
    try{
        const users = await prisma.user.findMany()

        res.status(200).json({
            message:"Users fetched successfully",
            users
        })
    }catch(error){
        res.status(500).json({
            message:"Server error"
        })
        return
    }
}

export const getUserByName = async (req: Request, res: Response)=>{
    const name = req.params.name as string

    if(!name){
        res.status(211).json({
            message:"User not found"
        })
        return
    }


    try {
        const user = await prisma.user.findFirst({
            where:{
                name:name
            }
        })
        res.status(200).json({
            message:"User fetched successfully",
            user
        })

    } catch (error) {
        res.status(500).json({
            message:"Server error"
        })
        return
        console.log(error)
    }

    
}

export const userFollow = async (req:Request , res:Response) =>{
    const userId = req.userId

    if(!userId){
        res.status(211).json({
            message:"User not found"
        })
        return
    }

    const followingId = req.params.followingId as string

    if(!followingId){
        res.status(211).json({
            message:"User not found"
        })
        return
    
    }

    try {
        const user = await prisma.follow.create({
            data:{
                followerId:userId,
                followingId:followingId
            }
        })

        res.status(200).json({
            message:"User followed successfully",
            user
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({
            message:"Server error"
        })
        return
    
    }
}

export const userUnfollow = async (req:Request , res:Response) =>{

    const userId = req.userId

    if(!userId){
        res.status(211).json({
            message:"User not found"
        })
        return
    }

    const followingId = req.params.followingId as string

    if(!followingId){
        res.status(211).json({
            message:"User not found"
        })
        return
    
    }

    try {
        const user = await prisma.follow.delete({
            where:{
                followerId_followingId:{
                    followerId:userId,
                    followingId:followingId
                }
            }
        })

        res.status(200).json({
            message:"User unfollowed successfully",
            user
        })
    } catch (error) {
       console.error(error)
       res.status(500).json({
        message:"Server error"
       }) 
    }
}

export const getFollowers = async (req:Request , res:Response) =>{
    const followingId = req.params.followingId as string

    if(!followingId){
        res.status(211).json({
            message:"User not found"
        })
        return
    
    }

    try {
        const user = await prisma.follow.findMany({
            where:{
                followingId:followingId
            }
        })

        res.status(200).json({
            message:"Followers fetched successfully",
            user
        })
    } catch (error) {
        console.error(error)
       res.status(500).json({
        message:"Server error"
       }) 
    }
}

export const getFollowing = async (req:Request , res:Response) =>{
     const followingId = req.params.followingId as string

    if(!followingId){
        res.status(211).json({
            message:"User not found"
        })
        return
    
    }

    try {
        const user = await prisma.follow.findMany({
            where:{
                followerId:followingId
            }
        })

        res.status(200).json({
            message:"Following fetched successfully",
            user
        })
    } catch (error) {
        console.error(error)
       res.status(500).json({
        message:"Server error"
       }) 
    }
}

export const getFollowersCount = async (req:Request , res:Response) =>{
    const followingId = req.params.followingId as string

    if(!followingId){
        res.status(211).json({
            message:"User not found"
        })
        return
    
    }

    try {
        const user = await prisma.follow.count({
            where:{
                followingId:followingId
            }
        })

        res.status(200).json({
            message:"Followers count fetched successfully",
            user
        })
    } catch (error) {
        console.error(error)
       res.status(500).json({
        message:"Server error"
       }) 
    }
}

export const getFollowingCount = async (req:Request , res:Response) =>{
    const followingId = req.params.followingId as string

    if(!followingId){
        res.status(211).json({
            message:"User not found"
        })
        return
    
    }

    try {
        const user = await prisma.follow.count({
            where:{
                followerId:followingId
            }
        })

        res.status(200).json({
            message:"Following count fetched successfully",
            user
        })
    } catch (error) {
        console.error(error)
       res.status(500).json({
        message:"Server error"
       }) 
    }
}

export const SearchUser = async (req:Request , res:Response) =>{
    const query = req.query.query as string

    if(!query){
        res.status(211).json({
            message:"User not found"
        })
    }

    try {
        const user = await prisma.user.findMany({
            where:{
                name:{
                    contains:query
                }
            }
        })

        res.status(200).json({
            message:"User searched successfully",
            user
        })
    } catch (error) {
        console.error(error)
       res.status(500).json({
        message:"Server error"
       }) 
    }
}

export const SuggestedUsertoFollow = async (req:Request , res:Response) =>{
    const userId = req.userId

    if(!userId){
        res.status(211).json({
            message:"User not found"
        })
        return
    }

    try {
        const user = await prisma.user.findMany({
            where:{
                NOT:{
                    id:userId
                }
            }
        })

        res.status(200).json({
            message:"Suggested users fetched successfully",
            user
        })
    } catch (error) {
       console.error(error)
       res.status(500).json({
        message:"Server error"
       })  
    }
}

export const avatarPic = async (req:Request , res:Response) =>{
    const userId = req.userId

    if(!userId){
        return res.status(211).json({
            message:"User not found"
        })
    }

    const file = req.file

    if(!file){
        return res.status(211).json({
            message:"File not found"
        })
    }

    try {
        const user = await prisma.user.update({
            where:{
                id:userId
            },
            data:{
                avatarPic:file.path
            }
        })

        res.status(200).json({
            message:"Avatar updated successfully",
            user
        })


    } catch (error) {
        console.error(error)
       res.status(500).json({
        message:"Server error"
       }) 
    }


}