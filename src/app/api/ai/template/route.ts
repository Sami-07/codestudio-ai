import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";


export async function GET(req: NextRequest) {

    const anthropic = new Anthropic();

    const response = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20240620",
        messages: [
            { role: "user", content: "Hello, how are you?" },
        ],
        max_tokens: 1024,
        temperature: 0.2,
        system: "Based on user's prompt, determinme if its a react or a node project. Return only a single word, react or node",
    });

    return NextResponse.json({
        // @ts-ignore
        content: response.content[0].text,
    });

}

