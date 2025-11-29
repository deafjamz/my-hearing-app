import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Try to select one row and see the keys
try:
    response = supabase.table("stories").select("*").limit(1).execute()
    if response.data:
        print("Columns in 'stories' table:")
        print(response.data[0].keys())
    else:
        print("Table 'stories' is empty, cannot inspect columns easily via select.")
except Exception as e:
    print(f"Error selecting from stories: {e}")
