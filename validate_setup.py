import os
# from dotenv import load_dotenv # Removing dependency
from supabase import create_client, Client

def load_env_manual(filepath=".env"):
    """Manually parses a .env file."""
    if not os.path.exists(filepath):
        return
    with open(filepath, "r") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" in line:
                key, value = line.split("=", 1)
                # Strip quotes if present
                value = value.strip().strip("'").strip('"')
                os.environ[key.strip()] = value

# Load env manually
load_env_manual()

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

print("🔍 Validating Supabase Connection...")

if not url or not key:
    print("❌ FAILED: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env file.")
    exit(1)

try:
    supabase: Client = create_client(url, key)
    print("✅ Connection initialized.")
except Exception as e:
    print(f"❌ FAILED: Could not initialize client. Error: {e}")
    # Fallback to verify if module is even loadable
    exit(1)

# 1. Validate Tables
tables = ["word_pairs", "stories", "scenarios", "scenario_items"]
print("\n🔍 Checking Database Tables...")
all_tables_ok = True
for table in tables:
    try:
        # Try to select 1 row. If table doesn't exist, this usually throws an error.
        response = supabase.table(table).select("*").limit(1).execute()
        print(f"   ✅ Table '{table}' exists.")
    except Exception as e:
        print(f"   ❌ Table '{table}' NOT found or inaccessible. Error: {e}")
        all_tables_ok = False

# 2. Validate Storage Buckets
buckets_to_check = ["audio", "alignment"]
print("\n🔍 Checking Storage Buckets...")
all_buckets_ok = True
try:
    response = supabase.storage.list_buckets()
    existing_buckets = [b.name for b in response]
    
    for b in buckets_to_check:
        if b in existing_buckets:
            print(f"   ✅ Bucket '{b}' exists.")
        else:
            print(f"   ❌ Bucket '{b}' NOT found.")
            all_buckets_ok = False
except Exception as e:
    print(f"   ❌ Could not list buckets. Error: {e}")
    all_buckets_ok = False

print("\n" + "="*30)
if all_tables_ok and all_buckets_ok:
    print("🎉 SUCCESS: Supabase is ready for production!")
else:
    print("⚠️ SETUP INCOMPLETE: Please fix the missing items above.")