# MIT Scholarship App - Deployment Guide

This repository contains the full-stack MIT Scholarship Slot Booking System, split into `frontend/` and `backend/`.

---

## Step 1 — Database Setup (MongoDB Atlas)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and create a **free shared cluster**.
2. Under **Database Access**, create a user with a username and password.
3. Under **Network Access**, allow access from anywhere (`0.0.0.0/0`).
4. Click **Connect → Connect your application** and copy the connection string.
   - Replace `<password>` in the string with your real password.
   - Example: `mongodb+srv://myuser:mypassword@cluster0.xxxxx.mongodb.net/`
5. **Save** this URI — you'll need it in Steps 2 and 3.

---

## Step 2 — Deploy the Backend (Render)

1. Push this repository to GitHub.
2. Go to [Render.com](https://render.com/) and click **New → Web Service**.
3. Connect your GitHub repository.
4. Set the following details:
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
5. Under **Environment Variables**, add:
   | Key | Value |
   |-----|-------|
   | `MONGO_URI` | Your MongoDB Atlas connection string from Step 1 |
   | `JWT_SECRET` | Any strong random string (e.g., `abc123XYZ!@#`) |
6. Click **Create Web Service** and wait for deployment.
7. Copy your backend URL (e.g., `https://scholarship-backend-6rdu.onrender.com`) — you'll need it next.

---

## Step 3 — Set Up Admin Account (Seed)

You must create the initial admin account in the database before logging in.

**Run this from inside the `backend/` folder on your machine:**

**Windows (PowerShell):**
```powershell
$env:MONGO_URI="<YOUR_MONGODB_URI>"; node seed.js
```
**Mac/Linux:**
```bash
MONGO_URI="<YOUR_MONGODB_URI>" node seed.js
```

> Once it logs **"Admin seeded"**, the admin account is ready.
> - **Username**: `mitadmin`
> - **Password**: `mitpassword123`

> ⚠️ Change this password after your first login!

*(Make sure you change this password later or create a new admin via the database itself).*

---

## 5. Pushing Local Updates to Live (Redeploying)
Whenever you modify files on your local machine (like the new Admin "Add Slots" feature we just built), you need to push them to GitHub so Vercel (Frontend) and Render (Backend) know to update the live website.

Run these exact commands in your terminal from the `first_lap` root folder:

1. Stage all the files we modified:
   ```bash
   git add .
   ```
2. Commit the changes with a descriptive message:
   ```bash
   git commit -m "Added admin Add Slots feature and updated seed script"
   ```
3. Push to your main branch:
   ```bash
   git push origin main
   ```

Within a few minutes, Vercel and Render will detect the new commit and automatically rebuild your live sites!

---

## Step 4 — Deploy the Frontend (Vercel)

1. Open `frontend/app.js` and update the `API_URL` at the very top to your Render backend URL:
   ```javascript
   // Make sure this is your Render URL — do NOT add /api at the end
   const API_URL = 'https://scholarship-backend-6rdu.onrender.com';
   ```
2. Commit and push this change to GitHub.
3. Go to [Vercel.com](https://vercel.com/) and click **Add New → Project**.
4. Import your GitHub repository.
5. Set:
   - **Framework Preset**: `Other` (Static HTML/JS)
   - **Root Directory**: `frontend`
6. Click **Deploy**. Your site will be live in minutes.

---

## Step 5 — Create Slots as Admin

Slots are **not pre-seeded** — you create them from the Admin portal after deployment.

> The date tabs on the student view automatically show the **next 7 working days** (weekdays only). Any slot you create for those dates will instantly appear.

1. Open your deployed site and go to the **Admin Portal**.
2. Log in with `mitadmin` / `mitpassword123`.
3. Click **+ Add Slots**.
4. Fill in the date, time, and capacity. Use this exact date format: `10 Mar 2026`
5. Click **Create Slot** — it will immediately appear in the student view under the correct date tab.

---

## Step 6 — Managing Holidays

To block out holidays (so students can't see or book slots on those days), edit `frontend/app.js`:

```javascript
// Line ~63 in app.js
const HOLIDAYS = [
    '2026-03-29',  // Holi
    '2026-04-14',  // Ambedkar Jayanti
    // Add more dates in YYYY-MM-DD format
];
```

After adding dates here, redeploy the frontend on Vercel (or it auto-deploys if you push to GitHub).

---

## Quick Reference

| Service | Purpose | URL |
|---------|---------|-----|
| Render | Backend API | `https://scholarship-backend-6rdu.onrender.com` |
| Vercel | Frontend Website | Your Vercel deployment URL |
| MongoDB Atlas | Database | Managed in Atlas dashboard |

