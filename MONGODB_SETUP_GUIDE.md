# 🌍 Global Data Sync Setup Guide (MongoDB Atlas)

To solve the issue of data being lost across different browsers and devices, you need to connect your application to a cloud database (**MongoDB Atlas**).

Follow these steps to set up your database and configure Netlify.

## Step 1: Create a MongoDB Atlas Account (Free)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) and sign up for a free account.
2. Create a new **Project** (e.g., "MedicalLab").
3. Create a **Cluster** (select the **Shared / Free** tier).
4. Choose a provider (AWS) and region (closest to you, e.g., Mumbai `ap-south-1`).
5. Click **Create Cluster**.

## Step 2: Configure Database Access

1. Go to **Database Access** (left sidebar).
2. Click **Add New Database User**.
3. **Username**: `admin`
4. **Password**: Create a strong password (e.g., `LabAdmin123!`). **Write this down!**
5. Click **Add User**.

## Step 3: Configure Network Access

1. Go to **Network Access** (left sidebar).
2. Click **Add IP Address**.
3. Click **Allow Access from Anywhere** (`0.0.0.0/0`).
   * *Note: This is required for Netlify Functions to connect.*
4. Click **Confirm**.

## Step 4: Get Connection String

1. Go to **Database** (left sidebar).
2. Click **Connect** on your cluster.
3. Select **Drivers**.
4. Copy the connection string. It looks like:
   `mongodb+srv://suragsunil2023_db_user:<password>@labdb.qjokknr.mongodb.net/?appName=Labdb`

## Step 5: Configure Netlify Environment Variables

1. Go to your **Netlify Dashboard**.
2. Select your site (`healitmedlaboratories`).
3. Go to **Site configuration** > **Environment variables**.
4. Click **Add a variable**.
5. **Key**: `MONGODB_URI`
6. **Value**: Paste your connection string:
   `mongodb+srv://suragsunil2023_db_user:<password>@labdb.qjokknr.mongodb.net/?appName=Labdb`
   * **IMPORTANT**: Replace `<password>` with the password you created for the user `suragsunil2023_db_user`.
7. Click **Create variable**.

## Step 6: Redeploy Your Site

1. Go to **Deploys** in Netlify.
2. Click **Trigger deploy** > **Deploy site**.
3. Wait for the deployment to finish.

## ✅ Verification

1. Open your app in the browser where you have data.
2. Refresh the page.
3. Open the **Console** (F12 > Console).
4. You should see:
   * `Attempting to sync with server...`
   * `Server response: { success: true, ... }`
   * `📤 Server is empty. Uploading local data to seed database...`
   * `✅ Local data uploaded to server successfully`

5. Now open the app in a **different browser** (e.g., Firefox, Edge, or Mobile).
6. You should see your data automatically appear!

---

## ⚠️ Troubleshooting

**"Database not configured" warning in console?**
- You missed Step 5. The `MONGODB_URI` variable is missing or incorrect.

**"MongoDB connection error"?**
- Check your password in the connection string.
- Ensure Network Access is set to `0.0.0.0/0` (Step 3).

**Data not appearing on other devices?**
- Ensure you opened the *source* browser first after deployment so it could upload the data to the cloud.
