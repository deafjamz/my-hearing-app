import os
import requests
import pandas as pd
from google.auth import default
from googleapiclient.discovery import build
import csv

# --- CONFIGURATION ---
# This ID should be loaded from env or config, but for now we'll ask the user or use a placeholder
# You mentioned the sheet URL in previous context, I will try to find it or ask for it.
# For now, I will use a placeholder and expect the user to set it or I'll try to find it in other scripts.
SPREADSHEET_ID = "1CNDRfgqSdMEyc0JgW6DerCRX1jUftWSX49nsiBPUbek" # Extracted from generate_missing_audio.py logic if available, else needs input
OUTPUT_DIR = "content/source_csvs"

SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly']

def get_google_creds():
    """
    Attempts to get Google Credentials. 
    1. Looks for standard GOOGLE_APPLICATION_CREDENTIALS
    2. Fails gracefully if not found (user might need to run this locally with personal creds)
    """
    try:
        creds, _ = default(scopes=SCOPES)
        return creds
    except Exception as e:
        print("⚠️ Could not load default Google Cloud credentials.")
        print("   If running locally, ensure you have set up 'gcloud auth application-default login'.")
        return None

def download_sheet_as_csv(service, sheet_name, output_path):
    print(f"   -> Downloading '{sheet_name}'...")
    try:
        # Get data from the sheet
        result = service.spreadsheets().values().get(
            spreadsheetId=SPREADSHEET_ID, range=sheet_name).execute()
        values = result.get('values', [])

        if not values:
            print(f"      ⚠️ No data found in '{sheet_name}'.")
            return

        # Write to CSV
        with open(output_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerows(values)
        print(f"      ✅ Saved to {output_path}")

    except Exception as e:
        print(f"      ❌ Error downloading '{sheet_name}': {e}")

def main():
    print("🔄 SYNC CONTENT: Google Sheets -> Local CSVs")
    print("=" * 60)

    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)

    creds = get_google_creds()
    if not creds:
        print("❌ Authorization required. Cannot sync.")
        return

    try:
        service = build('sheets', 'v4', credentials=creds)
        
        # Define the tabs we want to sync (Gen 2 Structure)
        # Note: We map the Sheet Name to the Target CSV Name
        tabs_to_sync = {
            'Words': 'words_master.csv',
            'Sentences': 'sentences_master.csv',
            'Stories': 'stories_master.csv',
            'Scenarios': 'scenarios_master.csv',
            'Keywords': 'keywords_master.csv' # Legacy support
        }

        # Get spreadsheet metadata to verify tabs exist
        sheet_metadata = service.spreadsheets().get(spreadsheetId=SPREADSHEET_ID).execute()
        sheets = sheet_metadata.get('sheets', '')
        available_titles = [s['properties']['title'] for s in sheets]

        for sheet_title, csv_name in tabs_to_sync.items():
            if sheet_title in available_titles:
                download_sheet_as_csv(service, sheet_title, os.path.join(OUTPUT_DIR, csv_name))
            else:
                print(f"   ⚠️ Sheet '{sheet_title}' not found in spreadsheet.")

    except Exception as e:
        print(f"❌ Critical Error: {e}")

if __name__ == "__main__":
    main()
