# Security Policy

## Environment Variables

**CRITICAL**: Never commit `.env` files to version control.

### Required Environment Variables

**Backend** (`backend/.env`):
```env
PORT=3001
NODE_ENV=production
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-email@project.iam.gserviceaccount.com
FIREBASE_DATABASE_URL=https://your-project.firebasedatabase.app
FRONTEND_URL=https://your-frontend-domain.com
```

**Frontend** (`frontend/.env`):
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

## Firebase Security Rules

Configure these rules in Firebase Console:

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

## Production Deployment Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure CORS for production domain only
- [ ] Enable Firebase Database security rules
- [ ] Use HTTPS for all connections
- [ ] Restrict Firebase API key by domain
- [ ] Run `npm audit` and fix vulnerabilities
- [ ] Set up monitoring and error tracking

## Reporting Security Issues

Report security vulnerabilities privately to the maintainers. Do not open public issues for security concerns.
