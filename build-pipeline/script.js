import dotenv from 'dotenv';    
dotenv.config();
import express from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { generateSlug } from 'random-word-slugs';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const router = express.Router();

const BUCKET_NAME = "vercel-clone-outputs-s3";
const REGION = "ap-south-1"; // Replace with your S3 bucket's region

// Initialize the S3 client with your credentials
const s3Client = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
});

// Simple log function
function log(message) {
  console.log(message);
}

// Simple mime type lookup
function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const contentTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.txt': 'text/plain',
    '.md': 'text/markdown',
  };
  
  return contentTypes[ext] || 'application/octet-stream';
}

router.post('/deploy', async (req, res) => {
  // Generate a unique project ID
  const projectId = generateSlug();
  
  try {
    // Get file structure from request body
    const { fileStructure } = req.body;
    
    if (!fileStructure) {
      return res.status(400).json({ error: 'No file structure found' });
    }

    log("Starting build process...");

    // Create temp directory
    const tempDir = path.join(path.dirname(process.cwd()), 'temp', projectId);
    await fs.mkdir(tempDir, { recursive: true });

    // Write files to temp directory
    log("Writing files to disk...");
    await writeFilesToDisk(fileStructure, tempDir);
    console.log("fileStructure", fileStructure);
    exec("ls -la", { cwd: tempDir });
    console.log("tempDir", tempDir);
    console.log("cwd", process.cwd());
    
    // Install dependencies and build
    log("Installing dependencies...");
    
    const installProcess = exec('npm install', { cwd: tempDir });
    
    installProcess.stdout?.on('data', (data) => {
      log(data.toString());
    });
    
    installProcess.stderr?.on('data', (data) => {
      log(`ERROR: ${data.toString()}`);
    });
    
    // Wait for installation to finish
    await new Promise((resolve, reject) => {
      installProcess.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Installation process exited with code ${code}`));
        }
      });
    });
    
    log("Building project...");
    const buildProcess = exec('npm run build', { cwd: tempDir });
    
    buildProcess.stdout?.on('data', (data) => {
      log(data.toString());
    });
    
    buildProcess.stderr?.on('data', (data) => {
      log(`ERROR: ${data.toString()}`);
    });
    
    // Wait for build to finish
    await new Promise((resolve, reject) => {
      buildProcess.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Build process exited with code ${code}`));
        }
      });
    });

    // Upload to S3
    const distDir = path.join(tempDir, 'dist');
    const S3AbsoluteBasePath = `https://${BUCKET_NAME}.s3.amazonaws.com/__outputs/${projectId}`;
    
    // Process HTML files to update asset paths
    log("Processing HTML files to update asset paths...");
    await processHtmlFiles(distDir, S3AbsoluteBasePath);
    
    log("Starting to upload files to S3...");
    await uploadDirectoryToS3(distDir, BUCKET_NAME, projectId);
    log("Done with uploading all files to S3");

    // Clean up
    // await fs.rm(tempDir, { recursive: true, force: true });
    const domain = "https://codestudioai.space";
    return res.json({ 
      success: true, 
      message: 'Deployment successful',
      projectId: projectId,
      url: `${domain}/${projectId}/index.html`
    });
  } catch (error) {
    console.error('Deployment failed:', error);
    return res.status(500).json({ error: error.message });
  }
});

async function writeFilesToDisk(node, basePath) {
  // Special handling for src folder and its contents
  if (node.type === 'folder' && node.name === 'src') {
    const srcPath = path.join(basePath, 'src');
    await fs.mkdir(srcPath, { recursive: true });
    if (node.children) {
      for (const child of node.children) {
        // Preserve directory structure inside src
        const currentPath = path.join(srcPath, child.name);
        if (child.type === 'folder') {
          await fs.mkdir(currentPath, { recursive: true });
          if (child.children) {
            for (const grandChild of child.children) {
              await writeFilesToDisk(grandChild, currentPath);
            }
          }
        } else if (child.type === 'file' && child.content) {
          await fs.writeFile(currentPath, child.content);
        }
      }
    }
  } else if (node.type === 'folder') {
    // For non-src folders, write files directly to base path
    if (node.children) {
      for (const child of node.children) {
        await writeFilesToDisk(child, basePath);
      }
    }
  } else if (node.type === 'file' && node.content) {
    // Write file directly to basePath
    const filePath = path.join(basePath, node.name);
    await fs.writeFile(filePath, node.content);
  }
}

async function processHtmlFiles(dirPath, s3BasePath) {
  const files = await fs.readdir(dirPath);
  
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stat = await fs.stat(filePath);
    
    if (stat.isDirectory()) {
      await processHtmlFiles(filePath, s3BasePath);
    } else if (file.endsWith('.html')) {
      log(`Processing HTML file: ${filePath}`);
      let content = await fs.readFile(filePath, 'utf8');
      
      // Replace all src and href attributes that start with / but not with //
      content = content.replace(/(?:src|href)=["']\/(?!\/)(.*?)["']/g, (match, p1) => {
        return match.replace(`/${p1}`, `${s3BasePath}/${p1}`);
      });
      
      await fs.writeFile(filePath, content);
      log(`Updated asset paths in: ${filePath}`);
    }
  }
}

async function uploadDirectoryToS3(dirPath, bucketName, projectId, currentPath = '') {
  const files = await fs.readdir(dirPath);
  
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stat = await fs.stat(filePath);
    
    if (stat.isDirectory()) {
      await uploadDirectoryToS3(
        filePath, 
        bucketName, 
        projectId,
        currentPath ? `${currentPath}/${file}` : file
      );
    } else {
      const relativePath = currentPath ? `${currentPath}/${file}` : file;
      const s3Key = `__outputs/${projectId}/${relativePath}`;
      
      log(`${filePath} is currently being uploaded to S3`);
      
      try {
        const fileContent = await fs.readFile(filePath);
        const command = new PutObjectCommand({
          Bucket: bucketName,
          Key: s3Key,
          Body: fileContent,
          ContentType: getMimeType(filePath)
        });

        await s3Client.send(command);
        log(`${filePath} Uploaded to S3`);
      } catch (error) {
        log(`Error uploading ${filePath}: ${error}`);
        throw error;
      }
    }
  }
}

export default router; 