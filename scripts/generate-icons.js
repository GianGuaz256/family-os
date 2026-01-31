const fs = require('fs').promises;
const path = require('path');

async function generateFavicons() {
  const srcLogo = path.join(__dirname, '../assets/logo.png'); // Put your logo here
  const destDir = path.join(__dirname, '../public');
  const iconsDir = path.join(destDir, 'icons');

  // Check if icons already exist (e.g., on deployment platforms)
  try {
    await fs.access(path.join(iconsDir, 'favicon-32x32.png'));
    await fs.access(path.join(destDir, 'manifest.json'));
    console.log('✅ Icons already exist, skipping generation');
    console.log('💡 To regenerate icons, delete the public/icons directory and run this script again');
    return;
  } catch {
    // Icons don't exist, proceed with generation
    console.log('🎨 Icons not found, will generate them...');
  }

  // Lazy-load favicons only when we actually need to generate icons
  let favicons;
  try {
    favicons = require('favicons').favicons;
  } catch (error) {
    console.error('❌ Cannot load favicons module:', error.message);
    console.error('💡 This is expected on deployment platforms like Vercel');
    console.error('💡 Make sure the public/icons directory is committed to git');
    process.exit(1);
  }

  // Configuration for Family OS
  const config = {
    path: '/icons/',
    appName: 'Family OS',
    appShortName: 'FamilyOS',
    appDescription: 'A collaborative family management PWA for organizing your family\'s daily life',
    developerName: 'Family OS Team',
    background: '#ffffff',
    theme_color: '#2563eb',
    appleStatusBarStyle: 'default',
    display: 'standalone',
    orientation: 'portrait-primary',
    scope: '/',
    start_url: '/',
    version: '1.0.0',
    logging: false,
    pixel_art: false,
    loadManifestWithCredentials: false,
    manifestMaskable: false,
    icons: {
      android: true,              // Android homescreen icon
      appleIcon: true,           // Apple touch icons  
      appleStartup: false,       // Apple startup images (large)
      favicons: true,            // Regular favicons
      windows: true,             // Windows 8 tile icons
      yandex: false              // Yandex browser icon
    }
  };

  try {
    console.log('🎨 Generating favicons...');
    
    // Check if source logo exists
    try {
      await fs.access(srcLogo);
    } catch {
      console.error(`❌ Source logo not found: ${srcLogo}`);
      console.log('💡 Please create a logo.png file in the assets/ directory');
      return;
    }

    // Generate favicons
    const response = await favicons(srcLogo, config);

    // Ensure directories exist
    await fs.mkdir(iconsDir, { recursive: true });

    // Write image files
    await Promise.all(
      response.images.map(async (image) => {
        const filepath = path.join(iconsDir, image.name);
        await fs.writeFile(filepath, image.contents);
        console.log(`✅ Generated ${image.name}`);
      })
    );

    // Write other files (manifest.json, browserconfig.xml, etc.)
    await Promise.all(
      response.files.map(async (file) => {
        const filepath = path.join(destDir, file.name);
        await fs.writeFile(filepath, file.contents);
        console.log(`✅ Generated ${file.name}`);
      })
    );

    // Copy webmanifest to manifest.json for Next.js compatibility
    const webmanifestPath = path.join(destDir, 'manifest.webmanifest');
    const manifestPath = path.join(destDir, 'manifest.json');
    
    try {
      const webmanifestContent = await fs.readFile(webmanifestPath);
      await fs.writeFile(manifestPath, webmanifestContent);
      console.log('✅ Generated manifest.json (Next.js compatible)');
    } catch (error) {
      console.warn('⚠️ Could not copy webmanifest to manifest.json:', error.message);
    }

    // Generate HTML markup file for reference
    const htmlMarkup = response.html.join('\n');
    await fs.writeFile(
      path.join(destDir, 'favicon-markup.html'), 
      `<!-- Add these lines to your <head> section -->\n${htmlMarkup}`
    );
    console.log('✅ Generated favicon-markup.html (copy contents to <head>)');

    console.log('\n🎉 All favicons generated successfully!');
    console.log(`📁 Files saved to: ${iconsDir}`);
    console.log('📋 Next steps:');
    console.log('  1. Copy the HTML markup from favicon-markup.html to your _document.tsx <head>');
    console.log('  2. Remove any old favicon references');
    console.log('  3. Test your favicons at: https://realfavicongenerator.net/favicon_checker');

  } catch (error) {
    console.error('❌ Error generating favicons:', error.message);
    // Check if icons exist from a previous build
    try {
      await fs.access(path.join(iconsDir, 'favicon-32x32.png'));
      await fs.access(path.join(destDir, 'manifest.json'));
      console.log('⚠️ Icon generation failed, but existing icons found - continuing build');
      return;
    } catch {
      console.error('💡 If you\'re deploying, make sure to commit the public/icons directory');
      console.error('💡 Locally, ensure sharp dependencies are installed: npm install --include=optional sharp');
      process.exit(1);
    }
  }
}

// Run if called directly
if (require.main === module) {
  generateFavicons();
}

module.exports = { generateFavicons }; 