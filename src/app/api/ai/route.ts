import { NextRequest } from "next/server";

import Anthropic from "@anthropic-ai/sdk";
export async function POST(req: NextRequest) {


    const anthropic = new Anthropic();

    const msg = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 2000,
        temperature: 0.2,
        messages: [
            {
                role: "user",
                content: "Hello, how are you?"
            }
        ]
    });
    console.log(msg);
}