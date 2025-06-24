#!/usr/bin/env node

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const CONFIG = {
  baseUrl: 'http://localhost:1314',
  outputDir: 'static/images/social',
  dimensions: {
    width: 1200,
    height: 630
  },
  quality: 90,
  waitTime: 3000 // Reduced wait time
};

function parseArguments() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error('Usage: node generate-social-images.js <relative-url> <output-filename> [output-dir]');
    console.error('Example: node generate-social-images.js "/" "home.jpg"');
    console.error('Example: node generate-social-images.js "/films/" "films.jpg" "static/images/social"');
    process.exit(1);
  }
  
  const [relativeUrl, outputFilename, outputDir] = args;
  
  // Ensure URL starts with /
  const url = relativeUrl.startsWith('/') ? relativeUrl : '/' + relativeUrl;
  
  // Ensure filename has .jpg extension
  const filename = outputFilename.endsWith('.jpg') ? outputFilename : outputFilename + '.jpg';
  
  // Use provided output directory or default
  const directory = outputDir || CONFIG.outputDir;
  
  return { url, filename, outputDir: directory };
}

async function generateSocialImage(url, filename) {
  const fullUrl = CONFIG.baseUrl + url;
  const outputPath = path.join(CONFIG.outputDir, filename);
  
  console.log(`📸 Generating social image for ${url} -> ${filename}`);
  
  // Ensure output directory exists
  await fs.mkdir(CONFIG.outputDir, { recursive: true });
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
  });
  
  try {
    const page = await browser.newPage();
    
    // Set reasonable timeouts
    page.setDefaultNavigationTimeout(30000);
    page.setDefaultTimeout(30000);
    
    // Set viewport to social media dimensions
    await page.setViewport(CONFIG.dimensions);
    
    console.log(`Navigating to ${fullUrl}...`);
    
    // Use domcontentloaded instead of networkidle0 for reliability
    await page.goto(fullUrl, { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    
    console.log('Page loaded, waiting for content...');
    
    // Wait for the header to be present (ensures basic content is loaded)
    try {
      await page.waitForSelector('.site-header', { timeout: 5000 });
      console.log('Header found');
    } catch (e) {
      console.log('Header not found quickly, continuing anyway...');
    }
    
    // Give content time to render
    await page.waitForTimeout(CONFIG.waitTime);
    
    console.log('Applying styles for social sharing...');
    
    // Optimize for social sharing
    await page.addStyleTag({
      content: `
        /* Enhance elements for social sharing */
        .header-title { 
          font-size: clamp(3rem, 8vw, 5rem) !important; 
          margin-bottom: 2rem !important;
        }
        .nav-text { 
          font-size: 1.5rem !important; 
          font-weight: 500 !important;
        }
        .nav-list { 
          gap: 3rem !important; 
        }
        
        /* Hide elements that don't work well in screenshots */
        .site-footer { display: none !important; }
        
        /* Ensure background video area is visible */
        .background-reel { opacity: 1 !important; }
        .reel-overlay { opacity: 0.4 !important; }
        
        /* Films page optimizations */
        .films-grid { 
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)) !important;
        }
        .film-card {
          transform: scale(0.95) !important;
        }
        
        /* Art page optimizations */
        .art-grid {
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)) !important;
        }
        
        /* About page optimizations */
        .about-hero {
          max-width: 600px !important;
        }
        .hero-image {
          max-height: 400px !important;
        }
      `
    });
    
    console.log('Taking screenshot...');
    
    // Take screenshot
    await page.screenshot({
      path: outputPath,
      type: 'jpeg',
      quality: CONFIG.quality,
      fullPage: false,
      clip: {
        x: 0,
        y: 0,
        width: CONFIG.dimensions.width,
        height: CONFIG.dimensions.height
      }
    });
    
    console.log(`✅ Generated: ${outputPath}`);
    
  } catch (error) {
    console.error(`❌ Error generating ${filename}:`, error.message);
    
    // More detailed error info
    if (error.message.includes('Navigation timeout')) {
      console.error('💡 Try: Check if Hugo server is responding and video files are accessible');
    }
    
    throw error;
  } finally {
    await browser.close();
  }
}

// Main execution
async function main() {
  try {
    const { url, filename, outputDir } = parseArguments();
    await generateSocialImage(url, filename);
    console.log('🎉 Social image generated successfully!');
  } catch (error) {
    console.error('💥 Error during social image generation:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { generateSocialImage }; 
