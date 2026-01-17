
import { GoogleGenAI, Type } from "@google/genai";
import { BusinessConfig, SimulationResult, AISummary } from "../types";

export const getAIInsights = async (config: BusinessConfig, result: SimulationResult): Promise<AISummary> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const verdict = result.opportunityCostLoss > 0 && result.monthlyProfit > 0 ? 'Improve' : 
                  result.monthlyProfit < 0 ? 'Exit / Pivot' : 'Continue';

  const prompt = `
    Act as a veteran business strategist. Analyze this detailed business simulation.
    
    Business: ${config.type} in ${config.area}.
    Current Performance:
    - Monthly Profit: ${config.currency}${result.monthlyProfit}
    - Opportunity Cost: Compared to a job and FD, this user is ${result.opportunityCostLoss > 0 ? 'LOSING' : 'GAINING'} ${config.currency}${Math.abs(result.opportunityCostLoss)}/month.
    - Risk: ${result.riskLevel} (Score: ${result.dependencyRiskScore}% dependency on top product).
    - Survival: Needs ${result.minSalesToSurvive} customers/day just to pay bills.
    - Cash: ${result.cashSurvivalMonths === -1 ? 'Safe' : result.cashSurvivalMonths + ' months left'}.

    Provide:
    1. A sharp explanation of why the business is in this state.
    2. Analyze the Dependency Risk (${result.dependencyRiskScore}%) and Seasonality impact.
    3. Actionable strategic recommendations.
    4. A final verdict based on opportunity cost: Continue, Improve, or Exit / Pivot.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            explanation: { type: Type.STRING },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
            riskAnalysis: { type: Type.STRING },
            advisorVerdict: { 
              type: Type.STRING, 
              enum: ['Continue', 'Improve', 'Exit / Pivot'] 
            }
          },
          required: ["explanation", "recommendations", "riskAnalysis", "advisorVerdict"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("AI Insight Error:", error);
    return {
      explanation: "Analysis failed. However, your numbers show a profit margin that might be tight relative to your opportunity costs.",
      recommendations: ["Increase volume by 15%", "Diversify product mix to reduce dependency risk"],
      riskAnalysis: "High fixed costs or dependency on a single item detected.",
      advisorVerdict: result.monthlyProfit > 0 ? 'Improve' : 'Exit / Pivot'
    };
  }
};
