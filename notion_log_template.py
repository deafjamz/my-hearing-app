#!/usr/bin/env python3
"""
NOTION PROJECT LOG TEMPLATE
Copy and modify this template for logging development sessions to Notion

INSTRUCTIONS:
1. Copy this file and rename it (e.g., log_new_feature_session.py)
2. Update the session_data dictionary with your session details
3. Run: python3 your_script_name.py
"""

import sys
import os
sys.path.append('/Users/clyle/Desktop/Desktop:Hearing Rehab')

from dotenv import load_dotenv
from notion_logger import quick_log_session

# Load environment variables from existing .env file
load_dotenv('/Users/clyle/Desktop/Desktop:Hearing Rehab/.env')

def log_session():
    """Log development session to Notion - MODIFY THIS DATA"""
    
    print("📝 LOGGING SESSION TO NOTION")
    print("=" * 50)
    
    # Check environment variables
    required_vars = [
        'NOTION_TOKEN',
        'NOTION_PROJECT_LOG_DB_ID', 
        'NOTION_FEATURES_DB_ID',
        'NOTION_EXPENSES_DB_ID',
        'NOTION_USER_FEEDBACK_DB_ID'
    ]
    
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    if missing_vars:
        print(f"❌ Missing environment variables: {missing_vars}")
        print("Make sure your .env file is in /Users/clyle/Desktop/Desktop:Hearing Rehab/.env")
        return False
    
    print("✅ All environment variables found")
    
    # 🚨 MODIFY THIS SESSION DATA FOR YOUR SPECIFIC SESSION 🚨
    session_title = "REPLACE: Your Session Title Here"
    session_duration = 120  # Duration in minutes
    session_type = "Development"  # Development|Bug Fix|Planning|Research|Deployment
    session_topics = [
        "REPLACE: Topic 1",
        "REPLACE: Topic 2", 
        "REPLACE: Topic 3"
    ]
    session_decisions = "REPLACE: Key decisions and breakthroughs from this session"
    session_action_items = "REPLACE:\n1. Next step\n2. Another step\n3. Final step"
    session_costs = 0.0  # Any expenses incurred
    session_notes = "REPLACE: Additional context, achievements, and technical details"
    
    # Log to Notion using correct parameter structure
    try:
        result = quick_log_session(
            title=session_title,
            duration_minutes=session_duration,
            session_type=session_type,
            topics=session_topics,
            decisions=session_decisions,
            action_items=session_action_items,
            conversation_url="https://claude.ai/chat/current-session",
            costs=session_costs,
            notes=session_notes
        )
        
        # Check for successful logging (Notion API returns object with 'id' field)
        if result and 'id' in result:
            print("🎉 SESSION LOGGED SUCCESSFULLY!")
            print("=" * 50)
            print(f"📊 Title: {session_title}")
            print(f"⏱️  Duration: {session_duration} minutes")
            print(f"💰 Cost: ${session_costs}")
            print(f"📝 Notion page ID: {result['id']}")
            print("")
            print("✅ Check your Notion Project Log database for the new entry!")
            return True
            
        else:
            print(f"❌ Unexpected result format: {result}")
            return False
            
    except Exception as e:
        print(f"❌ Error logging to Notion: {e}")
        return False

if __name__ == "__main__":
    print("🚨 REMINDER: Update session data before running!")
    print("This template contains placeholder data that needs to be replaced.")
    print("")
    
    # Ask for confirmation to prevent accidental logging of template data
    response = input("Have you updated the session data? (y/N): ").lower().strip()
    
    if response == 'y' or response == 'yes':
        success = log_session()
        if success:
            print("\n🎯 Session documentation complete!")
        else:
            print("\n❌ Logging failed - check errors above")
    else:
        print("\n📝 Please update the session data in this script first:")
        print("- session_title")
        print("- session_duration") 
        print("- session_type")
        print("- session_topics")
        print("- session_decisions")
        print("- session_action_items")
        print("- session_costs")
        print("- session_notes")
        print("\nThen run the script again.")