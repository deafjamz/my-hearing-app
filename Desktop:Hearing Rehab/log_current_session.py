#!/usr/bin/env python3
"""
Log our current Google Sheets integration and QC system session
"""

import os
from dotenv import load_dotenv
from notion_logger import quick_log_session, NotionLogger

# Load environment variables from your config file
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
load_dotenv('projconfig.env')

# Debug: check if variables are loaded
print("🔍 Checking environment variables...")
for var in ['NOTION_TOKEN', 'NOTION_PROJECT_LOG_DB_ID', 'NOTION_FEATURES_DB_ID', 'NOTION_EXPENSES_DB_ID', 'NOTION_USER_FEEDBACK_DB_ID']:
    value = os.getenv(var)
    if value:
        print(f"✅ {var}: {value[:10]}...")
    else:
        print(f"❌ {var}: Not found")

def log_google_sheets_session():
    """Log our current session work"""
    print("📝 Logging Google Sheets Integration & QC System session...")
    
    try:
        result = quick_log_session(
            title="Google Sheets Integration & Audio Quality Control System",
            duration_minutes=120,
            session_type="Development",
            topics=[
                "Google Sheets API Integration", 
                "Admin QC Mode Implementation",
                "Navigation UX Improvements", 
                "Mobile QC Support",
                "Git Merge Conflict Resolution",
                "GitHub Pages Deployment",
                "Audio Quality Workflow Design"
            ],
            decisions="Implemented Google Sheets API for automatic audio quality tracking. Built admin QC mode with mobile support (triple-tap activation). Fixed navigation terminology (Activities→Categories, Levels→Exercises) for better user clarity. Resolved merge conflicts and deployed to GitHub Pages.",
            action_items="1. Complete Google Forms fallback integration\n2. Test mobile QC workflow end-to-end\n3. Create systematic audio regeneration process with ElevenLabs\n4. Document QC workflow in CLAUDE.md\n5. Plan beta testing with CI users",
            conversation_url="https://claude.ai/chat/current-session",
            costs=0.0,
            notes="Successfully built comprehensive audio quality control system. Users can now flag problematic audio in real-time, data goes directly to Google Sheets for systematic improvement. Mobile support via triple-tap activation. Navigation clarity improved significantly. Ready for systematic audio quality improvements."
        )
        print("✅ Session logged successfully to Notion!")
        return True
        
    except Exception as e:
        print(f"❌ Error logging session: {e}")
        return False

def create_qc_feature():
    """Create QC system as a new feature in Notion"""
    print("🚀 Creating QC System feature in Notion...")
    
    try:
        logger = NotionLogger(
            os.getenv('NOTION_TOKEN'),
            os.getenv('NOTION_PROJECT_LOG_DB_ID'),
            os.getenv('NOTION_FEATURES_DB_ID'),
            os.getenv('NOTION_EXPENSES_DB_ID'),
            os.getenv('NOTION_USER_FEEDBACK_DB_ID')
        )
        
        result = logger.create_feature_task({
            "name": "Audio Quality Control System",
            "priority": "High",
            "status": "Completed",
            "effort_estimate": 8,
            "actual_time": 8,
            "user_impact": "High",
            "technical_notes": "Built comprehensive QC system: Admin mode toggle, mobile support (triple-tap), Google Sheets integration, 8 issue types (unclear pronunciation, robotic voice, etc.), real-time flagging during exercises, automatic data export for systematic regeneration workflow.",
            "category": "Quality Assurance",
            "dependencies": "Google Sheets API, GitHub Pages deployment"
        })
        print("✅ QC Feature logged successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error creating feature: {e}")
        return False

def main():
    """Log everything from our session"""
    print("🎯 Logging Current Session to Notion")
    print("="*50)
    
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
        return
    
    print("✅ All environment variables found")
    
    # Log session and create feature
    session_success = log_google_sheets_session()
    feature_success = create_qc_feature()
    
    print("\n" + "="*50)
    print("📊 LOGGING RESULTS")
    print("="*50)
    print(f"Session Logging: {'✅ SUCCESS' if session_success else '❌ FAILED'}")
    print(f"Feature Creation: {'✅ SUCCESS' if feature_success else '❌ FAILED'}")
    
    if session_success and feature_success:
        print("\n🎉 Session successfully logged to Notion!")
        print("\nCheck your Notion workspace:")
        print("• Project Log: New session entry")
        print("• Features: Audio QC System marked as completed")
        print("\nNext: Test the QC system on GitHub Pages!")
    else:
        print("\n⚠️ Some logging failed. Check the errors above.")

if __name__ == "__main__":
    main()