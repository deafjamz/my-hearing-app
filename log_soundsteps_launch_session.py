#!/usr/bin/env python3
"""
SOUNDSTEPS LAUNCH SESSION - Notion Project Log Update
Major milestone: Fixed audio loading issues and launched SoundSteps at professional domain
"""

import os
import json
from datetime import datetime
import requests

def get_soundsteps_launch_session_data():
    """Returns session data for the SoundSteps launch milestone"""
    
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
    
    return session_data

def get_soundsteps_launch_feature_data():
    """Returns feature data for the SoundSteps launch"""
    
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
    
    return feature_data

def log_to_notion():
    """Log the session to Notion using environment variables"""
    
    # Check for .env file
    env_path = '.env'
    if not os.path.exists(env_path):
        print("❌ .env file not found. Please create .env with NOTION_TOKEN and DATABASE_ID")
        return False
    
    # Load environment variables from .env file
    with open(env_path, 'r') as f:
        for line in f:
            line = line.strip()
            if line and '=' in line and not line.startswith('#'):
                key, value = line.split('=', 1)
                os.environ[key] = value.strip().strip('"').strip("'")
    
    notion_token = os.getenv('NOTION_TOKEN')
    database_id = os.getenv('DATABASE_ID') 
    
    if not notion_token or not database_id:
        print("❌ Missing NOTION_TOKEN or DATABASE_ID in .env file")
        return False
    
    # Prepare session data
    session_data = get_soundsteps_launch_session_data()
    feature_data = get_soundsteps_launch_feature_data()
    
    headers = {
        "Authorization": f"Bearer {notion_token}",
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28"
    }
    
    # Create page payload
    payload = {
        "parent": {"database_id": database_id},
        "properties": {
            "Title": {
                "title": [{"text": {"content": session_data["title"]}}]
            },
            "Duration": {
                "number": session_data["duration_minutes"]
            },
            "Type": {
                "select": {"name": session_data["session_type"]}
            },
            "Status": {
                "select": {"name": "Complete"}
            },
            "Date": {
                "date": {"start": datetime.now().isoformat()}
            },
            "Cost": {
                "number": session_data["costs"]
            }
        },
        "children": [
            {
                "object": "block",
                "type": "heading_2",
                "heading_2": {
                    "rich_text": [{"type": "text", "text": {"content": "🎯 Session Overview"}}]
                }
            },
            {
                "object": "block", 
                "type": "paragraph",
                "paragraph": {
                    "rich_text": [{"type": "text", "text": {"content": session_data["decisions"]}}]
                }
            },
            {
                "object": "block",
                "type": "heading_3", 
                "heading_3": {
                    "rich_text": [{"type": "text", "text": {"content": "Topics Covered"}}]
                }
            },
            {
                "object": "block",
                "type": "bulleted_list_item",
                "bulleted_list_item": {
                    "rich_text": [{"type": "text", "text": {"content": "Audio Loading Issue Root Cause Analysis"}}]
                }
            },
            {
                "object": "block",
                "type": "bulleted_list_item", 
                "bulleted_list_item": {
                    "rich_text": [{"type": "text", "text": {"content": "Voice Folder Mapping Fix Implementation"}}]
                }
            },
            {
                "object": "block",
                "type": "bulleted_list_item",
                "bulleted_list_item": {
                    "rich_text": [{"type": "text", "text": {"content": "Professional Domain & Production Deployment"}}]
                }
            },
            {
                "object": "block",
                "type": "bulleted_list_item",
                "bulleted_list_item": {
                    "rich_text": [{"type": "text", "text": {"content": "SoundSteps Brand Strategy & Multi-Platform Planning"}}]
                }
            },
            {
                "object": "block",
                "type": "heading_3",
                "heading_3": {
                    "rich_text": [{"type": "text", "text": {"content": "🚀 Major Achievement"}}]
                }
            },
            {
                "object": "block",
                "type": "callout",
                "callout": {
                    "rich_text": [{"type": "text", "text": {"content": "SoundSteps is now LIVE at https://soundsteps.app with full audio functionality! Ready for CI community beta testing."}}],
                    "icon": {"emoji": "🎉"}
                }
            },
            {
                "object": "block",
                "type": "heading_3",
                "heading_3": {
                    "rich_text": [{"type": "text", "text": {"content": "Next Steps"}}]
                }
            },
            {
                "object": "block",
                "type": "paragraph",
                "paragraph": {
                    "rich_text": [{"type": "text", "text": {"content": session_data["action_items"]}}]
                }
            },
            {
                "object": "block",
                "type": "heading_3",
                "heading_3": {
                    "rich_text": [{"type": "text", "text": {"content": "Technical Notes"}}]
                }
            },
            {
                "object": "block",
                "type": "paragraph",
                "paragraph": {
                    "rich_text": [{"type": "text", "text": {"content": feature_data["technical_notes"]}}]
                }
            }
        ]
    }
    
    # Send to Notion
    try:
        response = requests.post(
            f"https://api.notion.com/v1/pages",
            headers=headers,
            json=payload
        )
        
        if response.status_code == 200:
            print("✅ Successfully logged SoundSteps launch session to Notion!")
            print(f"📊 Session: {session_data['title']}")
            print(f"⏱️  Duration: {session_data['duration_minutes']} minutes")
            print(f"💰 Cost: ${session_data['costs']}")
            print(f"🔗 Page created in your Notion database")
            return True
        else:
            print(f"❌ Failed to log to Notion: {response.status_code}")
            print(f"Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error logging to Notion: {e}")
        return False

def print_summary():
    """Print a session summary"""
    
    session_data = get_soundsteps_launch_session_data()
    
    print("🚀 SOUNDSTEPS LAUNCH SESSION")
    print("=" * 80)
    print(f"📅 Date: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print(f"⏱️  Duration: {session_data['duration_minutes']} minutes")
    print(f"💰 Cost: ${session_data['costs']}")
    print("")
    
    print("🎯 MAJOR ACHIEVEMENTS:")
    print("• ✅ Fixed critical audio loading issue")
    print("• ✅ Implemented voice folder mapping system") 
    print("• ✅ Secured soundsteps.app professional domain")
    print("• ✅ Deployed to production with SSL & CDN")
    print("• ✅ App fully functional for CI community")
    print("• ✅ Ready for beta testing phase")
    print("")
    
    print("🔧 TECHNICAL FIXES:")
    print("• Root cause: Voice folder naming mismatch")
    print("• Solution: Voice mapping (sarah→female_audio, david→male_audio)")
    print("• Infrastructure: Netlify + Namecheap + SSL")
    print("• Performance: Global CDN + auto-deployments")
    print("")
    
    print("🌟 MILESTONE:")
    print("🎉 SoundSteps is LIVE at https://soundsteps.app")
    print("Ready for real-world validation with CI users!")
    print("=" * 80)

if __name__ == "__main__":
    print_summary()
    print("\n🔄 Logging to Notion...")
    
    if log_to_notion():
        print("\n🎉 SoundSteps launch session successfully logged!")
    else:
        print("\n📋 Manual logging data:")
        print("Session data:", json.dumps(get_soundsteps_launch_session_data(), indent=2))
        print("Feature data:", json.dumps(get_soundsteps_launch_feature_data(), indent=2))