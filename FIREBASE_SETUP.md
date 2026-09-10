# Firebase Setup Instructions 🔥

To make the gallery visible to everyone (Skyler can see photos you upload), you need to set up Firebase:

## Step 1: Create Firebase Project (Free)

1. Go to https://console.firebase.google.com/
2. Click "Add project"
3. Name it "skyler-gallery" (or anything you want)
4. Disable Google Analytics (not needed)
5. Click "Create project"

## Step 2: Create Realtime Database

1. In your Firebase console, click "Realtime Database" in the left menu
2. Click "Create Database"
3. Choose location (e.g., United States)
4. Start in **test mode** (allows read/write without authentication)
5. Click "Enable"

## Step 3: Get Your Configuration

1. Click the gear icon ⚙️ next to "Project Overview"
2. Click "Project settings"
3. Scroll down to "Your apps" section
4. Click the web icon `</>`
5. Register app with nickname "skyler-web"
6. Copy the `firebaseConfig` object

## Step 4: Update script.js

Replace the dummy config in `script.js` (around line 155) with your real config:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY_HERE",
    authDomain: "your-project.firebaseapp.com",
    databaseURL: "https://your-project-default-rtdb.firebaseio.com",
    projectId: "your-project",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
};
```

## Step 5: Push to GitHub

```bash
git add script.js
git commit -m "Add real Firebase config"
git push origin main
```

## That's it! ✨

Now when you or Skyler uploads a photo, it will be visible to everyone who visits the site!

**Note:** The free Firebase plan includes:
- 1 GB storage
- 10 GB/month download
- More than enough for a photo gallery! 💜
