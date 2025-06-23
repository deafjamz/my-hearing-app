# Google Sheets API Setup Guide

## 🔧 Setting Up Google Sheets API Access

### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google Sheets API**

### Step 2: Create Service Account
1. Go to **IAM & Admin** → **Service Accounts**
2. Click **"Create Service Account"**
3. Give it a name like "hearing-app-sheets-api"
4. Click **"Create and Continue"**
5. Skip role assignment (click **"Continue"**)
6. Click **"Done"**

### Step 3: Create API Key
1. Click on your newly created service account
2. Go to **"Keys"** tab
3. Click **"Add Key"** → **"Create new key"**
4. Choose **JSON** format
5. Download the file and save it as `google_sheets_credentials.json` in your project folder

### Step 4: Share Your Google Sheet
1. Open your [Google Sheet](https://docs.google.com/spreadsheets/d/1CNDRfgqSdMEyc0JgW6DerCRX1jUftWSX49nsiBPUbek/edit)
2. Click **"Share"** button
3. Add the service account email (found in the JSON file under `"client_email"`)
4. Give it **"Editor"** permissions
5. Click **"Send"**

### Step 5: Install Required Python Packages
```bash
pip install google-api-python-client google-auth google-auth-oauthlib google-auth-httplib2
```

### Step 6: Run the Script
```bash
python3 push_to_sheets.py
```

## 🔍 Troubleshooting

### "403 Forbidden" Error
- Make sure you shared the sheet with the service account email
- Check that the service account has "Editor" permissions

### "File not found" Error
- Ensure `google_sheets_credentials.json` is in the same folder as the script
- Verify the JSON file is properly downloaded and not corrupted

### "Invalid range" Error
- The script targets range `A301:D310` by default
- Adjust the `RANGE_NAME` variable if you want different placement

## 📊 What the Script Does

1. **Reads** your `story_data_for_sheets.csv` file
2. **Connects** to Google Sheets API using service account
3. **Pushes** the 10 story rows to your sheet starting at row 301
4. **Confirms** successful upload with cell count

## 🎯 Expected Result

Your Google Sheet will have 10 new rows added:
- **Column A**: Story titles (e.g., "Barnaby's Big Brave Moment")
- **Column B**: Full story text for ElevenLabs
- **Column C**: Voice setting ("female")
- **Column D**: Audio filename (e.g., "story_timid_teacup.mp3")

Once uploaded, you can run your existing ElevenLabs automation to generate all 10 story audio files!