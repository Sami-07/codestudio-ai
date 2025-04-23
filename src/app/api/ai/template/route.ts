import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { rules as reactRules } from "@/lib/react/rules";
import { rules as nodeRules } from "@/lib/node/rules";
import { TextBlock } from "@anthropic-ai/sdk/resources";
export async function GET(req: NextRequest) {
    const userPrompt = req.nextUrl.searchParams.get('prompt');
    const anthropic = new Anthropic();

    if (!userPrompt) {
        return NextResponse.json({
            error: "Prompt is required"
        }, { status: 400 });
    }

    const response = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20240620",
        messages: [
            { role: "user", content: userPrompt },
        ],
        max_tokens: 1024,
        temperature: 0.2,
        system: "Based on user's prompt, determinme if its a react or a node project. Return only a single word, react or node",
    });

    const projectType = (response.content[0] as TextBlock).text.trim();
    if(projectType === "react") {
        return NextResponse.json({
            // @ts-ignore
            projectType: projectType,
            prompts: reactRules(userPrompt),
            uiPrompts: [reactRules(userPrompt)[0]] // First rule as UI prompt
        });
    } else if(projectType === "node") {
        return NextResponse.json({
            // @ts-ignore
            projectType: projectType,
            prompts: nodeRules(userPrompt),
            uiPrompts: [nodeRules(userPrompt)[0]] // First rule as UI prompt
        });
    } else {
        return NextResponse.json({
            error: "Invalid project type"
        }, { status: 400 });
    }
}

