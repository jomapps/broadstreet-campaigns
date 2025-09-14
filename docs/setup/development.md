# Development Setup

**Application**: Broadstreet Campaigns  
**Target**: Local development environment  
**Prerequisites**: Environment setup completed  

## 🛠️ Development Environment

### **Prerequisites Checklist**
- [ ] Node.js 18.x or higher installed
- [ ] MongoDB running locally or Atlas connection
- [ ] Git repository cloned
- [ ] Environment variables configured ([Environment Setup](./environment.md))
- [ ] Broadstreet API access token obtained

### **Installation Steps**

```bash
# 1. Clone the repository
git clone <repository-url>
cd broadstreet-campaigns

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# 4. Start development server
npm run dev
```

### **Verification**
```bash
# Check application startup
npm run dev

# Expected output:
# ▲ Next.js 15.5.2
# - Local:        http://localhost:3005
# - Network:      http://0.0.0.0:3005

# Open browser and verify:
# - Application loads without errors
# - Database connection successful
# - API connectivity working
```

## 🏗️ Development Workflow

### **Code Structure**
```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout with providers
│   ├── page.tsx           # Homepage (redirects to dashboard)
│   ├── dashboard/         # Dashboard page
│   ├── networks/          # Networks management
│   ├── zones/             # Zones management
│   ├── advertisers/       # Advertisers management
│   ├── advertisements/    # Advertisements management
│   ├── campaigns/         # Campaigns management
│   ├── placements/        # Placements management
│   ├── local-only/        # Local entities management
│   └── api/               # API routes
├── components/            # React components
│   ├── layout/           # Layout components
│   ├── ui/               # Reusable UI components
│   ├── advertisements/   # Advertisement-specific components
│   ├── advertisers/      # Advertiser-specific components
│   ├── campaigns/        # Campaign-specific components
│   ├── creation/         # Entity creation components
│   ├── dashboard/        # Dashboard components
│   ├── networks/         # Network components
│   ├── placements/       # Placement components
│   └── zones/            # Zone components
├── contexts/             # React contexts
├── hooks/                # Custom React hooks
└── lib/                  # Utility libraries
    ├── models/           # MongoDB models
    ├── types/            # TypeScript type definitions
    ├── utils/            # Helper utilities
    ├── broadstreet-api.ts # External API client
    ├── mongodb.ts        # Database connection
    └── utils.ts          # General utilities
```

### **Development Commands**

```bash
# Development server (port 3005)
npm run dev

# Production build
npm run build

# Production server
npm run start

# Linting
npm run lint

# Testing
npm run test              # All tests
npm run test:ui          # Tests with UI
npm run test:headed      # Tests in headed mode
npm run test:local-page  # Specific test suite

# Utilities
npm run delete:zone-by-name  # Delete zone by name for testing
```

## 🧪 Testing Setup

### **Playwright Configuration**
Tests are configured in `playwright.config.ts`:

```typescript
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3005',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3005',
    reuseExistingServer: !process.env.CI,
  },
});
```

### **Writing Tests**
```typescript
// tests/example.spec.ts
import { test, expect } from '@playwright/test';

test('entity creation flow', async ({ page }) => {
  // Navigate to page
  await page.goto('/advertisers');
  
  // Create entity
  await page.click('[data-testid="create-button"]');
  await page.fill('[data-testid="name-input"]', 'Test Advertiser');
  await page.click('[data-testid="submit-button"]');
  
  // Verify creation
  await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  await expect(page.locator('[data-testid="local-entity"]')).toContainText('Test Advertiser');
});
```

### **Running Tests**
```bash
# Install browsers (first time)
npx playwright install

# Run all tests
npm run test

# Run tests with UI for debugging
npm run test:ui

# Run specific test file
npx playwright test tests/advertiser-creation.spec.ts

# Run tests in headed mode (visible browser)
npm run test:headed
```

## 🔧 Development Tools

### **Database Tools**
```bash
# MongoDB shell
mongosh "mongodb://localhost:27017/broadstreet-campaigns"

# Common queries
db.advertisers.find()
db.local_advertisers.find()
db.campaigns.countDocuments()

# Clear test data
db.local_advertisers.deleteMany({name: /Test/})
```

### **API Testing**
```bash
# Test internal API endpoints
curl http://localhost:3005/api/networks
curl http://localhost:3005/api/advertisers?network_id=1
curl -X POST http://localhost:3005/api/create/advertiser \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Advertiser","network_id":"507f1f77bcf86cd799439011"}'

# Test external Broadstreet API
curl "https://api.broadstreetads.com/api/1/networks?access_token=$BROADSTREET_API_TOKEN"
```

### **Development Utilities**
```javascript
// Delete zone by name (for testing)
node delete-zone-by-name.js "Test Zone Name"

// Or use npm script
npm run delete:zone-by-name "Test Zone Name"
```

## 🎨 UI Development

### **Component Development**
```typescript
// Follow established patterns
const EntityCard = ({ entity, isLocal }) => {
  return (
    <div className={cn(
      "rounded-lg border shadow-sm p-4",
      isLocal 
        ? "bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-400"
        : "bg-white border-gray-200"
    )}>
      {isLocal && (
        <Badge className="bg-orange-500 text-white mb-2">
          🏠 Local
        </Badge>
      )}
      {/* Component content */}
    </div>
  );
};
```

### **Styling Guidelines**
- **Use Tailwind CSS 4** utility classes
- **Follow responsive design** patterns
- **Implement visual distinction** for local vs synced entities
- **Use consistent spacing** (4-unit grid)
- **Apply hover effects** for interactive elements

### **Form Development**
```typescript
// Follow minimal required fields pattern
const CreateEntityForm = () => {
  return (
    <form>
      {/* Required fields first - always visible */}
      <div className="mb-6">
        <Label htmlFor="name">Name *</Label>
        <Input id="name" required />
      </div>

      {/* Optional fields in collapsible sections */}
      <CollapsibleSection title="Basic Settings">
        {/* Optional fields */}
      </CollapsibleSection>

      {/* Dual submit buttons */}
      <div className="flex justify-end space-x-3">
        <Button type="submit">Create Entity</Button>
      </div>
    </form>
  );
};
```

## 🔄 API Development

### **Creating API Endpoints**
```typescript
// app/api/example/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { EntityModel } from '@/lib/models/entity';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const entities = await EntityModel.find();
    
    return NextResponse.json({
      success: true,
      data: entities
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const data = await request.json();
    const entity = await EntityModel.create(data);
    
    return NextResponse.json({
      success: true,
      data: entity
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 400 });
  }
}
```

### **Error Handling Patterns**
```typescript
// Consistent error response format
const handleError = (error: any, context: string) => {
  console.error(`[${context}] Error:`, error);
  
  if (error.name === 'ValidationError') {
    return NextResponse.json({
      success: false,
      error: 'Validation failed',
      details: error.errors
    }, { status: 400 });
  }
  
  return NextResponse.json({
    success: false,
    error: 'Internal server error'
  }, { status: 500 });
};
```

## 📊 Database Development

### **Model Creation**
```typescript
// lib/models/example.ts
import mongoose from 'mongoose';

const ExampleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  network_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Network' },
  created_locally: { type: Boolean, default: false },
  synced_with_api: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
  synced_at: { type: Date }
});

export const Example = mongoose.models.Example || mongoose.model('Example', ExampleSchema);
export const LocalExample = mongoose.models.LocalExample || mongoose.model('LocalExample', ExampleSchema, 'local_examples');
```

### **Database Operations**
```typescript
// Create with proper error handling
const createEntity = async (data) => {
  try {
    const entity = await LocalEntityModel.create({
      ...data,
      created_locally: true,
      synced_with_api: false
    });
    
    return { success: true, data: entity };
  } catch (error) {
    if (error.code === 11000) {
      return { success: false, error: 'Duplicate name' };
    }
    throw error;
  }
};
```

## 🚨 Development Best Practices

### **Code Quality**
- **Follow TypeScript** strict mode
- **Use ESLint** for code consistency
- **Write meaningful** commit messages
- **Test critical paths** with Playwright
- **Document complex** logic and decisions

### **Performance**
- **Use server components** when possible
- **Implement proper** loading states
- **Optimize database** queries
- **Cache API responses** when appropriate
- **Monitor bundle** size

### **Security**
- **Never commit** sensitive data
- **Validate all inputs** on server side
- **Use environment variables** for configuration
- **Sanitize user inputs** before database operations
- **Implement proper** error handling without information leakage

## 🔧 Debugging

### **Common Debug Scenarios**
```javascript
// Database connection issues
console.log('MongoDB connection state:', mongoose.connection.readyState);

// API request debugging
console.log('[API] Request:', { method, endpoint, body });

// Component state debugging
console.log('Component state:', { filters, entities, loading });

// Sync operation debugging
console.log('[Sync] Operation:', { type, status, errors });
```

### **Browser DevTools**
- **Console tab**: JavaScript errors and logs
- **Network tab**: API request/response inspection
- **Application tab**: Local storage and cookies
- **React DevTools**: Component state inspection

### **Server Logs**
```bash
# Next.js logs
tail -f .next/trace

# MongoDB logs (if running locally)
tail -f /var/log/mongodb/mongod.log

# Custom application logs
console.log('[DEBUG]', { context, data });
```

---

**Next Steps**: After development setup, review [Best Practices](../guides/best-practices.md) for coding standards and [API Reference](../technical/api-reference.md) for endpoint documentation.
