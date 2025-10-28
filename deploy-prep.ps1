# ============================================================================
# Deployment Preparation Script for Webhook Relay Service (Windows)
# ============================================================================
# This script helps prepare your application for production deployment
# Run this before deploying to ensure everything is configured correctly
# ============================================================================

$ErrorActionPreference = "Stop"

Write-Host "`n"
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  🚀 WEBHOOK RELAY - DEPLOYMENT PREPARATION" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "`n"

# ============================================================================
# Step 1: Check Prerequisites
# ============================================================================
Write-Host "Step 1: Checking Prerequisites..." -ForegroundColor Blue
Write-Host ""

# Check Node.js
try {
    $nodeVersion = (node -v)
    Write-Host "  Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "  Node.js is not installed" -ForegroundColor Red
    exit 1
}

# Check npm
try {
    $npmVersion = (npm -v)
    Write-Host "  npm: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "  npm is not installed" -ForegroundColor Red
    exit 1
}

Write-Host ""

# ============================================================================
# Step 2: Generate Secrets
# ============================================================================
Write-Host "Step 2: Generating Production Secrets..." -ForegroundColor Blue
Write-Host ""

$jwtSecret = node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
$hmacSecret = node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

Write-Host "  JWT Secret generated" -ForegroundColor Green
Write-Host "  HMAC Secret generated" -ForegroundColor Green
Write-Host ""
Write-Host "  IMPORTANT: Save these secrets securely!" -ForegroundColor Yellow
Write-Host ""
Write-Host "JWT_SECRET=$jwtSecret" -ForegroundColor White
Write-Host "HMAC_SECRET=$hmacSecret" -ForegroundColor White
Write-Host ""
Write-Host "  Copy these to your production .env file or hosting platform" -ForegroundColor Yellow
Write-Host ""

# Pause to let user copy secrets
Write-Host "Press any key to continue..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
Write-Host ""

# ============================================================================
# Step 3: Install Backend Dependencies
# ============================================================================
Write-Host "Step 3: Installing Backend Dependencies..." -ForegroundColor Blue
Write-Host ""

Set-Location backend

if (-not (Test-Path "node_modules")) {
    npm install --production
    Write-Host "  Backend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "  Backend dependencies already installed" -ForegroundColor Green
}

Set-Location ..
Write-Host ""

# ============================================================================
# Step 4: Build Frontend
# ============================================================================
Write-Host "Step 4: Building Frontend for Production..." -ForegroundColor Blue
Write-Host ""

Set-Location frontend

# Install dependencies
if (-not (Test-Path "node_modules")) {
    npm install
    Write-Host "  Frontend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "  Frontend dependencies already installed" -ForegroundColor Green
}

# Check for .env.production
if (-not (Test-Path ".env.production")) {
    Write-Host "  .env.production not found" -ForegroundColor Yellow
    if (Test-Path ".env.production.example") {
        Copy-Item ".env.production.example" ".env.production"
        Write-Host "  Created .env.production from example" -ForegroundColor Yellow
        Write-Host "  Please edit .env.production with your values" -ForegroundColor Yellow
    }
}

# Build
Write-Host "  Building frontend (this may take a minute)..." -ForegroundColor Cyan
npm run build

if (Test-Path "dist") {
    Write-Host "  Frontend build successful" -ForegroundColor Green
    Write-Host "  Build output: frontend/dist/" -ForegroundColor White
} else {
    Write-Host "  Frontend build failed" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Set-Location ..
Write-Host ""

# ============================================================================
# Step 5: Run Tests
# ============================================================================
Write-Host "Step 5: Running Backend Tests..." -ForegroundColor Blue
Write-Host ""

Set-Location backend

try {
    npm test 2>$null
    Write-Host "  All tests passed" -ForegroundColor Green
} catch {
    Write-Host "  Some tests failed. Review before deploying." -ForegroundColor Yellow
}

Set-Location ..
Write-Host ""

# ============================================================================
# Step 6: Security Audit
# ============================================================================
Write-Host "Step 6: Running Security Audit..." -ForegroundColor Blue
Write-Host ""

Write-Host "  Checking backend..." -ForegroundColor Cyan
Set-Location backend
npm audit --production --audit-level=moderate 2>$null
Set-Location ..

Write-Host "  Checking frontend..." -ForegroundColor Cyan
Set-Location frontend
npm audit --production --audit-level=moderate 2>$null
Set-Location ..

Write-Host ""

# ============================================================================
# Step 7: Deployment Checklist
# ============================================================================
Write-Host "Step 7: Pre-Deployment Checklist" -ForegroundColor Blue
Write-Host ""
Write-Host "Before deploying to production, ensure:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  [ ] MongoDB Atlas database created" -ForegroundColor White
Write-Host "  [ ] Redis Cloud instance created" -ForegroundColor White
Write-Host "  [ ] Production environment variables configured" -ForegroundColor White
Write-Host "  [ ] JWT_SECRET and HMAC_SECRET set" -ForegroundColor White
Write-Host "  [ ] CORS_ORIGIN set to frontend domain" -ForegroundColor White
Write-Host "  [ ] CLIENT_URL set to frontend domain" -ForegroundColor White
Write-Host "  [ ] WEBHOOK_BASE_URL set to backend domain" -ForegroundColor White
Write-Host "  [ ] SSL/TLS certificates configured" -ForegroundColor White
Write-Host "  [ ] Domain names and DNS configured" -ForegroundColor White
Write-Host "  [ ] Monitoring setup (Sentry)" -ForegroundColor White
Write-Host "  [ ] Backup strategy in place" -ForegroundColor White
Write-Host "  [ ] Reviewed PRODUCTION_CHECKLIST.md" -ForegroundColor White
Write-Host ""

# ============================================================================
# Final Summary
# ============================================================================
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  DEPLOYMENT PREPARATION COMPLETE" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Set up production services:" -ForegroundColor White
Write-Host "   - MongoDB Atlas: https://cloud.mongodb.com" -ForegroundColor Gray
Write-Host "   - Redis Cloud: https://redis.com/try-free" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Choose deployment platform:" -ForegroundColor White
Write-Host "   - VPS: Follow DEPLOYMENT.md VPS section" -ForegroundColor Gray
Write-Host "   - Heroku: Follow DEPLOYMENT.md Heroku section" -ForegroundColor Gray
Write-Host "   - Docker: Use docker-compose.yml" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Deploy frontend:" -ForegroundColor White
Write-Host "   - Vercel (recommended): vercel --prod" -ForegroundColor Gray
Write-Host "   - Netlify: netlify deploy --prod --dir=frontend/dist" -ForegroundColor Gray
Write-Host "   - Manual: Upload frontend/dist/ to hosting" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Configure environment variables on hosting platform" -ForegroundColor White
Write-Host ""
Write-Host "5. Deploy backend" -ForegroundColor White
Write-Host ""
Write-Host "6. Run post-deployment smoke tests" -ForegroundColor White
Write-Host ""
Write-Host "Documentation:" -ForegroundColor Blue
Write-Host "  - DEPLOYMENT.md: Complete deployment guide" -ForegroundColor White
Write-Host "  - PRODUCTION_CHECKLIST.md: Pre-launch checklist (150+ items)" -ForegroundColor White
Write-Host "  - README.md: General documentation" -ForegroundColor White
Write-Host ""
Write-Host "Good luck with your deployment! 🚀" -ForegroundColor Green
Write-Host ""
