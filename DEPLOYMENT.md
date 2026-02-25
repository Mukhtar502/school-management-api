# Deployment Guide - School Management System API

**Version:** 1.0.0  
**Last Updated:** February 23, 2026

---

## 📋 Table of Contents

1. [Local Development](#local-development)
2. [Production Checklist](#production-checklist)
3. [Heroku Deployment](#heroku-deployment)
4. [AWS EC2 Deployment](#aws-ec2-deployment)
5. [DigitalOcean Deployment](#digitalocean-deployment)
6. [Docker Deployment](#docker-deployment)
7. [Monitoring & Logging](#monitoring--logging)

---

## Local Development

### Quick Start

```bash
# Clone repository
git clone https://github.com/yourusername/school-management-api.git
cd school-management-api/axion

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with localhost URIs
nano .env
# MONGO_URI=mongodb://localhost:27017/school_management_system
# REDIS_URI=redis://127.0.0.1:6379

# Start MongoDB (in separate terminal)
mongod

# Start Redis (in separate terminal)
redis-server

# Start application
npm start

# Application runs on http://localhost:5111
```

### Testing Locally

```bash
# Run test suite
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- user.test.js

# Run in watch mode
npm test -- --watch
```

### Development Tips

- **Hot reload:** Use `nodemon` for automatic restart on file changes

  ```bash
  npm install --save-dev nodemon
  npm run dev  # Requires "dev" script in package.json
  ```

- **Debugging:** Enable Node.js debugging

  ```bash
  node --inspect index.js
  # Then visit chrome://inspect in Chrome
  ```

- **Database GUI:** Use MongoDB Compass for visual database management
  - Connect to: `mongodb://localhost:27017`

---

## Production Checklist

### Pre-Deployment

- [ ] All tests passing (`npm test`)
- [ ] Code review completed
- [ ] Security audit performed
- [ ] Performance testing done
- [ ] Database backups configured
- [ ] Monitoring setup planned
- [ ] Logging service configured
- [ ] Error tracking setup (Sentry)
- [ ] SSL/TLS certificates obtained
- [ ] Domain name registered

### Environment & Security

- [ ] Generate strong JWT secrets (min 64 characters)

  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

- [ ] Store secrets in secure vault
  - Enable environment variable encryption
  - Never commit `.env` to repository
  - Use managed secrets service

- [ ] Enable HTTPS/TLS
  - Install SSL certificate
  - Configure HSTS headers
  - Redirect HTTP to HTTPS

- [ ] Database security
  - Enable MongoDB authentication
  - Use encrypted connections
  - Setup firewall rules
  - Enable audit logging

- [ ] API security
  - Setup rate limiting
  - Configure CORS properly
  - Add security headers
  - Enable request logging

### Performance Tuning

- [ ] Enable caching (Redis)
- [ ] Configure database indexes
- [ ] Enable gzip compression
- [ ] Setup CDN for static assets
- [ ] Configure load balancing
- [ ] Enable database connection pooling
- [ ] Monitor memory usage
- [ ] Profile slow database queries

---

## Heroku Deployment

### Heroku Setup

```bash
# Install Heroku CLI
# https://devcenter.heroku.com/articles/heroku-cli

# Login to Heroku
heroku login

# Create Heroku app
heroku create school-management-api

# View app
heroku open
```

### Database Setup

```bash
# Add MongoDB Atlas
heroku config:set MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname

# Add Heroku Redis
heroku addons:create heroku-redis:premium-0

# Verify Redis URI
heroku config | grep REDIS_URL
```

### Environment Variables

```bash
# Set JWT secrets (MUST be VERY strong!)
heroku config:set LONG_TOKEN_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
heroku config:set SHORT_TOKEN_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
heroku config:set NACL_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")

# Set environment
heroku config:set ENV=production

# Set NODE_ENV
heroku config:set NODE_ENV=production

# View all config
heroku config
```

### Deploy Application

```bash
# Add Procfile for Heroku
echo "web: node index.js" > Procfile

# Deploy
git push heroku main

# View logs
heroku logs --tail

# Restart dyno
heroku restart

# Scale dynos
heroku ps:scale web=2  # Run 2 web dynos
```

### Troubleshooting Heroku

```bash
# Check build logs
heroku logs --source heroku

# Check app logs
heroku logs --source app

# Restart application
heroku restart

# View running processes
heroku ps

# Access remote shell
heroku run bash

# Run one-off command
heroku run npm test

# Check config
heroku config
```

---

## AWS EC2 Deployment

### EC2 Instance Setup

```bash
# 1. Launch EC2 Instance
# - AMI: Ubuntu 20.04 LTS
# - Instance type: t3.medium (or larger)
# - Storage: 20GB (or more)
# - Security group: Allow ports 22 (SSH), 80 (HTTP), 443 (HTTPS)

# 2. SSH into instance
ssh -i your-key.pem ubuntu@your-instance-ip

# 3. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs

# 4. Install MongoDB
curl https://www.mongodb.org/static/pgp/server-4.4.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/4.4 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-4.4.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod

# 5. Install Redis
sudo apt-get install -y redis-server
sudo systemctl start redis-server

# 6. Install Nginx
sudo apt-get install -y nginx

# 7. Install PM2 for process management
sudo npm install -g pm2
```

### Application Deployment

```bash
# 1. Git clone application
cd /opt
sudo git clone https://github.com/yourusername/school-management-api.git
cd school-management-api/axion

# 2. Install dependencies
npm install --production

# 3. Create .env file
sudo nano .env
# Configure production variables

# 4. Start with PM2
pm2 start index.js --name "sms-api"
pm2 startup
pm2 save

# 5. Configure Nginx as reverse proxy
sudo nano /etc/nginx/sites-available/default
```

### Nginx Configuration

```nginx
upstream app {
    server localhost:5111;
}

server {
    listen 80;
    server_name your-domain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    location / {
        proxy_pass http://app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### SSL/TLS Setup

```bash
# Install Let's Encrypt certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Generate certificate
sudo certbot certonly --standalone -d your-domain.com

# Auto-renew certificates
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

---

## DigitalOcean Deployment

### Droplet Setup

```bash
# 1. Create Droplet
# - Image: Ubuntu 20.04
# - Size: $5-20/month (depending on traffic)
# - Region: Choose closest to users
# - Add SSH key

# 2. SSH into droplet
ssh root@your-droplet-ip

# 3. Update system
apt-get update && apt-get upgrade -y

# 4. Create non-root user
adduser appuser
usermod -aG sudo appuser
sudo -u appuser mkdir -p ~/.ssh
cat ~/.ssh/authorized_keys > $(sudo -u appuser -s -H -c 'echo $HOME')/.ssh/authorized_keys

# 5. Disable root login
nano /etc/ssh/sshd_config
# PermitRootLogin no
systemctl restart ssh
```

### App Setup (same as AWS above)

```bash
# Install Node.js, MongoDB, Redis, Nginx, PM2 (same commands as AWS)

# Deploy application
# Setup environment variables
# Configure Nginx
# Setup SSL/TLS
```

### DigitalOcean-Specific

```bash
# Monitor with DigitalOcean monitoring
doctl monitoring alert create --type v-memory-percent --value 80

# Setup backups
doctl compute droplet-action enable-backups --wait

# Use DigitalOcean Space for file uploads
npm install --save aws-sdk
# Configure AWS SDK to use DO Spaces
```

---

## Docker Deployment

### Dockerfile

```dockerfile
# Use official Node.js runtime as base image
FROM node:16-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy application code
COPY . .

# Expose port
EXPOSE 5111

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5111/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start application
CMD ["node", "index.js"]
```

### Docker Compose

```yaml
version: "3.8"

services:
  app:
    build: .
    ports:
      - "5111:5111"
    environment:
      - NODE_ENV=production
      - MONGO_URI=mongodb://mongo:27017/school_management_system
      - REDIS_URI=redis://redis:6379
      - LONG_TOKEN_SECRET=${LONG_TOKEN_SECRET}
      - SHORT_TOKEN_SECRET=${SHORT_TOKEN_SECRET}
      - NACL_SECRET=${NACL_SECRET}
    depends_on:
      - mongo
      - redis
    restart: unless-stopped
    healthcheck:
      test:
        [
          "CMD",
          "node",
          "-e",
          "require('http').get('http://localhost:5111/health')",
        ]
      interval: 30s
      timeout: 10s
      retries: 3

  mongo:
    image: mongo:4.4
    volumes:
      - mongo_data:/data/db
    restart: unless-stopped
    environment:
      - MONGO_INITDB_DATABASE=school_management_system

  redis:
    image: redis:6-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  mongo_data:
  redis_data:
```

### Docker Deployment

```bash
# Build image
docker build -t school-management-api:latest .

# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down

# Remove volumes
docker-compose down -v
```

---

## Monitoring & Logging

### Setup Error Tracking (Sentry)

```javascript
// At top of index.js
const Sentry = require("@sentry/node");

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.ENV,
  tracesSampleRate: 1.0,
});

app.use(Sentry.Handlers.errorHandler());
```

### Setup Application Monitoring

**New Relic:**

```bash
npm install newrelic
# Add require('newrelic') at start of index.js
```

**DataDog:**

```bash
npm install dd-trace
# Configure in index.js
```

### Logging Best Practices

```javascript
// Use structured logging
const winston = require("winston");

const logger = winston.createLogger({
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

// Use in code
logger.info("Server started", { port: 5111 });
logger.error("Database error", { error: err.message });
```

### Performance Monitoring

```bash
# Monitor with pm2
pm2 monit

# View logs
pm2 logs

# Create cluster mode
pm2 start index.js -i max  # Use all CPU cores
```

### Database Monitoring

```javascript
// Monitor MongoDB performance
const monitor = setInterval(() => {
  db.admin()
    .serverStatus()
    .then((status) => {
      console.log("Memory:", status.mem);
      console.log("Connections:", status.connections);
    });
}, 60000);
```

---

## Troubleshooting

### Application Won't Start

```bash
# Check Node version
node --version

# Check dependencies installed
npm list

# Check for errors
npm start 2>&1 | tee startup.log

# Clear cache and rebuild
rm -rf node_modules package-lock.json
npm install
```

### Database Connection Issues

```bash
# Test MongoDB connection
mongo $MONGO_URI

# Check MongoDB status
systemctl status mongod

# View MongoDB logs
tail -f /var/log/mongodb/mongod.log
```

### Redis Connection Issues

```bash
# Test Redis connection
redis-cli ping

# Check Redis status
systemctl status redis-server

# View Redis logs
tail -f /var/log/redis/redis-server.log
```

### Memory Leaks

```bash
# Monitor memory usage
pm2 monit

# Use heapdump
npm install heapdump
# In code: require('heapdump').writeSnapshot()

# Analyze with clinic.js
npm install -g clinic
clinic doctor -- node index.js
```

---

## Performance Tuning

### Node.js

```bash
# Increase file descriptor limit
ulimit -n 65536

# Use cluster mode
pm2 start index.js -i max

# Enable compression
NODE_ENV=production npm start
```

### MongoDB

```javascript
// Create indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.classrooms.createIndex(
  { schoolId: 1, gradeLevel: 1, section: 1 },
  { unique: true },
);
db.students.createIndex({ enrollmentNumber: 1, schoolId: 1 }, { unique: true });
```

### Redis

```bash
# Configure Redis for better performance
# /etc/redis/redis.conf
maxmemory 256mb
maxmemory-policy allkeys-lru
```

---

## Rollback Plan

```bash
# If new version has issues:

# 1. Stop current version
pm2 stop sms-api

# 2. Checkout previous version
git checkout previous-release-tag

# 3. Reinstall and restart
npm install --production
pm2 start sms-api

# 4. Verify
curl http://localhost:5111/health
```

---

## Support & Documentation

- **Heroku Docs:** https://devcenter.heroku.com
- **AWS Docs:** https://docs.aws.amazon.com
- **DigitalOcean:** https://digitalocean.com/docs
- **Docker:** https://docs.docker.com
- **MongoDB:** https://docs.mongodb.com
- **Redis:** https://redis.io/documentation
- **Node.js:** https://nodejs.org/docs

---

**Last Updated:** February 23, 2026  
**Created By:** SMS Development Team
