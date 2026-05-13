import sqlite3
from datetime import datetime
import os
import json

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'rxlens.db')

def init_db():
    """Initializes the SQLite database and creates the prescriptions table with full schema."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS prescriptions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT,
            drug_name TEXT,
            dosage TEXT,
            frequency TEXT,
            duration TEXT,
            summary TEXT,
            schedule TEXT,
            safety_alert_count INTEGER,
            critical_alert_count INTEGER,
            safety_alerts TEXT
        )
    ''')
    
    # Simple migration: ensure new columns exist
    cursor.execute("PRAGMA table_info(prescriptions)")
    columns = [col[1] for col in cursor.fetchall()]
    new_cols = {
        'schedule': 'TEXT',
        'safety_alert_count': 'INTEGER',
        'critical_alert_count': 'INTEGER',
        'safety_alerts': 'TEXT'
    }
    for col_name, col_type in new_cols.items():
        if col_name not in columns:
            cursor.execute(f"ALTER TABLE prescriptions ADD COLUMN {col_name} {col_type}")
            
    conn.commit()
    conn.close()

def save_prescription(data):
    """Saves a digitized prescription to the database with all clinical intelligence."""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        date_str = data.get("date") or datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        cursor.execute('''
            INSERT INTO prescriptions (
                date, drug_name, dosage, frequency, duration, 
                summary, schedule, safety_alert_count, 
                critical_alert_count, safety_alerts
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            date_str, 
            data.get("drug") or data.get("drug_name", "Unknown"), 
            data.get("dosage", "N/A"), 
            data.get("frequency", "As directed"), 
            data.get("duration", "N/A"),
            data.get("summary", ""),
            json.dumps(data.get("schedule", [])),
            data.get("safety_alert_count", 0),
            data.get("critical_alert_count", 0),
            json.dumps(data.get("safety_alerts", []))
        ))
        
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"Database Save Error: {e}")
        return False

def get_all_prescriptions():
    """Retrieves all prescriptions from the database, parsing JSON fields."""
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM prescriptions ORDER BY id DESC')
        rows = cursor.fetchall()
        
        history = []
        for row in rows:
            item = dict(row)
            # Parse JSON fields back to objects
            try:
                item['schedule'] = json.loads(item['schedule']) if item.get('schedule') else []
                item['safety_alerts'] = json.loads(item['safety_alerts']) if item.get('safety_alerts') else []
            except:
                item['schedule'] = []
                item['safety_alerts'] = []
            history.append(item)
            
        conn.close()
        return history
    except Exception as e:
        print(f"Database Fetch Error: {e}")
        return []

# Initialize on import
init_db()
