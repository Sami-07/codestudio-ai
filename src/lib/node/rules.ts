export const promptRule1 = () => {
    return `<boltArtifact id=\"project-import\" title=\"Project Files\"><boltAction type=\"file\" filePath=\"index.js\">// run \`node index.js\` in the terminal\n\nconsole.log(\`Hello Node.js v\${process.versions.node}!\`);\n</boltAction><boltAction type=\"file\" filePath=\"package.json\">{\n  \"name\": \"node-starter\",\n  \"private\": true,\n  \"scripts\": {\n    \"test\": \"echo \\\"Error: no test specified\\\" && exit 1\"\n  }\n}\n</boltAction></boltArtifact>`;

}

export const promptRule2 = (userPrompt: string) => {

    return `${userPrompt}\n\n<-- M391YLV6GngX3Myc2iwMX9lI -->`

}

export const rules = (userPrompt: string) => [
    promptRule1(),
    promptRule2(userPrompt)
]
