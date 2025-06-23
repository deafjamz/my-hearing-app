#!/usr/bin/env python3
"""
Google Sheets API integration to push story data directly to your sheet
"""

import os
import csv
from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# Your Google Sheet details
SPREADSHEET_ID = '1CNDRfgqSdMEyc0JgW6DerCRX1jUftWSX49nsiBPUbek'
RANGE_NAME = 'Sheet1!A301:D310'  # Adjust the range as needed

def setup_google_sheets_api():
    """
    Set up Google Sheets API with service account credentials
    """
    # Scopes required for reading and writing to Google Sheets
    SCOPES = ['https://www.googleapis.com/auth/spreadsheets']
    
    # Path to your service account key file (you'll need to create this)
    SERVICE_ACCOUNT_FILE = 'google_sheets_credentials.json'
    
    if not os.path.exists(SERVICE_ACCOUNT_FILE):
        print(f"❌ Missing credentials file: {SERVICE_ACCOUNT_FILE}")
        print("\n📋 To set up Google Sheets API access:")
        print("1. Go to https://console.cloud.google.com/")
        print("2. Create a new project or select existing one")
        print("3. Enable Google Sheets API")
        print("4. Create Service Account credentials")
        print("5. Download the JSON key file")
        print(f"6. Save it as '{SERVICE_ACCOUNT_FILE}' in this directory")
        print("7. Share your Google Sheet with the service account email")
        return None
    
    try:
        credentials = Credentials.from_service_account_file(
            SERVICE_ACCOUNT_FILE, scopes=SCOPES)
        
        service = build('sheets', 'v4', credentials=credentials)
        print("✅ Google Sheets API connection established")
        return service
    
    except Exception as e:
        print(f"❌ Error setting up Google Sheets API: {e}")
        return None

def read_story_csv():
    """
    Read the story data from CSV file
    """
    csv_file = 'story_data_for_sheets.csv'
    
    if not os.path.exists(csv_file):
        print(f"❌ CSV file not found: {csv_file}")
        return None
    
    try:
        with open(csv_file, 'r', encoding='utf-8') as file:
            csv_reader = csv.reader(file)
            data = list(csv_reader)
            print(f"✅ Read {len(data)} rows from CSV file")
            return data
    
    except Exception as e:
        print(f"❌ Error reading CSV file: {e}")
        return None

def push_data_to_sheet(service, data):
    """
    Push story data to Google Sheets
    """
    try:
        # Prepare the data for the API
        body = {
            'values': data
        }
        
        # Update the sheet
        result = service.spreadsheets().values().update(
            spreadsheetId=SPREADSHEET_ID,
            range=RANGE_NAME,
            valueInputOption='RAW',
            body=body
        ).execute()
        
        updated_cells = result.get('updatedCells', 0)
        print(f"✅ Successfully updated {updated_cells} cells in Google Sheets!")
        print(f"📊 Data added to range: {RANGE_NAME}")
        
        return True
    
    except HttpError as e:
        print(f"❌ HTTP Error: {e}")
        return False
    except Exception as e:
        print(f"❌ Error pushing data to sheet: {e}")
        return False

def main():
    """
    Main function to push story data to Google Sheets
    """
    print("🚀 Google Sheets Story Data Pusher")
    print("=" * 50)
    
    # Set up Google Sheets API
    service = setup_google_sheets_api()
    if not service:
        return
    
    # Read story data from CSV
    data = read_story_csv()
    if not data:
        return
    
    # Show what we're about to push
    print(f"\n📋 Ready to push {len(data)} rows to your Google Sheet:")
    print(f"   Sheet ID: {SPREADSHEET_ID}")
    print(f"   Range: {RANGE_NAME}")
    print(f"   Stories: {len(data)-1} (plus header row)")
    
    # Confirm before pushing
    confirm = input("\n❓ Proceed with pushing data? (y/n): ").lower().strip()
    if confirm != 'y':
        print("❌ Operation cancelled")
        return
    
    # Push data to sheet
    success = push_data_to_sheet(service, data)
    
    if success:
        print("\n🎉 Story data successfully pushed to Google Sheets!")
        print("🔗 View your sheet at:")
        print(f"   https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit")
        print("\n📝 Next steps:")
        print("1. Verify the data in your Google Sheet")
        print("2. Run your ElevenLabs audio generation")
        print("3. Upload generated audio files to your GitHub repo")
    else:
        print("\n❌ Failed to push data to Google Sheets")

if __name__ == "__main__":
    main()