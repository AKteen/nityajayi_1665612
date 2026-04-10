from datetime import datetime, timezone
from typing import List, Dict, Any
import uuid

class ActivityStore:
    """In-memory store for activity events. In production, use Redis or database."""
    
    def __init__(self):
        self.events: List[Dict[str, Any]] = []
        self.max_events = 100  # Keep last 100 events
    
    def add_event(self, event_type: str, title: str, description: str, source: str = None):
        """Add a new activity event."""
        event = {
            "id": str(uuid.uuid4()),
            "type": event_type,
            "title": title,
            "description": description,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "source": source
        }
        
        self.events.insert(0, event)  # Add to beginning
        
        # Keep only max_events
        if len(self.events) > self.max_events:
            self.events = self.events[:self.max_events]
    
    def get_events(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Get recent activity events."""
        return self.events[:limit]

# Global activity store instance
activity_store = ActivityStore()