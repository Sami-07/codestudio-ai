# CodeStudio AI - AI-Powered Website Builder

CodeStudio AI is an innovative platform that allows users to create and deploy websites using natural language prompts. The platform leverages AI to generate complete, production-ready websites based on user requirements.

### Architecture Diagram

![Architecture Diagram](https://github.com/user-attachments/assets/0e68d915-6bc1-4ce6-95cc-09fe4311bd23)

### Demo Video

![Demo Video](https://github.com/user-attachments/assets/ce19a498-593b-4ed9-a617-6f250d5ee690)

## Features

### AI-Powered Website Generation
- Create complete websites using natural language prompts
- Examples:
  - "Build me a portfolio website"
  - "Create a landing page for my coffee shop"
- Real-time preview of the generated website in a web container
- Interactive editing capabilities:
  - Add new sections
  - Edit existing content
  - Modify design elements
  - Customize styling

### Code Management
- View and access the complete source code of the generated website
- Make modifications through natural language prompts
- Real-time code updates and preview

### Deployment Pipeline
The platform features a robust deployment pipeline that makes your website publicly accessible:

1. **Code Upload**
   - Codebase is sent to `/api/upload`
   - Files are securely stored in AWS S3 with unique identifiers

2. **Build Process**
   - Triggers an AWS ECS task (container)
   - Container pulls code files from S3
   - Builds the project in an isolated environment
   - Executes the build script
   - Uploads the `dist` folder to AWS S3

3. **Website Hosting**
   - S3 reverse proxy serves the website assets
   - Custom domain: `https://codestudioai.space/<project_id>/index.html`
   - Secure and scalable hosting solution

## Getting Started

1. Enter your website requirements using natural language
2. Review the generated website in the preview container
3. Make any necessary modifications using prompts
4. Deploy your website with a single click
5. Access your live website via the provided URL

## Technical Architecture

- **Frontend**: Real-time preview container
- **Backend**: API endpoints for code generation and deployment
- **Storage**: AWS S3 for code and asset storage
- **Build System**: AWS ECS for isolated build environments
- **Hosting**: S3 reverse proxy with custom domain support

