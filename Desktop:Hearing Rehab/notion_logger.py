import requests
import json
from datetime import datetime
import os
from typing import Dict, List, Optional

class NotionLogger:
    def __init__(self, notion_token: str, project_log_db_id: str, features_db_id: str, 
                 expenses_db_id: str, user_feedback_db_id: str):
        self.token = notion_token
        self.project_log_db_id = project_log_db_id
        self.features_db_id = features_db_id
        self.expenses_db_id = expenses_db_id
        self.user_feedback_db_id = user_feedback_db_id
        
        self.headers = {
            "Authorization": f"Bearer {notion_token}",
            "Content-Type": "application/json",
            "Notion-Version": "2022-06-28"
        }
    
    def log_session(self, session_data: Dict) -> Dict:
        """Log a development session to the Project Log database"""
        url = "https://api.notion.com/v1/pages"
        
        payload = {
            "parent": {"database_id": self.project_log_db_id},
            "properties": {
                "Title": {
                    "title": [{"text": {"content": session_data.get("title", f"Session {datetime.now().strftime('%Y-%m-%d')}")}}]
                },
                "Date": {
                    "date": {"start": session_data.get("date", datetime.now().isoformat())}
                },
                "Duration (min)": {
                    "number": session_data.get("duration_minutes", 0)
                },
                "Session Type": {
                    "select": {"name": session_data.get("session_type", "Development")}
                },
                "Topics": {
                    "multi_select": [{"name": topic} for topic in session_data.get("topics", [])]
                },
                "Key Decisions": {
                    "rich_text": [{"text": {"content": session_data.get("decisions", "")}}]
                },
                "Action Items": {
                    "rich_text": [{"text": {"content": session_data.get("action_items", "")}}]
                },
                "Conversation URL": {
                    "url": session_data.get("conversation_url")
                },
                "Session Cost": {
                    "number": session_data.get("costs", 0.0)
                },
                "Notes": {
                    "rich_text": [{"text": {"content": session_data.get("notes", "")}}]
                }
            }
        }
        
        response = requests.post(url, headers=self.headers, json=payload)
        if response.status_code == 200:
            print(f"✅ Session logged successfully: {session_data.get('title')}")
        else:
            print(f"❌ Error logging session: {response.status_code} - {response.text}")
        return response.json()

    def create_feature_task(self, task_data: Dict) -> Dict:
        """Create a feature/task in the Features database"""
        url = "https://api.notion.com/v1/pages"
        
        payload = {
            "parent": {"database_id": self.features_db_id},
            "properties": {
                "Feature Name": {
                    "title": [{"text": {"content": task_data.get("name", "Untitled Feature")}}]
                },
                "Priority": {
                    "select": {"name": task_data.get("priority", "Medium")}
                },
                "Status": {
                    "select": {"name": task_data.get("status", "Backlog")}
                },
                "Effort Estimate (hours)": {
                    "number": task_data.get("effort_estimate", 0)
                },
                "Actual Time (hours)": {
                    "number": task_data.get("actual_time", 0)
                },
                "User Impact": {
                    "select": {"name": task_data.get("user_impact", "Medium")}
                },
                "Technical Notes": {
                    "rich_text": [{"text": {"content": task_data.get("technical_notes", "")}}]
                },
                "Dependencies": {
                    "rich_text": [{"text": {"content": task_data.get("dependencies", "")}}]
                },
                "Category": {
                    "select": {"name": task_data.get("category", "Feature")}
                }
            }
        }
        
        response = requests.post(url, headers=self.headers, json=payload)
        if response.status_code == 200:
            print(f"✅ Feature created: {task_data.get('name')}")
        else:
            print(f"❌ Error creating feature: {response.status_code} - {response.text}")
        return response.json()

    def log_expense(self, expense_data: Dict) -> Dict:
        """Log an expense to financial tracking database"""
        url = "https://api.notion.com/v1/pages"
        
        payload = {
            "parent": {"database_id": self.expenses_db_id},
            "properties": {
                "Description": {
                    "title": [{"text": {"content": expense_data.get("description", "Expense")}}]
                },
                "Date": {
                    "date": {"start": expense_data.get("date", datetime.now().isoformat())}
                },
                "Amount": {
                    "number": expense_data.get("amount", 0.0)
                },
                "Category": {
                    "select": {"name": expense_data.get("category", "Development")}
                },
                "Expense Type": {
                    "select": {"name": expense_data.get("expense_type", "Subscription")}
                },
                "Receipt/Documentation": {
                    "url": expense_data.get("receipt_url")
                },
                "Notes": {
                    "rich_text": [{"text": {"content": expense_data.get("notes", "")}}]
                },
                "Tax Deductible": {
                    "checkbox": expense_data.get("tax_deductible", True)
                }
            }
        }
        
        response = requests.post(url, headers=self.headers, json=payload)
        if response.status_code == 200:
            print(f"✅ Expense logged: ${expense_data.get('amount')} - {expense_data.get('description')}")
        else:
            print(f"❌ Error logging expense: {response.status_code} - {response.text}")
        return response.json()

    def log_user_feedback(self, feedback_data: Dict) -> Dict:
        """Log user feedback and testing results"""
        url = "https://api.notion.com/v1/pages"
        
        payload = {
            "parent": {"database_id": self.user_feedback_db_id},
            "properties": {
                "Feedback Summary": {
                    "title": [{"text": {"content": feedback_data.get("summary", "User Feedback")}}]
                },
                "Date": {
                    "date": {"start": feedback_data.get("date", datetime.now().isoformat())}
                },
                "User Type": {
                    "select": {"name": feedback_data.get("user_type", "CI User")}
                },
                "Priority": {
                    "select": {"name": feedback_data.get("priority", "Medium")}
                },
                "Feedback Type": {
                    "select": {"name": feedback_data.get("feedback_type", "General")}
                },
                "Feature Requests": {
                    "rich_text": [{"text": {"content": feedback_data.get("feature_requests", "")}}]
                },
                "Issues Reported": {
                    "rich_text": [{"text": {"content": feedback_data.get("issues", "")}}]
                },
                "Action Status": {
                    "select": {"name": feedback_data.get("status", "New")}
                },
                "Full Feedback": {
                    "rich_text": [{"text": {"content": feedback_data.get("full_feedback", "")}}]
                }
            }
        }
        
        response = requests.post(url, headers=self.headers, json=payload)
        if response.status_code == 200:
            print(f"✅ User feedback logged: {feedback_data.get('summary')}")
        else:
            print(f"❌ Error logging feedback: {response.status_code} - {response.text}")
        return response.json()

    def bulk_create_initial_features(self) -> None:
        """Create the initial feature backlog from our planning session"""
        initial_features = [
            {
                "name": "Audio Preloading",
                "priority": "High",
                "status": "Backlog",
                "effort_estimate": 4,
                "user_impact": "High",
                "technical_notes": "Implement preloading of next audio file to reduce waiting time",
                "category": "Performance"
            },
            {
                "name": "Progress Persistence",
                "priority": "High", 
                "status": "Backlog",
                "effort_estimate": 3,
                "user_impact": "High",
                "technical_notes": "Use localStorage to save user progress between sessions",
                "category": "User Experience"
            },
            {
                "name": "Backup Audio Hosting",
                "priority": "Medium",
                "status": "Backlog", 
                "effort_estimate": 6,
                "user_impact": "Medium",
                "technical_notes": "Set up reliable CDN (AWS S3 + CloudFront) to replace GitHub hosting",
                "category": "Infrastructure"
            },
            {
                "name": "Error Reporting System",
                "priority": "Medium",
                "status": "Backlog",
                "effort_estimate": 5,
                "user_impact": "Medium", 
                "technical_notes": "Add client-side error logging and reporting to catch user issues",
                "category": "Development"
            },
            {
                "name": "Expand Keyword Activities",
                "priority": "High",
                "status": "Backlog",
                "effort_estimate": 8,
                "user_impact": "High",
                "technical_notes": "Create additional keyword exercise sets (currently only 1 vs 10 for other types)",
                "category": "Content"
            },
            {
                "name": "Custom Voice Cloning Integration",
                "priority": "High",
                "status": "Backlog", 
                "effort_estimate": 20,
                "user_impact": "Very High",
                "technical_notes": "Allow users to upload family member voices for personalized training",
                "category": "Core Feature"
            },
            {
                "name": "User Account System",
                "priority": "Medium",
                "status": "Backlog",
                "effort_estimate": 15,
                "user_impact": "High",
                "technical_notes": "Implement user registration, login, and progress tracking across devices",
                "category": "Infrastructure"
            },
            {
                "name": "Therapist Dashboard", 
                "priority": "Low",
                "status": "Backlog",
                "effort_estimate": 25,
                "user_impact": "Medium",
                "technical_notes": "Admin interface for audiologists to manage patient progress",
                "category": "Business Feature"
            }
        ]
        
        print("Creating initial feature backlog...")
        for feature in initial_features:
            self.create_feature_task(feature)

# Convenience function for easy session logging
def quick_log_session(title: str, duration_minutes: int, session_type: str, 
                     topics: List[str], decisions: str, action_items: str,
                     conversation_url: str = "", costs: float = 0.0, notes: str = ""):
    """Quick function to log a session with environment variables for tokens"""
    
    # These will need to be set as environment variables or in a config file
    notion_token = os.getenv('NOTION_TOKEN')
    project_log_db_id = os.getenv('NOTION_PROJECT_LOG_DB_ID')
    features_db_id = os.getenv('NOTION_FEATURES_DB_ID') 
    expenses_db_id = os.getenv('NOTION_EXPENSES_DB_ID')
    user_feedback_db_id = os.getenv('NOTION_USER_FEEDBACK_DB_ID')
    
    if not all([notion_token, project_log_db_id, features_db_id, expenses_db_id, user_feedback_db_id]):
        print("❌ Missing required environment variables. Please set:")
        print("   NOTION_TOKEN, NOTION_PROJECT_LOG_DB_ID, NOTION_FEATURES_DB_ID,")
        print("   NOTION_EXPENSES_DB_ID, NOTION_USER_FEEDBACK_DB_ID")
        return
    
    logger = NotionLogger(notion_token, project_log_db_id, features_db_id, 
                         expenses_db_id, user_feedback_db_id)
    
    session_data = {
        "title": title,
        "duration_minutes": duration_minutes,
        "session_type": session_type,
        "topics": topics,
        "decisions": decisions,
        "action_items": action_items,
        "conversation_url": conversation_url,
        "costs": costs,
        "notes": notes
    }
    
    return logger.log_session(session_data)

# Usage Examples:
if __name__ == "__main__":
    # Example 1: Log our current planning session
    quick_log_session(
        title="MVP Review & Project Setup",
        duration_minutes=60,
        session_type="Planning",
        topics=["MVP Code Review", "Architecture Analysis", "Project Management Setup", "Notion Automation"],
        decisions="Chose Notion for project management, Claude Code for development, prioritized audio preloading",
        action_items="1. Set up Notion databases\n2. Implement audio preloading\n3. Add progress persistence\n4. Create beta testing plan",
        conversation_url="https://claude.ai/chat/[conversation-id]",
        costs=0.0,
        notes="Strong technical foundation identified. Ready for systematic improvements."
    )
    
    # Example 2: Log an expense
    # logger = NotionLogger(token, proj_db, feat_db, exp_db, feedback_db)
    # logger.log_expense({
    #     "description": "ElevenLabs Creator Plan",
    #     "amount": 22.00,
    #     "category": "Development",
    #     "expense_type": "Monthly Subscription", 
    #     "notes": "API costs for voice generation",
    #     "tax_deductible": True
    # })