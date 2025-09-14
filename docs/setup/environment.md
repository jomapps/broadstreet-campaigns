# Environment Setup

**Application**: Broadstreet Campaigns  
**Environment**: Node.js with Next.js 15.5.2  

## 🔧 Prerequisites

- **Node.js**: Version 18.x or higher
- **MongoDB**: Local instance or MongoDB Atlas
- **Broadstreet API Access**: Valid API token required

## 📝 Environment Variables

Create a `.env.local` file in the project root:

```bash
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/broadstreet-campaigns

# Broadstreet API Configuration  
BROADSTREET_API_BASE_URL=https://api.broadstreetads.com/api/1
BROADSTREET_API_TOKEN=your_broadstreet_api_token_here

# Next.js Configuration
NEXT_PUBLIC_APP_NAME=Broadstreet Campaigns
```

## 🔑 Configuration Details

### **MongoDB URI**
- **Required**: Yes
- **Format**: `mongodb://[username:password@]host[:port]/database`
- **Local**: `mongodb://localhost:27017/broadstreet-campaigns`
- **Atlas**: `mongodb+srv://username:password@cluster.mongodb.net/database`

### **Broadstreet API Configuration**
- **BROADSTREET_API_BASE_URL**: API base URL (default: https://api.broadstreetads.com/api/1)
- **BROADSTREET_API_TOKEN**: Your API access token from Broadstreet
- **Required**: Both are required for all operations
- **Security**: Never commit API tokens to version control

### **Next.js Configuration**
- **NEXT_PUBLIC_APP_NAME**: Application name displayed in header
- **Optional**: Defaults to "Dashboard" if not set

## 🚀 Installation

```bash
# Clone repository
git clone <repository-url>
cd broadstreet-campaigns

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Start development server
npm run dev
```

## ✅ Verification

### **Environment Validation**
The application validates environment variables on startup:

```bash
# Check for missing variables
npm run dev

# Look for warnings in console:
# ⚠️  Missing Broadstreet API configuration
# ⚠️  MongoDB connection failed
```

### **MongoDB Connection**
```bash
# Test MongoDB connection
mongosh "mongodb://localhost:27017/broadstreet-campaigns"

# Or check application logs
tail -f logs/app.log | grep MongoDB
```

### **Broadstreet API Access**
```bash
# Test API connection (if available)
curl "https://api.broadstreetads.com/api/1/networks?access_token=your_token"
```

## 🛠️ Development Scripts

```bash
# Development server (port 3005)
npm run dev

# Production build
npm run build

# Production server
npm run start

# Testing
npm run test
npm run test:ui
npm run test:headed

# Utilities
npm run delete:zone-by-name
```

## 🔒 Security Considerations

### **Environment File Security**
```bash
# ✅ CORRECT: Local environment file
.env.local

# ❌ FORBIDDEN: Committed environment files  
.env
.env.production
```

### **API Token Security**
- Never commit API tokens to version control
- Use different tokens for different environments
- Rotate tokens regularly
- Limit token permissions when possible

### **MongoDB Security**
- Use strong passwords for MongoDB Atlas
- Enable IP whitelisting when possible
- Use connection string encryption
- Regular backup and monitoring

## 🌍 Environment-Specific Configuration

### **Development Environment**
```bash
# .env.local
MONGODB_URI=mongodb://localhost:27017/broadstreet-campaigns-dev
BROADSTREET_API_BASE_URL=https://api.broadstreetads.com/api/1
BROADSTREET_API_TOKEN=dev_token_here
NEXT_PUBLIC_APP_NAME=Broadstreet Campaigns (Dev)
```

### **Production Environment**
```bash
# .env.production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/broadstreet-campaigns
BROADSTREET_API_BASE_URL=https://api.broadstreetads.com/api/1
BROADSTREET_API_TOKEN=prod_token_here
NEXT_PUBLIC_APP_NAME=Broadstreet Campaigns
```

### **Testing Environment**
```bash
# .env.test
MONGODB_URI=mongodb://localhost:27017/broadstreet-campaigns-test
BROADSTREET_API_BASE_URL=https://api.broadstreetads.com/api/1
BROADSTREET_API_TOKEN=test_token_here
NEXT_PUBLIC_APP_NAME=Broadstreet Campaigns (Test)
```

## 🔧 Troubleshooting

### **Common Issues**

**MongoDB Connection Failed**
```bash
# Check MongoDB service
brew services start mongodb-community  # macOS
sudo systemctl start mongod           # Linux
net start MongoDB                     # Windows

# Test connection
mongosh mongodb://localhost:27017
```

**Broadstreet API Authentication Failed**
```bash
# Verify token format
echo $BROADSTREET_API_TOKEN

# Test with curl
curl "https://api.broadstreetads.com/api/1/networks?access_token=$BROADSTREET_API_TOKEN"
```

**Port Already in Use**
```bash
# Find process using port 3005
lsof -i :3005          # macOS/Linux
netstat -ano | find "3005"  # Windows

# Kill process or use different port
npm run dev -- -p 3006
```

### **Environment Validation Script**

```javascript
// scripts/validate-env.js
const requiredVars = [
  'MONGODB_URI',
  'BROADSTREET_API_BASE_URL',
  'BROADSTREET_API_TOKEN'
];

const missing = requiredVars.filter(varName => !process.env[varName]);

if (missing.length > 0) {
  console.error('❌ Missing required environment variables:');
  missing.forEach(varName => console.error(`   - ${varName}`));
  process.exit(1);
} else {
  console.log('✅ All required environment variables are set');
}
```

## 📊 Environment Status Check

```bash
# Quick environment check
node -e "
console.log('MongoDB URI:', process.env.MONGODB_URI ? '✅ Set' : '❌ Missing');
console.log('API Base URL:', process.env.BROADSTREET_API_BASE_URL ? '✅ Set' : '❌ Missing');
console.log('API Token:', process.env.BROADSTREET_API_TOKEN ? '✅ Set' : '❌ Missing');
"
```

---

**Next Steps**: After environment setup, continue with [Development Setup](./development.md) for local development configuration.
