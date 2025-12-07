#!/usr/bin/env node
/* =====================================================
   NEW-POST.JS
   Interactive script to create new blog posts
   
   Usage: node scripts/new-post.js
   Or:    npm run new-post
   ===================================================== */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const BLOGS_DIR = path.join(__dirname, '..', 'blogs');


// ANSI colors
const c = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    red: '\x1b[31m'
};

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function ask(question) {
    return new Promise(resolve => {
        rl.question(`${c.cyan}${question}${c.reset}`, answer => {
            resolve(answer.trim());
        });
    });
}

function slugify(text) {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
}

const BLOG_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{TITLE}} - Abby's Blog</title>
    
    <!-- Blog Metadata (used by BlogStatusManager) -->
    <meta name="blog-title" content="{{TITLE}}">
    <meta name="blog-subtitle" content="{{SUBTITLE}}">
    <meta name="blog-category" content="{{CATEGORY}}">
    <meta name="blog-date" content="{{DATE}}">
    <meta name="blog-author" content="{{AUTHOR}}">
</head>
<body>
    <article class="blog-entry">
        <header>
            <h1>{{TITLE}}</h1>
            <p class="blog-meta">
                <span class="date">{{READABLE_DATE}}</span>
                <span class="category">{{CATEGORY}}</span>
            </p>
        </header>
        
        <div class="blog-content">
            <p>Start writing your blog post here~ ♡</p>
            
            <!-- Add your content below -->
            
        </div>
        
        <footer>
            <p>Thanks for reading! ♡</p>
        </footer>
    </article>
</body>
</html>`;

async function main() {
    console.log(`\n${c.magenta}${c.bright}✧ Create New Blog Post ✧${c.reset}`);
    console.log(`${c.magenta}${'━'.repeat(35)}${c.reset}\n`);
    
    // Get post details
    const title = await ask('📝 Title: ');
    if (!title) {
        console.log(`${c.red}Error: Title is required${c.reset}`);
        rl.close();
        return;
    }
    
    const subtitle = await ask('📌 Subtitle (optional): ') || title;
    
    console.log(`\n${c.yellow}Categories: Updates, Gaming, Art, Life, Music, Tech${c.reset}`);
    const category = await ask('🏷️  Category: ') || 'General';
    
    const author = await ask('✍️  Author (default: Abby): ') || 'Abby';
    
    // Generate filename
    const slug = slugify(title);
    const filename = `${slug}.html`;
    const filepath = path.join(BLOGS_DIR, filename);
    
    // Check if file exists
    if (fs.existsSync(filepath)) {
        const overwrite = await ask(`\n${c.yellow}⚠️  File "${filename}" exists. Overwrite? (y/N): ${c.reset}`);
        if (overwrite.toLowerCase() !== 'y') {
            console.log(`${c.yellow}Cancelled.${c.reset}`);
            rl.close();
            return;
        }
    }
    
    // Generate dates
    const now = new Date();
    const isoDate = now.toISOString();
    const readableDate = now.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    // Create blog content
    const content = BLOG_TEMPLATE
        .replace(/{{TITLE}}/g, title)
        .replace(/{{SUBTITLE}}/g, subtitle)
        .replace(/{{CATEGORY}}/g, category)
        .replace(/{{AUTHOR}}/g, author)
        .replace(/{{DATE}}/g, isoDate)
        .replace(/{{READABLE_DATE}}/g, readableDate);
    
    // Ensure blogs directory exists
    if (!fs.existsSync(BLOGS_DIR)) {
        fs.mkdirSync(BLOGS_DIR, { recursive: true });
    }
    
    // Write file
    fs.writeFileSync(filepath, content, 'utf-8');
    
    console.log(`\n${c.green}${c.bright}✓ Blog post created!${c.reset}`);
    console.log(`${c.blue}  File: ${filepath}${c.reset}`);
    console.log(`${c.blue}  Date: ${readableDate}${c.reset}`);
    
    // Auto-regenerate manifest
    console.log(`\n${c.yellow}Regenerating manifest...${c.reset}`);
    
    try {
        const { execSync } = require('child_process');
        execSync('node scripts/generate-manifest.js', { 
            cwd: path.join(__dirname, '..'),
            stdio: 'inherit'
        });
    } catch (e) {
        console.log(`${c.yellow}Note: Run 'npm run generate' to update the manifest${c.reset}`);
    }
    
    console.log(`\n${c.magenta}Happy blogging! (=^･ω･^=)${c.reset}\n`);
    
    rl.close();
}

main();
