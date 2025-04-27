import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getSystemPrompt } from "@/lib/prompt";
import { TextBlock } from "@anthropic-ai/sdk/resources";

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    const anthropic = new Anthropic();

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      messages: messages,
      max_tokens: 10000,
      temperature: 0.1,
      system: getSystemPrompt(),
    });

    return NextResponse.json({
      response: (response.content[0] as TextBlock).text
    });
  } catch (error) {
    console.error("Error in AI route:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: "Failed to process request", details: errorMessage }, { status: 500 });
  }
}