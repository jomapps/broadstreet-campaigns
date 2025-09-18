const http = require('http');

console.log('Testing streaming sync endpoint...');

// Simple HTTP request to test the streaming endpoint
const options = {
  hostname: 'localhost',
  port: 3005,
  path: '/api/sync/stream',
  method: 'POST',
  headers: {
    'Accept': 'text/event-stream',
    'Cache-Control': 'no-cache'
  }
};

const req = http.request(options, (res) => {
  console.log(`✅ Connection opened - Status: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);

  let buffer = '';

  res.on('data', (chunk) => {
    buffer += chunk.toString();

    // Process complete events
    const events = buffer.split('\n\n');
    buffer = events.pop() || ''; // Keep incomplete event in buffer

    events.forEach(eventData => {
      if (eventData.trim()) {
        const lines = eventData.split('\n');
        let eventType = 'message';
        let data = '';

        lines.forEach(line => {
          if (line.startsWith('event: ')) {
            eventType = line.substring(7);
          } else if (line.startsWith('data: ')) {
            data = line.substring(6);
          }
        });

        if (data) {
          try {
            const parsedData = JSON.parse(data);
            handleEvent(eventType, parsedData);
          } catch (e) {
            console.log(`Raw event: ${eventType} - ${data}`);
          }
        }
      }
    });
  });

  res.on('end', () => {
    console.log('🏁 Stream ended');
    process.exit(0);
  });

  res.on('error', (error) => {
    console.error('💥 Response error:', error);
    process.exit(1);
  });
});

req.on('error', (error) => {
  console.error('💥 Request error:', error);
  process.exit(1);
});

req.end();

function handleEvent(eventType, data) {
  switch (eventType) {
    case 'status':
      console.log(`📊 Status: ${data.phase} - ${data.message} (${data.progress}%)`);
      break;
    case 'step-start':
      console.log(`🚀 Step Start: ${data.phase} - ${data.message} (${data.progress}%)`);
      console.log(`   Step ${data.currentStep}/${data.totalSteps}`);
      break;
    case 'step-complete':
      console.log(`✅ Step Complete: ${data.phase} - ${data.message} (${data.progress}%)`);
      if (data.stepResult?.count) {
        console.log(`   Records: ${data.stepResult.count}`);
      }
      break;
    case 'step-error':
      console.log(`❌ Step Error: ${data.phase} - ${data.message} (${data.progress}%)`);
      if (data.stepResult?.error) {
        console.log(`   Error: ${data.stepResult.error}`);
      }
      break;
    case 'complete':
      console.log(`🎉 Sync Complete: ${data.message} (${data.progress}%)`);
      console.log(`   Overall Success: ${data.overallSuccess}`);
      console.log(`   Theme Validation Started: ${data.themeValidationStarted}`);
      break;
    case 'error':
      console.log(`💥 Sync Error: ${data.message} (${data.progress}%)`);
      console.log(`   Error: ${data.error}`);
      break;
    default:
      console.log(`📨 Event: ${eventType} -`, data);
  }
}

// Timeout after 10 minutes
setTimeout(() => {
  console.log('⏰ Test timeout after 10 minutes');
  process.exit(1);
}, 10 * 60 * 1000);

console.log('🔄 Listening for streaming sync events...');
