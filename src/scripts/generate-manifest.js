#!/usr/bin/env node
/* =====================================================
   GENERATE-MANIFEST.JS
   Automatically scans /src/blogs/ and generates manifest.json
   
   Usage: node scripts/generate-manifest.js
   
   Blog HTML files should include meta tags:
   <meta name="blog-title" content="Your Title">
   <meta name="blog-subtitle" content="Your Subtitle">
   <meta name="blog-category" content="Category">
   <meta name="blog-date" content="2024-12-07T14:30:00Z">
   ===================================================== */

const fs = require('fs');
const path = require('path');

// Configuration
const BLOGS_DIR = path.join(__dirname, '..', 'blogs');
const MANIFEST_PATH = path.join(BLOGS_DIR, 'manifest.json');

// ANSI colors for terminal output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

// ========================================
// EXTRACT META TAGS FROM HTML
// ========================================
function extractMetaTags(htmlContent, filename) {
    const meta = {
        title: null,
        subtitle: null,
        category: 'General',
        date: null,
        author: 'Anonymous'
    };
    
    // Extract meta tags using regex
    const metaRegex = /<meta\s+name=["']blog-(\w+)["']\s+content=["']([^"']+)["']\s*\/?>/gi;
    let match;
    
    while ((match = metaRegex.exec(htmlContent)) !== null) {
        const key = match[1].toLowerCase();
        const value = match[2];
        
        if (key === 'title') meta.title = value;
        else if (key === 'subtitle') meta.subtitle = value;
        else if (key === 'category') meta.category = value;
        else if (key === 'date') meta.date = value;
        else if (key === 'author') meta.author = value;
    }
    
    // Fallback: try to extract title from <title> tag
    if (!meta.title) {
        const titleMatch = htmlContent.match(/<title>([^<]+)<\/title>/i);
        if (titleMatch) {
            meta.title = titleMatch[1].split(' - ')[0].trim();
        }
    }
    
    // Fallback: try to extract title from <h1> tag
    if (!meta.title) {
        const h1Match = htmlContent.match(/<h1[^>]*>([^<]+)<\/h1>/i);
        if (h1Match) {
            meta.title = h1Match[1].trim();
        }
    }
    
    // Fallback: use filename as title
    if (!meta.title) {
        meta.title = filename
            .replace('.html', '')
            .replace(/-/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase());
    }
    
    // Fallback: use file modification date
    if (!meta.date) {
        const filePath = path.join(BLOGS_DIR, filename);
        const stats = fs.statSync(filePath);
        meta.date = stats.mtime.toISOString();
    }
    
    return meta;
}

// ========================================
// SCAN BLOGS DIRECTORY
// ========================================
function scanBlogsDirectory() {
    log('\n✧ Blog Manifest Generator ✧', 'magenta');
    log('━'.repeat(40), 'magenta');
    
    // Check if blogs directory exists
    if (!fs.existsSync(BLOGS_DIR)) {
        log(`Creating blogs directory: ${BLOGS_DIR}`, 'yellow');
        fs.mkdirSync(BLOGS_DIR, { recursive: true });
    }
    
    // Get all HTML files
    const files = fs.readdirSync(BLOGS_DIR)
        .filter(file => file.endsWith('.html'))
        .filter(file => file !== 'index.html') // Exclude index.html
        .filter(file => !file.startsWith('_')); // Exclude template files
    
    log(`\nFound ${files.length} blog file(s)`, 'cyan');
    
    const posts = [];
    
    files.forEach((filename, index) => {
        const filePath = path.join(BLOGS_DIR, filename);
        const htmlContent = fs.readFileSync(filePath, 'utf-8');
        const meta = extractMetaTags(htmlContent, filename);
        
        const post = {
            id: index + 1,
            title: meta.title,
            subtitle: meta.subtitle || meta.category,
            date: meta.date,
            file: filename,
            category: meta.category,
            author: meta.author
        };
        
        posts.push(post);
        log(`  ✓ ${filename}`, 'green');
        log(`    └─ "${meta.title}" (${meta.category})`, 'blue');
    });
    
    // Sort by date (newest first)
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Reassign IDs after sorting
    posts.forEach((post, index) => {
        post.id = index + 1;
    });
    
    return posts;
}

// ========================================
// GENERATE MANIFEST
// ========================================
function generateManifest(posts) {
    const manifest = {
        posts: posts,
        totalPosts: posts.length,
        lastUpdated: new Date().toISOString(),
        generatedBy: 'generate-manifest.js'
    };
    
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 4), 'utf-8');
    
    log(`\n✓ Manifest generated: ${MANIFEST_PATH}`, 'green');
    log(`  Total posts: ${posts.length}`, 'cyan');
    log(`  Last updated: ${manifest.lastUpdated}`, 'cyan');
}

// ========================================
// WATCH MODE
// ========================================
function watchMode() {
    log('\n👀 Watching for changes...', 'yellow');
    log('   Press Ctrl+C to stop\n', 'yellow');
    
    let debounceTimer;
    
    fs.watch(BLOGS_DIR, (eventType, filename) => {
        if (filename && filename.endsWith('.html')) {
            // Debounce to avoid multiple rapid updates
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                log(`\n📝 Change detected: ${filename}`, 'yellow');
                const posts = scanBlogsDirectory();
                generateManifest(posts);
            }, 500);
        }
    });
}

// ========================================
// MAIN
// ========================================
function main() {
    const args = process.argv.slice(2);
    const isWatchMode = args.includes('--watch') || args.includes('-w');
    
    // Initial generation
    const posts = scanBlogsDirectory();
    generateManifest(posts);
    
    // Start watch mode if requested
    if (isWatchMode) {
        watchMode();
    } else {
        log('\n💡 Tip: Use --watch or -w for auto-regeneration', 'yellow');
    }
}

main();
