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
        originalTask
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

      const existingUser = await UserService.getUser(email);
      if (!existingUser) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      let chatHistory: any[] = [];
      let newChatId = chatId || uuidv4();
      let origTask = originalTask;

      if (chatId) {
        const prevChats = await postgreDb.select().from(chats).where(eq(chats.chatId, chatId));
        chatHistory = prevChats.map((c: any) => c.chat);
        if (!origTask && chatHistory.length > 0) {
          const firstUserMsg = chatHistory.find((m: any) => m.role === "user");
          origTask = firstUserMsg?.content;
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

      const prompt = buildPrompt(promptParams, chatHistory, origTask);
      const response = await generateNarrativeFromGroq(prompt);

      const userMsg = {
        role: "user",
        content: prompt,
        parentMessageId: parentMessageId || null
      };

      const assistantMsg = {
        role: "assistant",
        content: response,
        parentMessageId: parentMessageId || null
      };

      await postgreDb.insert(chats).values([
        {
          chatId: newChatId,
          chat: JSON.stringify(userMsg),
          userId: existingUser.id,
          publicId: existingUser.publicId,
          parentMessageId: parentMessageId || null,
          messageRole: "user"
        },
        {
          chatId: newChatId,
          chat: JSON.stringify(assistantMsg),
          userId: existingUser.id,
          publicId: existingUser.publicId,
          parentMessageId: parentMessageId || null,
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
}
