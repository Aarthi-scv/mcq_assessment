# Deployment Guide

## Changes Made for Deployment

All hardcoded API URLs have been replaced with environment variables for flexible deployment.

## Backend Deployment (Render/Railway/Heroku)

### 1. Deploy Backend
- Push code to GitHub
- Connect to Render/Railway/Heroku
- Set environment variables:
  ```
  MONGO_URI=mongodb+srv://aarthi7813_db_user:Aarthieg_13@cluster1.4j0xn4b.mongodb.net/assessment?retryWrites=true&w=majority&appName=Cluster1
  PORT=5000
  ```

### 2. MongoDB Atlas Setup
- Go to MongoDB Atlas → Network Access
- Add IP: `0.0.0.0/0` (allow from anywhere)
- Verify cluster is active (not paused)

## Frontend Deployment (Vercel/Netlify)

### 1. Deploy Frontend
- Push code to GitHub
- Connect to Vercel/Netlify
- Set environment variables:
  ```
  VITE_API_URL=https://your-backend-url.com/api
  VITE_UPLOADS_URL=https://your-backend-url.com/uploads
  ```

### 2. Build Settings
- Build command: `npm run build`
- Output directory: `dist`

## Local Development

Your `.env` files are already configured for local development:
- Backend: `server/.env`
- Frontend: `client/.env`

## Important Notes

1. **Your local DNS issue will NOT affect deployment** - Cloud servers have proper DNS
2. **MongoDB Atlas works perfectly with deployed apps**
3. **Never commit `.env` files** - They're already in `.gitignore`
4. **Update CORS in server.js** if needed for your frontend domain

## Quick Deploy Commands

### Backend (from server folder)
```bash
git init
git add .
git commit -m "Initial commit"
git push origin main
```

### Frontend (from client folder)
```bash
npm run build
# Deploy dist folder to Vercel/Netlify
```

## Testing Deployment

1. Deploy backend first and get the URL
2. Update frontend environment variables with backend URL
3. Deploy frontend
4. Test the application

Your application is now deployment-ready!
