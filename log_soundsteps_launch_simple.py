#!/usr/bin/env python3
"""
Log SoundSteps Launch Session to Notion
Uses existing notion_logger.py system
"""

import sys
import os
sys.path.append('/Users/clyle/Desktop/Desktop:Hearing Rehab')

from dotenv import load_dotenv
from notion_logger import quick_log_session, NotionLogger

# Load environment variables from .env file
load_dotenv('/Users/clyle/Desktop/Desktop:Hearing Rehab/.env')

def log_soundsteps_launch():
    """Log the SoundSteps launch milestone to Notion"""
    
    print("🚀 SOUNDSTEPS LAUNCH SESSION")
    print("=" * 80)
    
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
    
    # Session data for the major SoundSteps launch milestone
    session_data = {
        "title": "🚀 SoundSteps Launch: Audio Fix & Professional Domain Deployment",
        "duration_minutes": 180,  # 3 hours debugging and deployment
        "session_type": "Critical Bug Fix & Production Deployment",
        "topics": [
            "Audio Loading Issue Root Cause Analysis",
            "Voice Folder Mapping Fix (female_audio/male_audio)",
            "GitHub Repository Audio File Verification", 
            "Professional Domain Acquisition (soundsteps.app)",
            "Netlify Production Deployment",
            "SSL Certificate & DNS Configuration",
            "Brand Strategy & Multi-Platform Planning",
            "Beta Testing Preparation"
        ],
        "decisions": "MAJOR BREAKTHROUGH: Identified and fixed critical audio loading issue. App was looking for voice-specific folders (sarah_audio/, david_audio/) but repository used generic folders (female_audio/, male_audio/). Implemented voice folder mapping system. Chose 'SoundSteps' as official brand name and secured soundsteps.app domain. Deployed to production with professional infrastructure (Netlify + custom domain + SSL). App now fully functional for CI community beta testing.",
        "action_items": "1. Begin beta testing with friends and family\n2. Gather feedback from CI user community\n3. Document user testing results\n4. Plan iOS/Android app development\n5. Consider reaching out to local audiologists\n6. Implement user feedback improvements\n7. Prepare for broader community release",
        "conversation_url": "https://claude.ai/chat/current-session",
        "costs": 15.0,  # Domain registration cost
        "notes": "CRITICAL MILESTONE: SoundSteps is now LIVE at https://soundsteps.app with full audio functionality! Audio issue was architectural - voice folder mismatch between app expectations and repository structure. Fixed with elegant voice mapping solution. Professional domain establishes credibility for sharing with CI community. This represents transition from development to beta testing phase. Ready for real-world validation with target users."
    }
    
    # Feature data for the SoundSteps launch infrastructure
    feature_data = {
        "name": "SoundSteps Production Launch & Audio Infrastructure Fix",
        "priority": "Critical",
        "status": "LIVE - Production Ready",
        "effort_estimate": 120,  # 2 hours estimated
        "actual_time": 180,     # 3 hours actual
        "user_impact": "Critical - App Now Functional",
        "technical_notes": "Root cause: App constructed voice folders as ${selectedVoice}_audio (sarah_audio) but repository used female_audio/male_audio. Implemented voice folder mapping in 3 locations: loadScenarioAudio(), loadStoryQuestion(), and loadQuestion(). Updated enhanced story audioFiles object. All audio now loads correctly from jsDelivr CDN. Professional deployment: soundsteps.app domain with Netlify hosting, SSL certificate, global CDN. Total infrastructure cost: $15/year vs $300/year with traditional hosting.",
        "category": "Critical Infrastructure",
        "dependencies": "Namecheap domain, Netlify hosting, GitHub Pages, jsDelivr CDN, hearing-rehab-audio repository"
    }
    
    # Log using existing system with correct parameters
    try:
        result = quick_log_session(
            title=session_data['title'],
            duration_minutes=session_data['duration_minutes'], 
            session_type=session_data['session_type'],
            topics=session_data['topics'],
            decisions=session_data['decisions'],
            action_items=session_data['action_items'],
            conversation_url=session_data.get('conversation_url', ''),
            costs=session_data.get('costs', 0.0),
            notes=session_data.get('notes', '')
        )
        
        if result and 'id' in result:
            print("🎉 SOUNDSTEPS LAUNCH SESSION LOGGED TO NOTION!")
            print("=" * 80)
            print(f"📊 Session: {session_data['title']}")
            print(f"⏱️  Duration: {session_data['duration_minutes']} minutes")
            print(f"💰 Cost: ${session_data['costs']}")
            print(f"🌟 Status: SoundSteps LIVE at https://soundsteps.app")
            print("")
            print("🎯 MAJOR ACHIEVEMENTS LOGGED:")
            print("• ✅ Fixed critical audio loading issue")
            print("• ✅ Professional domain secured and deployed") 
            print("• ✅ Brand strategy established (SoundSteps)")
            print("• ✅ Production infrastructure complete")
            print("• ✅ Ready for CI community beta testing")
            print("")
            print("🚀 This milestone marks the transition from development to real-world validation!")
            print(f"📝 Notion page ID: {result['id']}")
            
        else:
            print(f"❌ Unexpected result format: {result}")
            
    except Exception as e:
        print(f"❌ Error logging to Notion: {e}")
        print("\n📋 Session data for manual logging:")
        print("Session:", session_data)
        print("Feature:", feature_data)

if __name__ == "__main__":
    log_soundsteps_launch()