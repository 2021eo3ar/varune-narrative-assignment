import express from "express";
import { authController } from "../controllers/index";
import { authenticateUser, validateRequest } from "../middlewares";
// import { AuthValidators } from "../validators/index";
import passport from "passport";

const router = express.Router();

router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/login" }),
  authController.googleCallback
);
// router.post("/login",validateRequest(AuthValidators.validateLoginUser),authController.loginUser)
// router.post("/verify-otp",authenticateUser,validateRequest(AuthValidators.validateVerifyOtp), authController.verifyOtp)
// router.post("/update-wallet",authenticateUser,validateRequest(AuthValidators.validateUpdateWallet), authController.updateWallet)
// router.post("/google-login", authController.googleLogin)

export default router;
