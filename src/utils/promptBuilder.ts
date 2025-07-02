


export interface BrandNarrativeParams {
  industry: string;
  brandValues: string[];
  targetAudience: string;
  brandMission: string;
  brandVision: string;
  usp: string;
  brandPersonality: string;
  toneOfVoice: string;
  keyProducts: string[];
  brandStory: string;
  narrativeLength: "short" | "long";
}

export const buildPrompt = (
  params: BrandNarrativeParams,
  chatHistory?: { role: string; content: string }[],
  originalTask?: string
): string => {
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
    narrativeLength
  } = params;

  let prompt = `You are a luxury brand strategist. Craft a compelling and emotionally engaging brand narrative based on the following inputs:\n\n`;
  prompt += `Industry: ${industry}\n`;
  prompt += `Brand Values: ${brandValues.join(", ")}\n`;
  prompt += `Target Audience: ${targetAudience}\n`;
  prompt += `Brand Mission: ${brandMission}\n`;
  prompt += `Brand Vision: ${brandVision}\n`;
  prompt += `Unique Selling Proposition: ${usp}\n`;
  prompt += `Brand Personality: ${brandPersonality}\n`;
  prompt += `Tone of Voice: ${toneOfVoice}\n`;
  prompt += `Key Products/Services: ${keyProducts.join(", ")}\n`;
  prompt += `Brand Story/Background: ${brandStory}\n`;
  prompt += `\nThe narrative should emphasize exclusivity, emotion, and connection to high-end consumers.\n`;
  prompt += `Please generate a ${narrativeLength === "short" ? "concise (1-2 paragraphs)" : "detailed (3-5 paragraphs)"} narrative.\n`;

  if (originalTask) {
    prompt += `\nOriginal Task: ${originalTask}\n`;
  }

  if (chatHistory && chatHistory.length > 0) {
    prompt += `\nChat History (for context):\n`;
    chatHistory.forEach((msg, idx) => {
      prompt += `[${msg.role.toUpperCase()}]: ${msg.content}\n`;
    });
  }

  return prompt;
};
