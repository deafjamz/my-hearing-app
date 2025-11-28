#!/usr/bin/env python3
"""
Test script for Notion integration - logs our current session
"""

import os
from dotenv import load_dotenv
from notion_logger import quick_log_session, NotionLogger

# Load environment variables
load_dotenv()

def test_session_logging():
    """Test logging our current planning session"""
    print("🧪 Testing session logging...")
    
    try:
        # Log our current conversation
        result = quick_log_session(
            title="MVP Review & Notion Workspace Setup",
            duration_minutes=120,  # Adjust based on actual time
            session_type="Planning",
            topics=["MVP Code Review", "Architecture Analysis", "Notion Setup", "Project Management", "API Integration", "Database Configuration"],
            decisions="Set up comprehensive Notion workspace with 4 databases for project tracking and IP protection. Created automated logging system with Python integration. Prioritized audio preloading as first technical improvement.",
            action_items="1. Test Notion automation script\n2. Begin audio preloading implementation with Claude Code\n3. Create beta user recruitment plan\n4. Log ElevenLabs monthly expense\n5. Set up recurring expense tracking",
            conversation_url="https://claude.ai/chat/[current-conversation-id]",
            costs=0.0,
            notes="Successfully created all 4 Notion databases with proper field configurations. Integration token and database IDs configured. Ready for systematic development tracking and legal IP protection."
        )
        print("✅ Session logged successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error logging session: {e}")
        return False

def test_expense_logging():
    """Test logging an expense"""
    print("\n💰 Testing expense logging...")
    
    try:
        # Create logger instance
        logger = NotionLogger(
            os.getenv('NOTION_TOKEN'),
            os.getenv('NOTION_PROJECT_LOG_DB_ID'),
            os.getenv('NOTION_FEATURES_DB_ID'),
            os.getenv('NOTION_EXPENSES_DB_ID'),
            os.getenv('NOTION_USER_FEEDBACK_DB_ID')
        )
        
        # Log ElevenLabs subscription
        result = logger.log_expense({
            "description": "ElevenLabs Creator Plan - December 2024",
            "amount": 22.00,
            "category": "Development",
            "expense_type": "Monthly Subscription",
            "notes": "Voice generation API for hearing rehabilitation exercises. Currently generating ~300 audio files across 30 exercise sets.",
            "tax_deductible": True
        })
        print("✅ Expense logged successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error logging expense: {e}")
        return False

def test_feature_creation():
    """Test creating initial features"""
    print("\n🚀 Testing feature creation...")
    
    try:
        logger = NotionLogger(
            os.getenv('NOTION_TOKEN'),
            os.getenv('NOTION_PROJECT_LOG_DB_ID'),
            os.getenv('NOTION_FEATURES_DB_ID'),
            os.getenv('NOTION_EXPENSES_DB_ID'),
            os.getenv('NOTION_USER_FEEDBACK_DB_ID')
        )
        
        # Create our highest priority feature
        result = logger.create_feature_task({
            "name": "Audio Preloading System",
            "priority": "High",
            "status": "Backlog",
            "effort_estimate": 4,
            "user_impact": "High",
            "technical_notes": "Implement preloading of next audio file while current one plays to eliminate loading delays. Critical for user experience improvement.",
            "category": "Performance",
            "dependencies": "None - can be implemented immediately"
        })
        print("✅ Feature created successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error creating feature: {e}")
        return False

def main():
    """Run all tests"""
    print("🎯 Starting Notion Integration Tests")
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
        print("Make sure your .env file is properly configured.")
        return
    
    print("✅ All environment variables found")
    
    # Run tests
    tests = [
        ("Session Logging", test_session_logging),
        ("Expense Logging", test_expense_logging), 
        ("Feature Creation", test_feature_creation)
    ]
    
    results = []
    for test_name, test_func in tests:
        print(f"\n📋 Running {test_name} test...")
        success = test_func()
        results.append((test_name, success))
    
    # Summary
    print("\n" + "="*50)
    print("🏁 TEST RESULTS SUMMARY")
    print("="*50)
    
    for test_name, success in results:
        status = "✅ PASSED" if success else "❌ FAILED"
        print(f"{test_name}: {status}")
    
    passed = sum(1 for _, success in results if success)
    total = len(results)
    
    if passed == total:
        print(f"\n🎉 All {total} tests passed! Your Notion integration is working perfectly.")
        print("\nNext steps:")
        print("1. Check your Notion databases - you should see new entries")
        print("2. Set up recurring expense tracking")
        print("3. Begin audio preloading implementation with Claude Code")
    else:
        print(f"\n⚠️  {passed}/{total} tests passed. Check the errors above and verify your configuration.")

if __name__ == "__main__":
    main()