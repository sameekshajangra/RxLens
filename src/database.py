import sqlite3
from datetime import datetime
import os

DB_PATH = "/Users/sameekshasharma/Desktop/medtech/RxLens/rxlens.db"

def init_db():
    """Initializes the SQLite database and creates the prescriptions table."""
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
            summary TEXT
        )
    ''')
    conn.commit()
    conn.close()

def save_prescription(data):
    """Saves a digitized prescription to the database."""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        date_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        cursor.execute('''
            INSERT INTO prescriptions (date, drug_name, dosage, frequency, duration, summary)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            date_str, 
            data.get("drug", ""), 
            data.get("dosage", ""), 
            data.get("frequency", ""), 
            data.get("duration", ""),
            data.get("summary", "")
        ))
        
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"Database Save Error: {e}")
        return False

def get_all_prescriptions():
    """Retrieves all prescriptions from the database."""
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM prescriptions ORDER BY id DESC')
        rows = cursor.fetchall()
        
        history = []
        for row in rows:
            history.append(dict(row))
            
        conn.close()
        return history
    except Exception as e:
        print(f"Database Fetch Error: {e}")
        return []

# Initialize on import
init_db()
