# 🚀 Render Deployment Guide - School Management System API

## Step 1: Create MongoDB Atlas Cluster (Free)

### 1.1 Sign up for MongoDB Atlas

1. Go to https://www.mongodb.com/cloud/atlas
2. Click "Start Free"
3. Create an account (use your email)
4. Verify email

### 1.2 Create a Cluster

1. After login, click "Create" → "Build a Database"
2. Choose **"FREE"** tier
3. Select region closest to you (or US East for Render compatibility)
4. Click "Create Cluster" (takes 1-2 minutes)

### 1.3 Create Database User

1. Go to **Database Access** (left sidebar)
2. Click **"Add New Database User"**
3. Choose **"Password" authentication**
4. Set Username: `schoolapi`
5. Set Password: `YourSecurePassword123` (copy this!)
6. Click **"Add User"**

### 1.4 Get Connection String

1. Go to **Clusters** (left sidebar)
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Select **"Node.js"** driver
5. Copy the connection string (looks like):
   ```
   mongodb+srv://schoolapi:YourSecurePassword123@cluster0.xxxxx.mongodb.net/school_management_system?retryWrites=true&w=majority
   ```
6. Replace `school_management_system` with your database name (keep it)
7. **SAVE THIS CONNECTION STRING** - you'll need it

### 1.5 Add Render IP to Whitelist

1. Go to **Network Access** (left sidebar)
2. Click **"Add IP Address"**
3. Choose **"0.0.0.0/0"** (allow all - for free tier)
4. Click **"Confirm"**

---

## Step 2: Deploy to Render

### 2.1 Sign up for Render

1. Go to https://render.com
2. Click **"Sign up"** → choose **"GitHub"** (easier!)
3. Authorize Render to access your GitHub account
4. After login, you're in the dashboard

### 2.2 Create Web Service

1. Click **"New +"** (top right)
2. Select **"Web Service"**
3. Click **"Connect repository"**
4. Find and select: `school-management-api`
5. Click **"Connect"**

### 2.3 Configure Deployment

Fill in the form:

| Field             | Value                            |
| ----------------- | -------------------------------- |
| **Name**          | `school-management-api`          |
| **Environment**   | `Node`                           |
| **Region**        | `Oregon` (or closest to MongoDB) |
| **Branch**        | `main`                           |
| **Build Command** | `npm install`                    |
| **Start Command** | `npm start`                      |
| **Plan**          | `Free`                           |

Click **"Create Web Service"** (wait for deployment)

### 2.4 Set Environment Variables in Render Dashboard

After the service is created:

1. Go to your service dashboard
2. Click **"Environment"** (left sidebar)
3. Click **"Add Environment Variable"** and add these:

```
NODE_ENV = production
ENV = production
SERVICE_NAME = school-management-api
USER_PORT = 10000
CORTEX_PREFIX = sms:cortex
OYSTER_PREFIX = sms:oyster
CACHE_PREFIX = sms:cache
CORTEX_TYPE = school-management-api
```

4. For MongoDB, click **"Add Environment Variable"**:
   - **Key**: `MONGO_URI`
   - **Value**: Paste your MongoDB Atlas connection string from Step 1.4
   - Example: `mongodb+srv://schoolapi:YourSecurePassword123@cluster0.xxxxx.mongodb.net/school_management_system?retryWrites=true&w=majority`

5. For JWT Secrets, generate random 64-character strings:

   ```bash
   # Copy and paste this in your terminal to generate:
   openssl rand -hex 32
   ```

   Then add:
   - **Key**: `LONG_TOKEN_SECRET` → **Value**: `[paste 64-char string]`
   - **Key**: `SHORT_TOKEN_SECRET` → **Value**: `[paste 64-char string]`
   - **Key**: `NACL_SECRET` → **Value**: `dGhpcyBpcyBhIDMyIGNoYXIgbmFjbCBzZWNyZXQga2V5Lg==`

6. Click **"Save Changes"**
7. Render will auto-restart with new environment variables

### 2.5 Add Redis Service (Auto-provisioned)

Render reads `render.yaml` automatically:

1. Go to **Connected Resources** (bottom of service page)
2. Look for **"school-management-redis"** (should be auto-created)
3. Connection string auto-injected to Redis env vars

### 2.6 Wait for Deployment

1. Watch the **"Logs"** tab for deployment progress
2. Look for: `✓ API is running` or `Server listening on port 10000`
3. Once you see ✅ success, deployment is complete!

---

## Step 3: Test Your Deployment

### 3.1 Get Your Live URL

Your service URL is shown at top of dashboard:

```
https://school-management-api.onrender.com
```

### 3.2 Test API Endpoint

Open a new terminal and run:

```bash
curl -X POST https://school-management-api.onrender.com/api/user/registerUser \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin1",
    "email": "admin@school.com",
    "password": "AdminPass123",
    "firstName": "Admin",
    "lastName": "User",
    "role": "superadmin"
  }'
```

Should return:

```json
{
  "ok": true,
  "code": 200,
  "data": {
    "user": {
      "id": "...",
      "username": "admin1",
      "email": "admin@school.com",
      "role": "superadmin"
    },
    "accessToken": "eyJhbGc..."
  }
}
```

### 3.3 View Swagger Documentation

Visit: `https://school-management-api.onrender.com/api-docs`

You should see interactive Swagger UI with all endpoints!

---

## Troubleshooting

### Issue: "Connection refused" error

**Solution**: Check MongoDB Atlas whitelist (allow 0.0.0.0/0)

### Issue: "Invalid JWT secret"

**Solution**: Make sure JWT secrets are set (exactly 64 characters, no quotes)

### Issue: Service keeps restarting

**Solution**: Check Logs tab for specific errors. Common cause: missing MONGO_URI

### Issue: "503 Service Unavailable"

**Solution**: Usually Render free tier going to sleep. First request takes ~30 seconds. Wait and retry.

---

## Deployment Summary

✅ **Backend URL**: `https://school-management-api.onrender.com`  
✅ **API Documentation**: `https://school-management-api.onrender.com/api-docs`  
✅ **MongoDB**: MongoDB Atlas (free tier, 512MB)  
✅ **Redis**: Render Free Redis  
✅ **JWT Authentication**: Configured ✅  
✅ **CORS**: Enabled for all origins

---

## Production Checklist

- [x] MongoDB Atlas cluster created and whitelisted
- [x] Connection string added to Render
- [x] JWT secrets generated and set
- [x] Code deployed to Render
- [x] API endpoints tested and working
- [x] Swagger documentation accessible
- [ ] Setup monitoring (optional: Sentry, DataDog)
- [ ] Setup backups for MongoDB (optional)
- [ ] Configure custom domain (optional: paid Render plan)

**Your API is now LIVE! 🎉**
