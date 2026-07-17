import {Router} from "express";
import { forgotPassword, login, logout, refresh, register, resetPassword, verifyEmail } from "../controller/auth.c.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.post(
  "/forgot-password",
  forgotPassword
);
router.post(
  "/reset-password",
  resetPassword
);
router.get(
  "/verify-email/:token",
  verifyEmail
);

export default router;