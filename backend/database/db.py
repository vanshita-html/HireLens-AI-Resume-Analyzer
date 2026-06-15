import sqlite3
import json
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "hirelens.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT NOT NULL,
            name TEXT,
            email TEXT,
            phone TEXT,
            linkedin TEXT,
            github TEXT,
            skills TEXT, -- JSON array of strings
            sections_found TEXT, -- JSON dict of bools
            ats_score INTEGER,
            score_breakdown TEXT, -- JSON dict
            suggestions TEXT, -- JSON array of dicts
            weak_verbs TEXT, -- JSON array of dicts
            keywords TEXT, -- JSON dict of lists
            improvement_prediction TEXT, -- JSON dict
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()

def save_report(report_data):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO reports (
            filename, name, email, phone, linkedin, github, 
            skills, sections_found, ats_score, score_breakdown, 
            suggestions, weak_verbs, keywords, improvement_prediction
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        report_data.get("filename"),
        report_data.get("name"),
        report_data.get("email"),
        report_data.get("phone"),
        report_data.get("linkedin"),
        report_data.get("github"),
        json.dumps(report_data.get("skills", [])),
        json.dumps(report_data.get("sections_found", {})),
        report_data.get("ats_score", 0),
        json.dumps(report_data.get("score_breakdown", {})),
        json.dumps(report_data.get("suggestions", [])),
        json.dumps(report_data.get("weak_verbs", [])),
        json.dumps(report_data.get("keywords", {})),
        json.dumps(report_data.get("improvement_prediction", {}))
    ))
    report_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return report_id

def get_all_reports():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM reports ORDER BY timestamp DESC")
    rows = cursor.fetchall()
    conn.close()
    
    reports = []
    for row in rows:
        report = dict(row)
        # Parse JSON fields back
        report["skills"] = json.loads(report["skills"] or "[]")
        report["sections_found"] = json.loads(report["sections_found"] or "{}")
        report["score_breakdown"] = json.loads(report["score_breakdown"] or "{}")
        report["suggestions"] = json.loads(report["suggestions"] or "[]")
        report["weak_verbs"] = json.loads(report["weak_verbs"] or "[]")
        report["keywords"] = json.loads(report["keywords"] or "{}")
        report["improvement_prediction"] = json.loads(report["improvement_prediction"] or "{}")
        reports.append(report)
    return reports

def get_report_by_id(report_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM reports WHERE id = ?", (report_id,))
    row = cursor.fetchone()
    conn.close()
    
    if row is None:
        return None
        
    report = dict(row)
    report["skills"] = json.loads(report["skills"] or "[]")
    report["sections_found"] = json.loads(report["sections_found"] or "{}")
    report["score_breakdown"] = json.loads(report["score_breakdown"] or "{}")
    report["suggestions"] = json.loads(report["suggestions"] or "[]")
    report["weak_verbs"] = json.loads(report["weak_verbs"] or "[]")
    report["keywords"] = json.loads(report["keywords"] or "{}")
    report["improvement_prediction"] = json.loads(report["improvement_prediction"] or "{}")
    return report

def delete_report(report_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM reports WHERE id = ?", (report_id,))
    conn.commit()
    conn.close()
    return True
