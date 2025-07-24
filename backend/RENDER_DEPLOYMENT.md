# Render Backend Deployment Guide

## Step 1: Prepare Your Repository

1. Make sure your backend code is in a Git repository
2. Ensure all files are committed and pushed to your repository

## Step 2: Deploy on Render

1. Go to [render.com](https://render.com) and create an account
2. Click "New +" and select "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `topleague-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Starter (free tier)

## Step 3: Environment Variables

Set these environment variables in Render dashboard:

```
NODE_ENV=production
PORT=10000
JWT_SECRET=[generate a secure random string]
DATABASE_URL=mysql://dbu3477698:TopLeague.1@db5018267668.hosting-data.io:3306/dbu3477698
CORS_ORIGIN=https://top-league.org
```

## Step 4: Update Frontend API Configuration

Once deployed, update your frontend API configuration to point to the Render backend URL.

## Step 5: Test the Connection

1. Check that the backend is running on Render
2. Test API endpoints from your IONOS frontend
3. Verify CORS is working correctly

## Troubleshooting

- If you get CORS errors, make sure `https://top-league.org` is in the allowed origins
- If database connection fails, verify the DATABASE_URL is correct
- Check Render logs for any startup errors 