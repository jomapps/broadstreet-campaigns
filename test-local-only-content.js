const axios = require('axios');

async function testLocalOnlyContent() {
  try {
    console.log('🧪 Testing Local-Only Page Content');
    console.log('');
    
    // Test the actual page HTML content
    const response = await axios.get('http://localhost:3005/local-only');
    
    console.log('✅ Page Response Status:', response.status);
    console.log('📄 Content Length:', response.data.length, 'characters');
    
    const html = response.data;
    
    // Check for key content indicators
    console.log('\n🔍 Content Analysis:');
    
    // Check for error messages
    if (html.includes('Error loading local entities')) {
      console.log('❌ Contains error message: "Error loading local entities"');
    } else {
      console.log('✅ No error messages found');
    }
    
    // Check for local-only content
    if (html.includes('Local Only')) {
      console.log('✅ Contains "Local Only" heading');
    } else {
      console.log('❌ Missing "Local Only" heading');
    }
    
    // Check for entity counts
    const entityCountMatches = html.match(/(\d+)\s+items?/g);
    if (entityCountMatches) {
      console.log('📊 Found entity counts:', entityCountMatches);
    } else {
      console.log('❌ No entity counts found');
    }
    
    // Check for campaign name
    if (html.includes('FB lottobay-Duo_300x250')) {
      console.log('✅ Contains campaign name: "FB lottobay-Duo_300x250"');
    } else {
      console.log('❌ Campaign name not found in HTML');
    }
    
    // Check for placement content
    if (html.includes('Local Placements')) {
      console.log('✅ Contains "Local Placements" section');
    } else {
      console.log('❌ No "Local Placements" section found');
    }
    
    // Check for placement count
    if (html.includes('462')) {
      console.log('✅ Contains placement count: 462');
    } else {
      console.log('❌ Placement count 462 not found');
    }
    
    // Check for empty state
    if (html.includes('No local entities found') || html.includes('0 items')) {
      console.log('❌ Page shows empty state');
    } else {
      console.log('✅ Page does not show empty state');
    }
    
    // Look for specific data attributes or IDs that might indicate content
    const dataMatches = html.match(/data-[^=]+="[^"]*"/g);
    if (dataMatches && dataMatches.length > 0) {
      console.log('📋 Found data attributes:', dataMatches.slice(0, 5)); // Show first 5
    }
    
    // Check for JavaScript errors in the HTML
    if (html.includes('error') || html.includes('Error')) {
      const errorMatches = html.match(/[Ee]rror[^<>]*[<>]/g);
      if (errorMatches) {
        console.log('⚠️  Potential errors found:', errorMatches.slice(0, 3));
      }
    }
    
    // Extract and show a sample of the body content (without full HTML)
    const bodyMatch = html.match(/<body[^>]*>(.*?)<\/body>/s);
    if (bodyMatch) {
      const bodyContent = bodyMatch[1];
      const textContent = bodyContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      console.log('\n📝 Body Text Content (first 500 chars):');
      console.log(textContent.substring(0, 500) + (textContent.length > 500 ? '...' : ''));
    }
    
  } catch (error) {
    console.error('❌ Error testing page content:', error.message);
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Headers:', error.response.headers);
    }
  }
}

testLocalOnlyContent();
