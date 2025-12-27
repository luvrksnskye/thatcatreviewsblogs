
/* =====================================================
   SERVER.JS - Auto-regenerating Blog Server
   
   Sirve el sitio web y regenera automáticamente el
   manifest cuando detecta cambios en /src/blogs/
   
   Nueva estructura: /blogs/nombre-post/index.html
   
   Usage: node server.js
   Or:    npm start
   ===================================================== */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const PORT = process.env.PORT || 3000;
const ROOT_DIR = path.join(__dirname, '..');        // -> /abbyblogs/src
const BLOGS_DIR = path.join(ROOT_DIR, 'blogs');     // -> /abbyblogs/src/blogs


// MIME types
const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.wav': 'audio/wav',
    '.mp3': 'audio/mpeg',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2'
};

// Colors for terminal
const c = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    red: '\x1b[31m',
    dim: '\x1b[2m'
};

// ========================================
// MANIFEST GENERATOR (inline) - FOLDER BASED
// ========================================
function generateManifest() {
    const manifestPath = path.join(BLOGS_DIR, 'manifest.json');
    
    if (!fs.existsSync(BLOGS_DIR)) {
        fs.mkdirSync(BLOGS_DIR, { recursive: true });
    }
    
    // Get all subdirectories that contain index.html
    const entries = fs.readdirSync(BLOGS_DIR, { withFileTypes: true });
    
    const blogFolders = entries
        .filter(entry => entry.isDirectory())
        .filter(entry => !entry.name.startsWith('_'))
        .filter(entry => !entry.name.startsWith('.'))
        .filter(entry => {
            const indexPath = path.join(BLOGS_DIR, entry.name, 'index.html');
            return fs.existsSync(indexPath);
        })
        .map(entry => entry.name);
    
    const posts = blogFolders.map((folderName, index) => {
        const indexPath = path.join(BLOGS_DIR, folderName, 'index.html');
        const content = fs.readFileSync(indexPath, 'utf-8');
        const stats = fs.statSync(indexPath);
        
        // Extract meta tags
        const getMeta = (name) => {
            const match = content.match(new RegExp(`<meta\\s+name=["']blog-${name}["']\\s+content=["']([^"']+)["']`, 'i'));
            return match ? match[1] : null;
        };
        
        // Fallback title from <title> or <h1>
        let title = getMeta('title');
        if (!title) {
            const titleMatch = content.match(/<title>([^<]+)<\/title>/i);
            title = titleMatch ? titleMatch[1].split(' - ')[0].trim() : null;
        }
        if (!title) {
            const h1Match = content.match(/<h1[^>]*>([^<]+)<\/h1>/i);
            title = h1Match ? h1Match[1].trim() : null;
        }
        if (!title) {
            title = folderName.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        }
        
        return {
            id: index + 1,
            title: title,
            subtitle: getMeta('subtitle') || getMeta('category') || 'Blog post',
            date: getMeta('date') || stats.mtime.toISOString(),
            file: folderName,  // Folder name instead of filename
            category: getMeta('category') || 'General',
            author: getMeta('author') || 'Anonymous'
        };
    });
    
    // Sort by date (newest first)
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));
    posts.forEach((post, i) => post.id = i + 1);
    
    const manifest = {
        posts,
        totalPosts: posts.length,
        lastUpdated: new Date().toISOString(),
        generatedBy: 'server.js (auto)',
        structure: 'folder-based'
    };
    
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 4));
    return posts.length;
}

// ========================================
// FILE WATCHER
// ========================================
let debounceTimer;
let isWatching = false;

function startWatcher() {
    if (isWatching) return;
    
    if (!fs.existsSync(BLOGS_DIR)) {
        fs.mkdirSync(BLOGS_DIR, { recursive: true });
    }
    
    // Watch recursively for changes in subdirectories
    fs.watch(BLOGS_DIR, { recursive: true }, (eventType, filename) => {
        if (filename && filename.endsWith('.html') && !filename.startsWith('_')) {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                const timestamp = new Date().toLocaleTimeString();
                console.log(`${c.yellow}[${timestamp}] 📝 Change detected: ${filename}${c.reset}`);
                
                const count = generateManifest();
                console.log(`${c.green}[${timestamp}] ✓ Manifest updated (${count} posts)${c.reset}`);
            }, 300);
        }
    });
    
    isWatching = true;
    console.log(`${c.cyan}👀 Watching ${BLOGS_DIR} for changes...${c.reset}`);
}

// ========================================
// HTTP SERVER
// ========================================
const server = http.createServer((req, res) => {
    let filePath = path.join(ROOT_DIR, req.url === '/' ? 'index.html' : req.url);
    
    // Security: prevent directory traversal
    if (!filePath.startsWith(ROOT_DIR)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
        // Try adding .html
        if (fs.existsSync(filePath + '.html')) {
            filePath += '.html';
        } else {
            res.writeHead(404);
            res.end('Not Found');
            return;
        }
    }
    
    // If directory, serve index.html
    if (fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, 'index.html');
        if (!fs.existsSync(filePath)) {
            res.writeHead(404);
            res.end('Not Found');
            return;
        }
    }
    
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    
    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(500);
            res.end('Server Error');
            return;
        }
        
        // Add CORS headers for local development
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
    });
});

// ========================================
// START SERVER
// ========================================
console.log(`\n${c.magenta}✧ Blog Server ✧${c.reset}`);
console.log(`${c.magenta}${'─'.repeat(40)}${c.reset}\n`);

// Generate manifest on startup
console.log(`${c.blue}Generating initial manifest...${c.reset}`);
const postCount = generateManifest();
console.log(`${c.green}✓ Found ${postCount} blog posts${c.reset}\n`);

// Start file watcher
startWatcher();

// Start HTTP server
server.listen(PORT, () => {
    console.log(`\n${c.green}✓ Server running at:${c.reset}`);
    console.log(`  ${c.cyan}http://localhost:${PORT}${c.reset}\n`);
    console.log(`${c.dim}Press Ctrl+C to stop${c.reset}\n`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log(`\n${c.yellow}Shutting down...${c.reset}`);
    server.close();
    process.exit(0);
});
