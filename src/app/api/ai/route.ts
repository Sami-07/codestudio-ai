import { NextRequest, NextResponse } from "next/server";

import Anthropic from "@anthropic-ai/sdk";
import { rules as reactRules } from "@/lib/react/rules";
import { rules as nodeRules } from "@/lib/node/rules"
import { getSystemPrompt } from "@/lib/prompt";
import axios from "axios";
export async function GET(req: NextRequest) {


    const anthropic = new Anthropic();
    // const userPrompt = req.nextUrl.searchParams.get('prompt');
    const userPrompt = "Make a simple todo list app";
    const res = await axios.get("http://localhost:3000/api/ai/template");
    const projectType = res.data;
    console.log(projectType);

    let rules = [];
    if (projectType === "react") {
        rules = reactRules(userPrompt);
        //! UI structure Prompt
    } else if (projectType === "node") {
        rules = nodeRules(userPrompt);
        //! UI structure Prompt
    }
    else {
        return NextResponse.json({
            error: "Invalid project type"
        }, { status: 400 });
    }

    await anthropic.messages.stream({
        model: 'claude-3-7-sonnet-20250219',
        messages: [
            ...rules.map((rule) => ({ role: "user" as const, content: rule })),
        ],
        max_tokens: 1024, 
        temperature: 0.2,
        system: getSystemPrompt(),
    }).on('text', (text) => {
        console.log(text);
    });

}