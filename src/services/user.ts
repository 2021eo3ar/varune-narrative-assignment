import { eq } from "drizzle-orm";
import postgreDb from "../config/dbConfig";
import { users } from "../db/schema";

export default class UserService {

  static getUser = async (email: string) => {
    try {
      const [user] = await postgreDb
        .select()
        .from(users)
        .where(eq(users.email, email));
      return user;
    } catch (error) {
      console.error("some error occured: ", error);
    }
  };

  static updateCredits = async (userId: number, credits: number) => {
    try {
      await postgreDb
        .update(users)
        .set({ credits })
        .where(eq(users.id, userId));
    } catch (error) {
      console.error("Error updating credits:", error);
    }
  };

  static resetCreditsIfNeeded = async (user: any, dailyLimit = 10) => {
    const now = new Date();
    const lastReset = user.lastCreditReset ? new Date(user.lastCreditReset) : null;
    // Compare by day, month, year (not just ms diff)
    const needsReset = !lastReset ||
      now.getDate() !== lastReset.getDate() ||
      now.getMonth() !== lastReset.getMonth() ||
      now.getFullYear() !== lastReset.getFullYear();
    if (needsReset) {
      await postgreDb
        .update(users)
        .set({ credits: dailyLimit, lastCreditReset: now })
        .where(eq(users.id, user.id));
      user.credits = dailyLimit;
      user.lastCreditReset = now;
    }
    return user;
  };

  static insertUser = async ({ name, email, profileImage }) => {
    try {
        const [newUser] = await postgreDb
          .insert(users)
          .values({
            name,
            email,
            profileImage,
          })
          .returning({
            id : users.id,
            name: users.name,
            email: users.email,
            profileImage: users.profileImage,
            publicId: users.publicId,
            credits: users.credits,
            lastCreditReset: users.lastCreditReset,
            createdAt: users.createdAt,
            updatedAt: users.updatedAt
          });
          console.log(newUser)
          return newUser[0];
    } catch (error) {
        console.error("some error occured :",error)
    }
  };
}
