import { Request, Response } from "express";
import { UserService } from "../services";
import { generateAuthTokens } from "../config/token";
import { envConfigs } from "../config/envconfig";

export default class authController {
  static googleCallback = async (req: Request, res: Response): Promise<any> => {
    try {
      const user = req.user as {
        id: string;
        name: string;
        email: string;
        photo: string;
      };
      console.log("Google user info:", user);

      if (!user || !user.email) {
        return res
          .status(400)
          .json({ success: false, message: "Google user info missing" });
      }

      // Check if user exists in DB
      let userExists = await UserService.getUser(user.email);

      // If not, create the user
      if (!userExists) {
        userExists = await UserService.insertUser({
          name: user.name,
          email: user.email,
          profileImage: user.photo,
        });
      }
      console.log(userExists);
      // Generate JWT token
      const accessToken = generateAuthTokens(
        userExists.publicId,
        userExists.email
      );
      console.log("Generated access token:", accessToken);

      // Prepare user object for response
      const responseUser = {
        name: userExists.name,
        email: userExists.email,
        profileImage: userExists.profileImage,
        publicId: userExists.publicId,
        credits: userExists.credits,
        lastCreditReset: userExists.lastCreditReset,
        createdAt: userExists.createdAt,
        updatedAt: userExists.updatedAt,
        accessToken,
      };

      // Set HTTP-only cookie (only send token for security)
      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: true, // set true in production
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.cookie("user", JSON.stringify(userExists), { httpOnly: false });

      return res.redirect(envConfigs.CLIENT_REDIRECT_URL);
    } catch (error) {
      console.error("Error in googleCallback:", error);
      return res
        .status(500)
        .json({ success: false, message: "Google login failed" });
    }
  };
}
