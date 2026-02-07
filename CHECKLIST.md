# Pre-Push & Deployment Checklist

## ✅ Before Pushing to Git

- [ ] Run `npm run security-check` (should pass)
- [ ] Run `git status` (should NOT show `.env` files)
- [ ] Review `git diff` for any sensitive data
- [ ] All features tested locally
- [ ] Backend and frontend connect properly
- [ ] No console errors in browser

## ✅ Before Deployment

### Backend
- [ ] `NODE_ENV=production` set
- [ ] All environment variables configured
- [ ] Firebase credentials valid
- [ ] CORS configured for production domain
- [ ] `npm audit` shows no critical issues

### Frontend
- [ ] `VITE_BACKEND_URL` points to production backend
- [ ] All Firebase config variables set
- [ ] `npm run build` succeeds
- [ ] No build warnings

### Firebase
- [ ] Realtime Database enabled
- [ ] Anonymous authentication enabled
- [ ] Database security rules configured
- [ ] API key restrictions set (optional)

## ✅ After Deployment

- [ ] Backend accessible via HTTPS
- [ ] Frontend accessible via HTTPS
- [ ] Can create a room
- [ ] Can join a room
- [ ] Numbers can be called
- [ ] Claims work properly
- [ ] Reconnection works
- [ ] No console errors

## 🚀 Ready to Deploy!

Once all items are checked, you're ready to deploy to production.
