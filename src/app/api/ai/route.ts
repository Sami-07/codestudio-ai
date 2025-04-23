import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { rules as reactRules } from "@/lib/react/rules";
import { rules as nodeRules } from "@/lib/node/rules";
import { getSystemPrompt } from "@/lib/prompt";
import { TextBlock } from "@anthropic-ai/sdk/resources";

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    // if (!projectType || typeof projectType !== 'string') {
    //   return NextResponse.json({ error: "Prompt is required and must be a string" }, { status: 400 });
    // }

    const anthropic = new Anthropic();

  
    
    const response = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      messages: messages,
      max_tokens: 8000,
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