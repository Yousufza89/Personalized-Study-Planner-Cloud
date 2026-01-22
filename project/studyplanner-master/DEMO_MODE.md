# Demo Mode - Quick Start Guide

## 🚀 Testing the Frontend Without Azure

You can test the entire frontend UI without setting up Azure services! The app automatically detects when Azure AD is not configured and switches to demo mode.

## Quick Setup (2 minutes)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create `.env.local` file with just this:**
   ```env
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=any-random-string-here-for-demo
   ```

3. **Start the dev server:**
   ```bash
   npm run dev
   ```

4. **Open http://localhost:3000**

5. **On the login page, click "🚀 Quick Login (Demo)"**

That's it! You're in! 🎉

## What Works in Demo Mode

✅ **All UI Pages** - Dashboard, Schedules, Profile, Upload pages  
✅ **Navigation** - Sidebar, Navbar, all routes  
✅ **Forms** - Create schedule form, edit forms  
✅ **UI Components** - Buttons, Cards, Modals, etc.  
✅ **Authentication** - Mock login (any email works)  
✅ **Session Management** - User stays logged in  

## What Doesn't Work (Without Azure)

❌ **Data Persistence** - Schedules won't be saved (returns empty/mock data)  
❌ **File Uploads** - Can't upload files without Azure Blob Storage  
❌ **Real Azure AD Login** - Uses mock credentials instead  

## Notes

- The app will show empty schedules lists (no error, just empty)
- Creating schedules will appear to work but won't persist
- File uploads will show errors (expected without Azure Storage)
- All UI/UX is fully functional for testing!

## When You're Ready for Azure

Just add your Azure credentials to `.env.local` and the app will automatically switch to production mode with real Azure AD authentication.

