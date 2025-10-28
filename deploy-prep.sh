#!/bin/bash

# ============================================================================
# Deployment Preparation Script for Webhook Relay Service
# ============================================================================
# This script helps prepare your application for production deployment
# Run this before deploying to ensure everything is configured correctly
# ============================================================================

set -e  # Exit on any error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  🚀 WEBHOOK RELAY - DEPLOYMENT PREPARATION"
echo "═══════════════════════════════════════════════════════════"
echo ""

# ============================================================================
# Step 1: Check Prerequisites
# ============================================================================
echo -e "${BLUE}Step 1: Checking Prerequisites...${NC}"

# Check Node.js version
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js is not installed${NC}"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}✗ Node.js version 18+ required (current: $(node -v))${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js $(node -v)${NC}"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ npm is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm $(npm -v)${NC}"

echo ""

# ============================================================================
# Step 2: Generate Secrets
# ============================================================================
echo -e "${BLUE}Step 2: Generating Production Secrets...${NC}"

JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
HMAC_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")

echo -e "${GREEN}✓ JWT Secret generated${NC}"
echo -e "${GREEN}✓ HMAC Secret generated${NC}"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: Save these secrets securely!${NC}"
echo ""
echo "JWT_SECRET=$JWT_SECRET"
echo "HMAC_SECRET=$HMAC_SECRET"
echo ""
echo -e "${YELLOW}Copy these to your production .env file or hosting platform environment variables${NC}"
echo ""

# ============================================================================
# Step 3: Check Backend Dependencies
# ============================================================================
echo -e "${BLUE}Step 3: Installing Backend Dependencies...${NC}"

cd backend
if [ ! -d "node_modules" ]; then
    npm install --production
    echo -e "${GREEN}✓ Backend dependencies installed${NC}"
else
    echo -e "${GREEN}✓ Backend dependencies already installed${NC}"
fi
cd ..
echo ""

# ============================================================================
# Step 4: Check Frontend Dependencies & Build
# ============================================================================
echo -e "${BLUE}Step 4: Building Frontend for Production...${NC}"

cd frontend

# Install dependencies
if [ ! -d "node_modules" ]; then
    npm install
    echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
else
    echo -e "${GREEN}✓ Frontend dependencies already installed${NC}"
fi

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo -e "${YELLOW}⚠️  .env.production not found. Creating from example...${NC}"
    if [ -f ".env.production.example" ]; then
        cp .env.production.example .env.production
        echo -e "${YELLOW}⚠️  Please edit .env.production with your production values${NC}"
    fi
fi

# Build frontend
echo "Building frontend (this may take a minute)..."
npm run build

if [ -d "dist" ]; then
    echo -e "${GREEN}✓ Frontend build successful${NC}"
    echo "  Build output: frontend/dist/"
else
    echo -e "${RED}✗ Frontend build failed${NC}"
    exit 1
fi

cd ..
echo ""

# ============================================================================
# Step 5: Run Tests
# ============================================================================
echo -e "${BLUE}Step 5: Running Tests...${NC}"

cd backend
if npm test &> /dev/null; then
    echo -e "${GREEN}✓ All tests passed${NC}"
else
    echo -e "${YELLOW}⚠️  Some tests failed. Review before deploying.${NC}"
fi
cd ..
echo ""

# ============================================================================
# Step 6: Security Check
# ============================================================================
echo -e "${BLUE}Step 6: Running Security Audit...${NC}"

cd backend
npm audit --production --audit-level=moderate || echo -e "${YELLOW}⚠️  Some vulnerabilities found. Review npm audit output.${NC}"
cd ..

cd frontend
npm audit --production --audit-level=moderate || echo -e "${YELLOW}⚠️  Some vulnerabilities found. Review npm audit output.${NC}"
cd ..
echo ""

# ============================================================================
# Step 7: Create Deployment Checklist
# ============================================================================
echo -e "${BLUE}Step 7: Deployment Checklist${NC}"
echo ""
echo "Before deploying to production, ensure:"
echo ""
echo "  [ ] MongoDB Atlas database created and connection string ready"
echo "  [ ] Redis Cloud instance created and connection URL ready"
echo "  [ ] Production environment variables configured"
echo "  [ ] JWT_SECRET and HMAC_SECRET set (generated above)"
echo "  [ ] CORS_ORIGIN set to your frontend domain"
echo "  [ ] CLIENT_URL set to your frontend domain"
echo "  [ ] WEBHOOK_BASE_URL set to your backend domain"
echo "  [ ] SSL/TLS certificates configured"
echo "  [ ] Domain names configured and DNS updated"
echo "  [ ] Firewall rules configured (if using VPS)"
echo "  [ ] Monitoring setup (Sentry recommended)"
echo "  [ ] Backup strategy in place"
echo "  [ ] Review PRODUCTION_CHECKLIST.md"
echo ""

# ============================================================================
# Step 8: Next Steps
# ============================================================================
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✓ DEPLOYMENT PREPARATION COMPLETE${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo ""
echo "1. Set up production services:"
echo "   - MongoDB Atlas: https://cloud.mongodb.com"
echo "   - Redis Cloud: https://redis.com/try-free"
echo ""
echo "2. Choose deployment platform:"
echo "   - VPS (DigitalOcean, AWS EC2): Follow DEPLOYMENT.md VPS section"
echo "   - Heroku: Follow DEPLOYMENT.md Heroku section"
echo "   - Docker: Use docker-compose.yml and follow Docker section"
echo ""
echo "3. Deploy frontend:"
echo "   - Vercel (recommended): vercel --prod"
echo "   - Netlify: netlify deploy --prod --dir=frontend/dist"
echo "   - Manual: Upload frontend/dist/ to hosting"
echo ""
echo "4. Configure environment variables on your hosting platform"
echo ""
echo "5. Deploy backend to your chosen platform"
echo ""
echo "6. Run post-deployment smoke tests"
echo ""
echo "7. Monitor logs and errors"
echo ""
echo -e "${BLUE}📚 Documentation:${NC}"
echo "   - DEPLOYMENT.md: Complete deployment guide"
echo "   - PRODUCTION_CHECKLIST.md: Pre-launch checklist"
echo "   - README.md: General documentation"
echo ""
echo -e "${GREEN}Good luck with your deployment! 🚀${NC}"
echo ""
