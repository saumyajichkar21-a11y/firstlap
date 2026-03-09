# MIT Scholarship App - Deployment Guide

This repository contains a full-stack MIT Scholarship Slot Booking System separated into `frontend` and `backend`.

## 1. Deploying the Backend (Render)
1. Push this repository to GitHub.
2. Go to [Render.com](https://render.com/) and click **New > Web Service**.
3. Connect your GitHub repository.
4. Set the following details:
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
5. Add the Environment Variables:
   - `MONGO_URI`: Your MongoDB Atlas Connection String.
   - `JWT_SECRET`: A strong random string for security.
6. Click **Create Web Service**. Wait for it to deploy and copy the backend URL (e.g., `https://mit-scholarship-api.onrender.com`).

## 2. Deploying the Frontend (Vercel)
1. Open `frontend/app.js` and change the `API_URL` variable at the top to your new Render Backend URL:
   ```javascript
   const API_URL = 'https://mit-scholarship-api.onrender.com/api';
   ```
2. Commit and push this change to GitHub.
3. Go to [Vercel.com](https://vercel.com/) and click **Add New > Project**.
4. Import your GitHub repository.
5. Set the **Framework Preset** to `Other` (Static HTML/JS).
6. Set the **Root Directory** to `frontend`.
7. Click **Deploy**.

## 3. Database Setup (MongoDB Atlas)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and create a free shared cluster.
2. Under Database Access, create a user and password.
3. Under Network Access, allow access from anywhere (`0.0.0.0/0`).
4. Click **Connect > Connect your application** and copy the connection string. Replace `<password>` with your actual password.
5. Provide this connection string to your Render environment variables.

## 4. Initialize Database (Seed)
Before using the application, you must initialize the database with an admin account and the verification slots.

**Run this locally from your machine:**
1. Open a terminal and navigate to the `backend` folder.
2. Ensure you have Node.js installed.
3. Run the following command, replacing `<YOUR_MONGODB_URI>` with the connection string you got from Atlas:

   **Windows (PowerShell):**
   ```powershell
   $env:MONGO_URI="<YOUR_MONGODB_URI>"; node seed.js
   ```
   **Mac/Linux:**
   ```bash
   MONGO_URI="<YOUR_MONGODB_URI>" node seed.js
   ```

4. Once it says "Slots seeded successfully", your database is ready! 
5. You can now log into the Admin portal using the default credentials:
   - **Username**: `mitadmin`
   - **Password**: `mitpassword123`
   
*(Make sure you change this password later or create a new admin via the database itself).*
