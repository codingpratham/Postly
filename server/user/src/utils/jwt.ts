import jwt from "jsonwebtoken"

export const generateAccessToken = (userId : string)=>{
    return jwt.sign({
        id: userId
    },
    process.env.ACCESS_TOKEN_SECRET as string,
    {
        expiresIn: "15min"
    })
}

export const generateRefreshToken= (userId : string)=>{
    return jwt.sign({
        id: userId
    },
    process.env.REFRESH_TOKEN_SECRET as string,
    {
        expiresIn: "7d"
    })
}