
import { NextResponse, type NextRequest } from "next/server";
import { recommendCrops, CropRecommenderInput } from "@/ai/flows/crop-recommender-flow";
import { CropRecommenderInputSchema } from "@/ai/schemas/crop-recommender-schemas";

export async function POST(request: NextRequest) {
  try {
    const reqBody = await request.json();
    
    // Validate the input against the Zod schema
    const validationResult = CropRecommenderInputSchema.safeParse(reqBody);

    if (!validationResult.success) {
      return NextResponse.json({
        error: "Invalid input format",
        details: validationResult.error.flatten(),
      }, { status: 400 });
    }

    const input: CropRecommenderInput = validationResult.data;
    
    // Call the Genkit flow
    const recommendations = await recommendCrops(input);

    // Return the successful response from the flow
    return NextResponse.json(recommendations, { status: 200 });

  } catch (error: any) {
    console.error("Error in Crop Recommender webhook:", error);
    // Return a generic server error response
    return NextResponse.json({
      error: "An internal server error occurred.",
      details: error.message,
    }, { status: 500 });
  }
}
