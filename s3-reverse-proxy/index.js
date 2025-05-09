const express = require("express");
const httpProxy = require("http-proxy");
const app = express();
const PORT = process.env.PORT || 8000;
const BASE_PATH = "https://vercel-clone-outputs-s3.s3.ap-south-1.amazonaws.com/__outputs";

const proxy = httpProxy.createProxy();

// Handle proxying resources
app.use((req, res, next) => {
    try {
        const hostname = req.hostname || req.headers.host || '';
        let subDomain;
        let originalUrl = req.url;
        
        // Handle different domain patterns for local and production
        if (hostname.includes('localhost')) {
            // Local development: subdomain.localhost:8000
            subDomain = hostname.split(".")[0];
            // Skip 'localhost' as subdomain
            if (subDomain === 'localhost') {
                // Try to get project ID from path instead
                const urlParts = req.url.split('/').filter(Boolean);
                if (urlParts.length > 0) {
                    subDomain = urlParts[0];
                    req.url = '/' + urlParts.slice(1).join('/');
                    if (req.url === '/') req.url = '';
                }
            }
        } else {
            // Production: Either using custom domains or a specific pattern
            // Extract the project identifier from URL path if using a single domain
            const urlParts = req.url.split('/').filter(Boolean);
            if (urlParts.length > 0) {
                subDomain = urlParts[0];
                req.url = '/' + urlParts.slice(1).join('/');
                if (req.url === '/') req.url = '';
            } else {
                // For custom domains in production
                subDomain = hostname.split('.')[0];
            }
        }
        
        // Fallback if no subdomain found
        if (!subDomain) {
            return res.status(400).send('Invalid request: No project identifier found');
        }
        
        // Create the target URL for the proxy
        const resolvesTo = `${BASE_PATH}/${subDomain}`;
        console.log(`Proxying request: ${originalUrl} -> ${resolvesTo}${req.url}`);
        console.log("subDomain:", subDomain);
        console.log("hostname:", hostname);
        
        // Proxy the request to the S3 bucket
        proxy.web(req, res, { 
            target: resolvesTo, 
            changeOrigin: true,
            ignorePath: false
        });
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).send('Internal server error');
    }
});

// Modify the proxy request to handle root requests
proxy.on("proxyReq", (proxyReq, req, res) => {
    try {
        const url = req.url;
        if (url === "/" || url === "") {
            proxyReq.path += "index.html";
        }
    } catch (error) {
        console.error('Error in proxyReq:', error);
    }
});

// Handle the response from S3
proxy.on('proxyRes', function(proxyRes, req, res) {
    try {
        const contentType = proxyRes.headers['content-type'] || '';
        
        // Only process HTML responses
        if (contentType.includes('text/html')) {
            let body = '';
            proxyRes.on('data', function(chunk) {
                body += chunk;
            });
            
            proxyRes.on('end', function() {
                try {
                    // Replace absolute URLs to S3 with relative URLs
                    body = body.replace(
                        new RegExp('https://vercel-clone-outputs-s3.s3.ap-south-1.amazonaws.com', 'g'), 
                        ''
                    );
                    
                    // Update content-length
                    res.setHeader('content-length', Buffer.byteLength(body, 'utf8'));
                    res.end(body);
                } catch (error) {
                    console.error('Error processing response body:', error);
                    res.status(500).end('Error processing response');
                }
            });
        }
    } catch (error) {
        console.error('Error in proxyRes:', error);
    }
});

// Error handling for proxy
proxy.on('error', function(err, req, res) {
    console.error('Proxy error:', err);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Something went wrong with the proxy.');
});

app.listen(PORT, () => {
    console.log(`Reverse Proxy listening at PORT ${PORT}`);
    console.log(`Local access examples:`);
    console.log(`1. http://your-subdomain.localhost:${PORT}/`);
    console.log(`2. http://localhost:${PORT}/your-subdomain/`);
    console.log(`Production access: Use your domain with path pattern: /subdomain-name/`);
});