# 🚀 Deployment Guide

Complete guide for deploying the Webhook Relay Service to production.

## 📋 Pre-Deployment Checklist

### Backend
- [ ] All tests passing (21/21)
- [ ] Environment variables configured
- [ ] MongoDB Atlas cluster created
- [ ] Redis Cloud instance provisioned
- [ ] SSL certificates obtained
- [ ] Domain configured
- [ ] Rate limiting tested
- [ ] Error tracking setup (e.g., Sentry)

### Frontend
- [ ] Production build tested
- [ ] API URLs configured
- [ ] Assets optimized
- [ ] PWA configured (optional)
- [ ] Analytics setup (optional)

## 🔧 Backend Deployment

### Option 1: VPS (DigitalOcean, AWS EC2, etc.)

#### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install nginx
sudo apt install nginx -y
```

#### 2. Clone and Setup

```bash
# Clone repository
git clone https://github.com/yourusername/webhook-relay.git
cd webhook-relay/backend

# Install dependencies
npm ci --production

# Create production .env
nano .env
```

#### 3. Production .env Configuration

```env
NODE_ENV=production
PORT=5000

# Database
MONGODB_URI=mongodb+srv://prod_user:secure_pass@cluster.mongodb.net/webhookrelay_prod?retryWrites=true&w=majority

# Redis
REDIS_URL=rediss://default:password@redis-xxxxx.cloud.redislabs.com:12345

# JWT - GENERATE NEW SECRET!
JWT_SECRET=CHANGE-THIS-TO-SUPER-LONG-RANDOM-STRING-IN-PRODUCTION
JWT_EXPIRE=7d

# Webhook
WEBHOOK_TIMEOUT=30000
MAX_RETRIES=3
RETRY_INTERVALS=60000,300000,900000

# Security
ALLOWED_ORIGINS=https://yourdomain.com
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100

# Monitoring (Optional)
SENTRY_DSN=your-sentry-dsn-here
```

#### 4. Start with PM2

```bash
# Start application
pm2 start src/server.js --name webhook-relay-api -i max

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup
# Follow the instructions from the output

# Monitor
pm2 monit
```

#### 5. Configure Nginx

```nginx
# /etc/nginx/sites-available/webhook-relay

server {
    listen 80;
    server_name api.yourdomain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Proxy to Node.js
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss;
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/webhook-relay /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
```

#### 6. SSL with Let's Encrypt

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain certificate
sudo certbot --nginx -d api.yourdomain.com

# Auto-renewal (already setup by certbot)
sudo certbot renew --dry-run
```

### Option 2: Heroku

```bash
# Login to Heroku
heroku login

# Create app
heroku create webhook-relay-api

# Add MongoDB addon (or use Atlas)
heroku addons:create mongolab:sandbox

# Add Redis addon
heroku addons:create heroku-redis:hobby-dev

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=$(openssl rand -base64 32)

# Deploy
git push heroku main

# Scale
heroku ps:scale web=1 worker=1

# View logs
heroku logs --tail
```

### Option 3: Docker

```dockerfile
# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY . .

EXPOSE 5000

CMD ["node", "src/server.js"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=${MONGODB_URI}
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - redis
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    restart: unless-stopped

volumes:
  redis-data:
```

```bash
# Deploy with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Scale workers
docker-compose up -d --scale backend=3
```

## 🎨 Frontend Deployment

### Option 1: Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
cd frontend
vercel

# Production deployment
vercel --prod
```

**vercel.json**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

### Option 2: Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Login
netlify login

# Deploy
cd frontend
netlify deploy

# Production
netlify deploy --prod
```

**netlify.toml**
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Option 3: Nginx (Static Files)

```bash
# Build frontend
cd frontend
npm run build

# Copy to server
scp -r dist/* user@server:/var/www/webhook-relay

# Nginx configuration
# /etc/nginx/sites-available/webhook-relay-frontend

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    root /var/www/webhook-relay;
    index index.html;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Gzip
    gzip on;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript;
}
```

## 🔒 Security Hardening

### Backend

```bash
# Firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Fail2ban
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### Environment Variables

```bash
# Generate secure JWT secret
openssl rand -base64 64

# Never commit .env files
echo ".env" >> .gitignore
```

### Database

- Enable MongoDB authentication
- Use strong passwords
- Enable SSL/TLS connections
- Whitelist IP addresses only
- Regular backups

### Redis

- Enable password authentication
- Use SSL/TLS connections
- Restrict network access

## 📊 Monitoring

### PM2 Monitoring

```bash
# Install PM2 monitoring
pm2 install pm2-logrotate

# Configure log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7

# View metrics
pm2 monit
```

### Application Monitoring (Sentry)

```javascript
// backend/src/config/sentry.js
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});

module.exports = Sentry;
```

### Health Check Endpoint

```javascript
// Already implemented at /health
GET http://api.yourdomain.com/health

Response:
{
  "status": "healthy",
  "timestamp": "2025-10-26T...",
  "uptime": 123456,
  "database": "connected",
  "redis": "connected"
}
```

## 🔄 CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - name: Install dependencies
        run: |
          cd backend
          npm ci
      - name: Run tests
        run: |
          cd backend
          npm test

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd ~/webhook-relay/backend
            git pull origin main
            npm ci --production
            pm2 restart webhook-relay-api

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

## 📋 Post-Deployment

### 1. Verify Backend

```bash
# Health check
curl https://api.yourdomain.com/health

# Test registration
curl -X POST https://api.yourdomain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@123456",
    "fullName": "Test User"
  }'
```

### 2. Verify Frontend

- Visit https://yourdomain.com
- Test login/registration
- Test all major features
- Check browser console for errors

### 3. Setup Monitoring

- Configure uptime monitoring (UptimeRobot, Pingdom)
- Setup error tracking (Sentry)
- Configure log aggregation (LogDNA, Papertrail)

### 4. Performance Testing

```bash
# Load testing with Apache Bench
ab -n 1000 -c 100 https://api.yourdomain.com/health

# Or with Artillery
npm install -g artillery
artillery quick --count 100 -n 20 https://api.yourdomain.com/health
```

## 🔧 Maintenance

### Database Backups

```bash
# MongoDB backup script
mongodump --uri="$MONGODB_URI" --out=/backups/$(date +%Y%m%d)

# Setup cron job
0 2 * * * /path/to/backup-script.sh
```

### Log Rotation

PM2 handles log rotation automatically. For nginx:

```bash
# Already configured by default at
/etc/logrotate.d/nginx
```

### Updates

```bash
# Backend updates
cd ~/webhook-relay/backend
git pull
npm ci --production
pm2 restart webhook-relay-api

# Frontend updates
cd ~/webhook-relay/frontend
git pull
npm ci
npm run build
# Deploy to hosting
```

## 🆘 Troubleshooting

### Backend won't start
```bash
# Check logs
pm2 logs webhook-relay-api

# Check if port is in use
sudo lsof -i :5000

# Check MongoDB connection
mongo "$MONGODB_URI"

# Check Redis connection
redis-cli -u "$REDIS_URL" ping
```

### Frontend build fails
```bash
# Clear cache
rm -rf node_modules package-lock.json
npm install

# Check build locally
npm run build
```

### High memory usage
```bash
# Check PM2 metrics
pm2 monit

# Restart if needed
pm2 restart webhook-relay-api

# Check for memory leaks
node --inspect src/server.js
```

---

**Production Deployment Completed** ✅

For support: support@richytech.inc
