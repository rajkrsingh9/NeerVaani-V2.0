
import { NextResponse, type NextRequest } from "next/server";
import { marketAnalysis, MarketAnalysisInput } from "@/ai/flows/market-analysis-flow";
import { MarketAnalysisInputSchema } from "@/ai/schemas/market-analysis-schemas";

export async function POST(request: NextRequest) {
  try {
    const reqBody = await request.json();
    
    // Validate the input against the Zod schema
    const validationResult = MarketAnalysisInputSchema.safeParse(reqBody);

    if (!validationResult.success) {
      return NextResponse.json({
        error: "Invalid input format",
        details: validationResult.error.flatten(),
      }, { status: 400 });
    }

    const input: MarketAnalysisInput = validationResult.data;
    
    // Call the Genkit flow
    const analysis = await marketAnalysis(input);

    // Return the successful response from the flow
    return NextResponse.json(analysis, { status: 200 });

  } catch (error: any) {
    console.error("Error in Market Analysis webhook:", error);
    // Return a generic server error response
    return NextResponse.json({
      error: "An internal server error occurred.",
      details: error.message,
    }, { status: 500 });
  }
}
