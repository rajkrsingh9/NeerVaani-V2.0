
import { NextResponse, type NextRequest } from "next/server";
import { findSchemes, GovernmentSchemesInput } from "@/ai/flows/government-schemes-flow";
import { GovernmentSchemesInputSchema } from "@/ai/schemas/government-schemes-schemas";

export async function POST(request: NextRequest) {
  try {
    const reqBody = await request.json();
    
    // Validate the input against the Zod schema
    const validationResult = GovernmentSchemesInputSchema.safeParse(reqBody);

    if (!validationResult.success) {
      return NextResponse.json({
        error: "Invalid input format",
        details: validationResult.error.flatten(),
      }, { status: 400 });
    }

    const input: GovernmentSchemesInput = validationResult.data;
    
    // Call the Genkit flow
    const schemes = await findSchemes(input);

    // Return the successful response from the flow
    return NextResponse.json(schemes, { status: 200 });

  } catch (error: any) {
    console.error("Error in Government Schemes webhook:", error);
    // Return a generic server error response
    return NextResponse.json({
      error: "An internal server error occurred.",
      details: error.message,
    }, { status: 500 });
  }
}
