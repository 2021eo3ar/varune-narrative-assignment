import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { BrandNarrativeParams, buildPrompt } from "../utils/promptBuilder";
import { generateNarrativeFromGroq } from "../utils/groqUtil";
import { chats } from "../db/schema";
import { eq } from "drizzle-orm";
import postgreDb from "../config/dbConfig";
import { UserService } from "../services";

export default class NarrativeController {
  
  static async generateNarrative(req: Request, res: Response): Promise<any> {
    try {
      const {
        industry,
        brandValues,
        targetAudience,
        brandMission,
        brandVision,
        usp,
        brandPersonality,
        toneOfVoice,
        keyProducts,
        brandStory,
        narrativeLength,
        chatId,
        parentMessageId,
        originalTask,
        newInstruction
      } = req.body;

      const requiredShort = [industry, brandValues, targetAudience, brandMission, usp];
      const requiredLong = [
        industry,
        brandValues,
        targetAudience,
        brandMission,
        usp,
        brandVision,
        brandPersonality,
        toneOfVoice,
        keyProducts,
        brandStory
      ];

      if (narrativeLength === "short") {
        if (requiredShort.some(v => v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0))) {
          return res.status(400).json({
            success: false,
            message: "Missing required fields for short narrative (industry, brandValues, targetAudience, brandMission, usp)"
          });
        }
      } else {
        if (requiredLong.some(v => v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0))) {
          return res.status(400).json({
            success: false,
            message: "Missing required fields for long narrative (all 10 parameters)"
          });
        }
      }

      const { userId, email } = req.user as { userId: number; email: string };

      let existingUser = await UserService.getUser(email);
      if (!existingUser) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      // Reset credits if 24 hours have passed since last reset
      existingUser = await UserService.resetCreditsIfNeeded(existingUser);

      let chatHistory: any[] = [];
      let newChatId = chatId || uuidv4();
      let origTask = originalTask;

      let lastMessageId: string | null = null;
      if (chatId) {
        const prevChats = await postgreDb.select().from(chats).where(eq(chats.chatId, chatId));
        chatHistory = prevChats.map((c: any) => c.chat);
        if (!origTask && chatHistory.length > 0) {
          const firstUserMsg = chatHistory.find((m: any) => m.role === "user");
          origTask = firstUserMsg?.content;
        }
        // For parentMessageId threading, get the last message id
        if (prevChats.length > 0) {
          lastMessageId = prevChats[prevChats.length - 1].id?.toString();
        }
      }

      const safeBrandValues = Array.isArray(brandValues) ? brandValues : [brandValues];
      const safeKeyProducts = Array.isArray(keyProducts) ? keyProducts : [];

      const promptParams: BrandNarrativeParams = narrativeLength === "short"
        ? {
            industry,
            brandValues: safeBrandValues,
            targetAudience,
            brandMission,
            brandVision: "",
            usp,
            brandPersonality: "",
            toneOfVoice: "",
            keyProducts: [],
            brandStory: "",
            narrativeLength: "short"
          }
        : {
            industry,
            brandValues: safeBrandValues,
            targetAudience,
            brandMission,
            brandVision,
            usp,
            brandPersonality,
            toneOfVoice,
            keyProducts: safeKeyProducts,
            brandStory,
            narrativeLength: "long"
          };


      // Build prompt with all context (originalTask, chatHistory, newInstruction)
      const prompt = buildPrompt(promptParams, chatHistory, origTask, newInstruction);
      const response = await generateNarrativeFromGroq(prompt);

      // Save user message first, get its id, then save assistant message with that as parent
      const [userMsgRow] = await postgreDb.insert(chats).values([
        {
          chatId: newChatId,
          chat: JSON.stringify({ role: "user", content: newInstruction || prompt }),
          userId: existingUser.id,
          publicId: existingUser.publicId,
          parentMessageId: lastMessageId || parentMessageId || null,
          messageRole: "user"
        }
      ]).returning();

      const userMsgId = userMsgRow?.id?.toString() || null;

      await postgreDb.insert(chats).values([
        {
          chatId: newChatId,
          chat: JSON.stringify({ role: "assistant", content: response }),
          userId: existingUser.id,
          publicId: existingUser.publicId,
          parentMessageId: userMsgId,
          messageRole: "assistant"
        }
      ]);

      res.status(200).json({
        success: true,
        data: {
          response,
          chatId: newChatId,
          originalTask: origTask || prompt
        }
      });
    } catch (err) {
      console.error("Error generating narrative:", err);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  }
   
   static getAllChats = async (req: Request, res: Response): Promise<any> => {
    try {
      const { userId, email } = req.user as any;
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "userId not found",
        });
      }

      const existingUser = await UserService.getUser(email);
      if (!existingUser)
        return res.status(404).json({
          success: false,
          message: "user not found",
        });

      const allChats = await UserService.getAllChats(userId);
      if (!allChats) {
        return res.status(404).json({
          success: false,
          message: "no chats found for the user",
        });
      }

      return res.status(200).json({
        success: true,
        message: "User's chats found successfully",
        allChats,
      });
    } catch (error) {
      console.error("internal server error occured: ", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };
}
