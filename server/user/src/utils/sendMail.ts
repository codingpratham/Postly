import { transporter } from "./mail.js"

export const sendmail = async (
    to: string,
    subject: string,
    html: string
)=>{
    await transporter.sendMail({
        from: `"auth app" < ${process.env.EMAIL_USER}>`,
        to,
        subject,
        html
    })

}