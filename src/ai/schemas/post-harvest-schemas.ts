
import { z } from 'zod';

const CurrentCropContextSchema = z.object({
  id: z.string(),
  cropName: z.string(),
  fieldSize: z.string(),
  location: z.string(),
  sowingDate: z.string(), // ISO string date
  additionalInfo: z.string().optional(),
});

export const PostHarvestInputSchema = z.object({
  cropContext: CurrentCropContextSchema.describe("The context of the user's currently selected crop."),
  estimatedYield: z.string().optional().describe('The estimated yield of the crop (e.g., "10 tonnes", "50 quintals").'),
  language: z.string().optional().describe('The language for the response.'),
});
export type PostHarvestInput = z.infer<typeof PostHarvestInputSchema>;

const CostingAnalysisSchema = z.object({
  estimatedYield: z.string().describe('The estimated yield provided by the user (e.g., "10 tonnes").'),
  costOfProduction: z.string().describe('An estimated cost of production to achieve this yield (e.g., "₹25,000").'),
  postProductionCost: z.string().describe('Estimated costs for storage, transport, and other post-harvest activities as per the recommendations (e.g., "₹7,000").'),
  estimatedSales: z.string().describe('Projected total sales revenue based on the estimated yield and prevailing market prices (e.g., "₹80,000").'),
  estimatedProfit: z.string().describe('The final estimated profit after all costs are deducted (e.g., "₹48,000").'),
});

export const PostHarvestOutputSchema = z.object({
  storageRecommendations: z.string().describe('Suggestions for optimal storage conditions, including temperature, humidity, and pest control measures.'),
  transportationOptions: z.string().describe('Recommendations for transportation methods, including suitable vehicles, containers, and logistics providers.'),
  marketLinkages: z.string().describe('Suggestions for potential markets, including prices, demand, and competition analysis.'),
  valueAdditionOpportunities: z.string().describe('Identification of potential value-added products, such as processing, packaging, or grading.'),
  pricingStrategy: z.string().describe('Recommendations for pricing strategies, including optimal pricing, negotiation tactics, and contract management.'),
  qualityControlMeasures: z.string().describe('Suggestions for quality control measures, including inspection, testing, and certification procedures.'),
  postHarvestHandling: z.string().describe('Recommendations for post-harvest handling practices, including cleaning, drying, and packaging.'),
  wasteManagement: z.string().describe('Suggestions for managing crop waste, including composting, recycling, or proper disposal.'),
  costingAnalysis: CostingAnalysisSchema.describe('A financial breakdown based on the provided yield and post-harvest recommendations.'),
});
export type PostHarvestOutput = z.infer<typeof PostHarvestOutputSchema>;
