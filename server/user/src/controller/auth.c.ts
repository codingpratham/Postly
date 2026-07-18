import type { Request, Response } from "express";
import type { Login, Register } from "../types/types.js";

import { prisma } from "../utils/prisma.js";

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";

import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/jwt.js";

import { sendmail } from "../utils/sendMail.js";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
};

export const register = async (
  req: Request,
  res: Response
) => {
  const { name, email, password }: Register = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      message: "Please provide all required fields",
    });
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return res.status(409).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        
      },
    });

    // ==========================
    // Email Verification Token
    // ==========================

    const verifyToken = crypto
      .randomBytes(32)
      .toString("hex");

    const hashedVerifyToken = crypto
      .createHash("sha256")
      .update(verifyToken)
      .digest("hex");

    await prisma.emailVerificationToken.create({
      data: {
        token: hashedVerifyToken,
        userId: newUser.id,
        expiresAt: new Date(
          Date.now() + 24 * 60 * 60 * 1000
        ),
      },
    });

    const verifyLink =
      `${process.env.CLIENT_URL}/verify-email/${verifyToken}`;

    await sendmail(
      newUser.email,
      "Verify Your Email",
      `
        <h2>Welcome ${newUser.name}</h2>

        <p>Click below to verify your account.</p>

        <a href="${verifyLink}">
          Verify Email
        </a>

        <br/><br/>

        <p>This link expires in 24 hours.</p>
      `
    );

    // ==========================
    // JWT Tokens
    // ==========================

    const accessToken =
      generateAccessToken(newUser.id);

    const refreshToken =
      generateRefreshToken(newUser.id);

    await prisma.token.create({
      data: {
        token: refreshToken,
        userId: newUser.id,
        expiresAt: new Date(
          Date.now() +
            7 * 24 * 60 * 60 * 1000
        ),
      },
    });

    res.cookie(
      "accessToken",
      accessToken,
      cookieOptions
    );

    res.cookie(
      "refreshToken",
      refreshToken,
      cookieOptions
    );

    return res.status(201).json({
      success: true,
      message:
        "Registration successful. Please verify your email.",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Registration failed",
    });
  }
};

export const login = async (
  req: Request,
  res: Response
) => {
  const { email, password }: Login = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "Please provide all required fields",
    });
  }

  try {
    const existingUser =
      await prisma.user.findUnique({
        where: {
          email,
        },
      });

    if (!existingUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // ======================
    // Verify Email
    // ======================

    if (!existingUser.isVerified) {
      return res.status(403).json({
        message:
          "Please verify your email before logging in.",
      });
    }

    const isPasswordCorrect =
      await bcrypt.compare(
        password,
        existingUser.password
      );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    const accessToken =
      generateAccessToken(existingUser.id);

    const refreshToken =
      generateRefreshToken(existingUser.id);

    await prisma.token.create({
      data: {
        token: refreshToken,
        userId: existingUser.id,
        expiresAt: new Date(
          Date.now() +
            7 * 24 * 60 * 60 * 1000
        ),
      },
    });

    res.cookie(
      "accessToken",
      accessToken,
      cookieOptions
    );

    res.cookie(
      "refreshToken",
      refreshToken,
      cookieOptions
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: existingUser.id,
        name: existingUser.name,
        email: existingUser.email,
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
};

export const refresh = async (
  req: Request,
  res: Response
) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      message: "Refresh token missing",
    });
  }

  try {
    // Verify JWT
    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET!
    ) as { userId: string };

    // Check if refresh token exists in DB
    const storedToken = await prisma.token.findUnique({
      where: {
        token: refreshToken,
      },
    });

    if (!storedToken) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    // Check expiry in DB
    if (storedToken.expiresAt < new Date()) {
      await prisma.token.delete({
        where: {
          token: refreshToken,
        },
      });

      return res.status(401).json({
        success: false,
        message: "Refresh token expired",
      });
    }

    // -----------------------------
    // Refresh Token Rotation
    // -----------------------------

    // Delete old refresh token
    await prisma.token.delete({
      where: {
        token: refreshToken,
      },
    });

    // Create new tokens
    const newAccessToken =
      generateAccessToken(decoded.userId);

    const newRefreshToken =
      generateRefreshToken(decoded.userId);

    // Store new refresh token
    await prisma.token.create({
      data: {
        token: newRefreshToken,
        userId: decoded.userId,
        expiresAt: new Date(
          Date.now() +
            7 * 24 * 60 * 60 * 1000
        ),
      },
    });

    // Set Cookies
    res.cookie(
      "accessToken",
      newAccessToken,
      cookieOptions
    );

    res.cookie(
      "refreshToken",
      newRefreshToken,
      cookieOptions
    );

    return res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
    });

  } catch (error) {

    console.error(error);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired refresh token",
    });

  }
};

export const logout = async (
  req: Request,
  res: Response
) => {

  const refreshToken =
    req.cookies.refreshToken;

  try {

    if (refreshToken) {

      await prisma.token.deleteMany({
        where: {
          token: refreshToken,
        },
      });

    }

    res.clearCookie(
      "accessToken",
      cookieOptions
    );

    res.clearCookie(
      "refreshToken",
      cookieOptions
    );

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Logout failed",
    });

  }

};

export const forgotPassword = async (
  req: Request,
  res: Response
) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Email is required",
    });
  }

  try {
    // Find user
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    // Don't reveal whether the email exists
    if (!user) {
      return res.status(200).json({
        success: true,
        message:
          "If an account with that email exists, a reset link has been sent.",
      });
    }

    // Delete previous reset tokens
    await prisma.passwordResetToken.deleteMany({
      where: {
        userId: user.id,
      },
    });

    // Generate random token
    const resetToken = crypto
      .randomBytes(32)
      .toString("hex");

    // Hash before storing
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Save token
    await prisma.passwordResetToken.create({
      data: {
        token: hashedToken,
        userId: user.id,
        expiresAt: new Date(
          Date.now() + 15 * 60 * 1000
        ), // 15 minutes
      },
    });

    // Create frontend URL
    const resetLink =
      `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

    // Send Email
    await sendmail(
      user.email,
      "Reset Your Password",
      `
      <div style="font-family:sans-serif;padding:20px">
        <h2>Password Reset</h2>

        <p>Hello ${user.name},</p>

        <p>
          We received a request to reset your password.
        </p>

        <p>
          Click the button below to reset it.
        </p>

        <a
          href="${resetLink}"
          style="
            display:inline-block;
            background:#2563eb;
            color:white;
            padding:12px 20px;
            text-decoration:none;
            border-radius:6px;
          "
        >
          Reset Password
        </a>

        <br/><br/>

        <p>
          This link expires in
          <b>15 minutes</b>.
        </p>

        <p>
          If you didn't request this,
          simply ignore this email.
        </p>
      </div>
      `
    );

    return res.status(200).json({
      success: true,
      message:
        "Password reset email sent successfully.",
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });

  }
};

export const resetPassword = async (
  req: Request,
  res: Response
) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({
      success: false,
      message: "Token and password are required",
    });
  }

  try {
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const resetToken =
      await prisma.passwordResetToken.findUnique({
        where: {
          token: hashedToken,
        },
      });

    if (!resetToken) {
      return res.status(400).json({
        success: false,
        message: "Invalid reset token",
      });
    }

    if (resetToken.expiresAt < new Date()) {
      await prisma.passwordResetToken.delete({
        where: {
          token: hashedToken,
        },
      });

      return res.status(400).json({
        success: false,
        message: "Reset token has expired",
      });
    }

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    await prisma.user.update({
      where: {
        id: resetToken.userId,
      },
      data: {
        password: hashedPassword,
      },
    });

    // Delete used reset token
    await prisma.passwordResetToken.delete({
      where: {
        token: hashedToken,
      },
    });

    // Logout from every device
    await prisma.token.deleteMany({
      where: {
        userId: resetToken.userId,
      },
    });

    res.clearCookie(
      "accessToken",
      cookieOptions
    );

    res.clearCookie(
      "refreshToken",
      cookieOptions
    );

    return res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });

  }
};

export const verifyEmail = async (
  req: Request,
  res: Response
) => {
  const token  = req.params.token as string;

  if (!token) {
    return res.status(400).json({
      success: false,
      message: "Verification token missing",
    });
  }

  try {

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const verification =
      await prisma.emailVerificationToken.findUnique({
        where: {
          token: hashedToken,
        },
      });

    if (!verification) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification token",
      });
    }

    if (verification.expiresAt < new Date()) {

      await prisma.emailVerificationToken.delete({
        where: {
          token: hashedToken,
        },
      });

      return res.status(400).json({
        success: false,
        message: "Verification token expired",
      });

    }

    await prisma.user.update({
      where: {
        id: verification.userId,
      },
      data: {
        isVerified: true,
      },
    });

    await prisma.emailVerificationToken.delete({
      where: {
        token: hashedToken,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Email verified successfully",
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });

  }
};