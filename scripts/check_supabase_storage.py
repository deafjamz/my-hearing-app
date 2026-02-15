#!/usr/bin/env python3
"""
Check Supabase Storage buckets and list files
"""
import os
from supabase import create_client, Client

# --- Custom .env Loader ---
def get_key_from_env_file(key_name, file_path=".env"):
    if not os.path.exists(file_path):
        return None
    with open(file_path, "r") as f:
        for line in f:
            line = line.strip()
            if line.startswith(f'{key_name}='):
                return line.split('=', 1)[1].strip()
    return None

# --- CONFIGURATION ---
SUPABASE_URL = get_key_from_env_file("SUPABASE_URL")
SUPABASE_KEY = get_key_from_env_file("SUPABASE_SERVICE_ROLE_KEY")

if not all([SUPABASE_URL, SUPABASE_KEY]):
    print("❌ Error: Missing Supabase credentials")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def check_bucket(bucket_name):
    """Check files in a bucket"""
    print(f"\n📦 Checking bucket: {bucket_name}")
    print("=" * 60)

    try:
        # List all files in the bucket
        files = supabase.storage.from_(bucket_name).list()

        if not files:
            print(f"   ⚠️ Bucket '{bucket_name}' is empty")
            return

        print(f"   Found {len(files)} items:")
        for file in files[:10]:  # Show first 10
            print(f"   - {file['name']}")

        if len(files) > 10:
            print(f"   ... and {len(files) - 10} more files")

    except Exception as e:
        print(f"   ❌ Error accessing bucket: {e}")

if __name__ == "__main__":
    print("🔍 Checking Supabase Storage Buckets")
    print("=" * 60)

    check_bucket("audio")
    check_bucket("alignment")

    print("\n✅ Done!")
