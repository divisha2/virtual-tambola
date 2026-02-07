# Deployment Guide

## Prerequisites

- Firebase project with Realtime Database enabled
- Hosting accounts (Vercel for frontend, Render/Railway for backend)
- Domain names (optional)

## Backend Deployment (Render/Railway)

### 1. Prepare Backend

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Set these in your hosting platform:

```env
NODE_ENV=production
PORT=3001
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-email@project.iam.gserviceaccount.com
FIREBASE_DATABASE_URL=https://your-project.firebasedatabase.app
FRONTEND_URL=https://your-frontend-domain.com
```

### 3. Deploy

**Render**:
- Connect GitHub repository
- Build Command: `npm install`
- Start Command: `npm start`
- Add environment variables

**Railway**:
- Connect GitHub repository
- Railway auto-detects Node.js
- Add environment variables

## Frontend Deployment (Vercel)

### 1. Prepare Frontend

```bash
cd frontend
npm install
npm run build
```

### 2. Configure Environment Variables

Set these in Vercel:

```env
VITE_BACKEND_URL=https://your-backend-domain.com
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your-project.firebasedatabase.app
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### 3. Deploy

**Vercel**:
- Connect GitHub repository
- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- Add environment variables

## Firebase Configuration

### 1. Enable Anonymous Authentication

Firebase Console → Authentication → Sign-in method → Enable Anonymous

### 2. Configure Database Rules

Firebase Console → Realtime Database → Rules:

```json
{
  "rules": {
    "rooms": {
      "$roomCode": {
        ".read": "auth != null",
        ".write": "auth != null"
      }
    },
    "tickets": {
      "$ticketId": {
        ".read": "auth != null",
        ".write": "auth != null"
      }
    },
    "claims": {
      "$claimId": {
        ".read": "auth != null",
        ".write": "auth != null"
      }
    }
  }
}
```

### 3. Restrict API Key (Optional)

Firebase Console → Project Settings → API restrictions → Add your domain

## Post-Deployment Checklist

- [ ] Backend is accessible via HTTPS
- [ ] Frontend is accessible via HTTPS
- [ ] Socket.IO connection works
- [ ] Firebase authentication works
- [ ] Database rules are active
- [ ] CORS is configured correctly
- [ ] Environment variables are set
- [ ] Test creating and joining a room
- [ ] Test number calling and claims

## Monitoring

Set up monitoring for:
- Backend uptime
- Error tracking (Sentry recommended)
- Firebase usage and costs
- Socket.IO connection metrics

## Troubleshooting

**Socket.IO not connecting**:
- Check CORS configuration
- Verify VITE_BACKEND_URL is correct
- Ensure backend is running

**Firebase errors**:
- Verify all environment variables
- Check database rules
- Ensure anonymous auth is enabled

**Build failures**:
- Run `npm audit fix`
- Check Node.js version (18+)
- Verify all dependencies installed
