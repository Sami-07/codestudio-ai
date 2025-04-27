import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";
import { generateSlug } from "random-word-slugs";
import { ECSClient, RunTaskCommand } from "@aws-sdk/client-ecs";
const BUCKET_NAME = "vercel-clone-outputs-s3";
const REGION = "ap-south-1";
const s3Client = new S3Client({
    region: REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
    }
});

const ecsClient = new ECSClient({
    region: REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
    }
})
async function SpinUpAwsECS(projectId: string) {
    const command = new RunTaskCommand({
        cluster: process.env.ECS_CLUSTER_ARN,
        taskDefinition: process.env.ECS_TASK_ARN,
        launchType: "FARGATE",
        count: 1,
        networkConfiguration: {
            awsvpcConfiguration: {
                assignPublicIp: "ENABLED",
                subnets: ["subnet-074a1a93b8d92d180", "subnet-0b37d7e856b0fbb65", "subnet-078ce503d3520f690"],
                securityGroups: ["sg-01a3f07db3cd9be93"]
            }
        },
        overrides: {
            containerOverrides: [
                {
                    name: "vercel-build-image",
                    environment: [
                      
                        {
                            name: "PROJECT_ID", value: projectId
                        }, {
                            name: "AWS_ACCESS_KEY_ID", value: process.env.AWS_ACCESS_KEY_ID
                        }, {
                            name: "AWS_SECRET_ACCESS_KEY", value: process.env.AWS_SECRET_ACCESS_KEY
                        }
                    ]
                }
            ]
        }
    })
    await ecsClient.send(command);
}

export async function POST(request: NextRequest) {
    try {

        return NextResponse.json({
            success: true,
            message: "Deployment started successfully. You can access the deployed website at https://codestudioai.space/ in a few minutes",
            deployedLink: "https://codestudioai.space/",
            deploymentId: "codestudioai"
        });

        const { fileStructure } = await request.json();
        console.log(fileStructure);

        // Generate a unique directory name
        const uniqueDirectoryName = generateSlug(3, { format: "kebab" });
        console.log(`Uploading to directory: ${uniqueDirectoryName}`);

        const filesToUpload: { path: string; content: string }[] = [];

        // Recursively extract files from the nested structure
        function extractFiles(node: any) {
            if (node.type === 'file' && node.content) {
                filesToUpload.push({
                    path: node.path,
                    content: node.content
                });
            } else if (node.children && Array.isArray(node.children)) {
                for (const child of node.children) {
                    extractFiles(child);
                }
            }
        }

        // Start extraction from root node
        extractFiles(fileStructure);

        // Upload all files to S3 inside the unique directory
        const uploadPromises = filesToUpload.map(async ({ path, content }) => {
            const s3Key = `${uniqueDirectoryName}/${path}`;
            const params = {
                Bucket: BUCKET_NAME,
                Key: s3Key,
                Body: String(content),
                ContentType: 'text/plain',
            };

            const command = new PutObjectCommand(params);
            return s3Client.send(command);
        });

        await Promise.all(uploadPromises);

        // Spin up an ECS task to build and deploy the project
        await SpinUpAwsECS(uniqueDirectoryName);

        // Create a Vercel deployment
        return NextResponse.json({
            success: true,
            message: `Deployment started successfully. You can access the deployed website at https://codestudioai.space/${uniqueDirectoryName}/index.html in a few minutes`,
            deployedLink: `https://codestudioai.space/${uniqueDirectoryName}/index.html`,
            deploymentId: uniqueDirectoryName
        });
    } catch (error) {
        console.error('Error uploading files:', error);
        return NextResponse.json({ success: false, error: 'Failed to upload files' }, { status: 500 });
    }
}
