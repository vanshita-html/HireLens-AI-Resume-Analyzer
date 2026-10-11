import os
import json
import sqlite3
import re
from typing import Dict, List, Any, Optional
from urllib.parse import urlparse

DATABASE_URL = os.getenv("DATABASE_URL")
SQLITE_PATH = os.path.join(os.path.dirname(__file__), "hirelens.db")

def is_postgres() -> bool:
    return bool(DATABASE_URL and (DATABASE_URL.startswith("postgres://") or DATABASE_URL.startswith("postgresql://")))

def get_db_connection():
    if is_postgres():
        import psycopg2
        import psycopg2.extras
        # Handle Render/Neon postgres url format where postgres:// might need adjustment
        db_url = DATABASE_URL
        if db_url.startswith("postgres://"):
            db_url = db_url.replace("postgres://", "postgresql://", 1)
        conn = psycopg2.connect(db_url, cursor_factory=psycopg2.extras.RealDictCursor)
        return conn
    else:
        os.makedirs(os.path.dirname(SQLITE_PATH), exist_ok=True)
        conn = sqlite3.connect(SQLITE_PATH)
        conn.row_factory = sqlite3.Row
        return conn

def execute_query(query: str, params: tuple = (), fetch_one: bool = False, fetch_all: bool = False, commit: bool = False):
    conn = get_db_connection()
    try:
        if is_postgres():
            # In PostgreSQL, convert ? placeholder to %s
            pg_query = query.replace("?", "%s")
            with conn.cursor() as cursor:
                cursor.execute(pg_query, params)
                if commit:
                    conn.commit()
                if fetch_one:
                    row = cursor.fetchone()
                    return dict(row) if row else None
                if fetch_all:
                    rows = cursor.fetchall()
                    return [dict(r) for r in rows]
                if commit:
                    return getattr(cursor, "lastrowid", None)
        else:
            cursor = conn.cursor()
            cursor.execute(query, params)
            if commit:
                conn.commit()
                last_id = cursor.lastrowid
            if fetch_one:
                row = cursor.fetchone()
                return dict(row) if row else None
            if fetch_all:
                rows = cursor.fetchall()
                return [dict(r) for r in rows]
            if commit:
                return last_id
    finally:
        conn.close()

def init_db():
    conn = get_db_connection()
    try:
        if is_postgres():
            with conn.cursor() as cursor:
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS users (
                        id SERIAL PRIMARY KEY,
                        name VARCHAR(255) NOT NULL,
                        email VARCHAR(255) UNIQUE NOT NULL,
                        password_hash VARCHAR(255) NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );
                """)
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS reports (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        filename VARCHAR(255) NOT NULL,
                        name VARCHAR(255),
                        email VARCHAR(255),
                        phone VARCHAR(100),
                        linkedin VARCHAR(255),
                        github VARCHAR(255),
                        skills TEXT,
                        sections_found TEXT,
                        ats_score INTEGER,
                        score_breakdown TEXT,
                        suggestions TEXT,
                        weak_verbs TEXT,
                        keywords TEXT,
                        improvement_prediction TEXT,
                        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );
                """)
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS jd_matches (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        report_id INTEGER REFERENCES reports(id) ON DELETE SET NULL,
                        role_title VARCHAR(255),
                        jd_text TEXT NOT NULL,
                        match_percentage INTEGER NOT NULL,
                        matching_skills TEXT,
                        missing_skills TEXT,
                        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );
                """)
                conn.commit()
        else:
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS reports (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER,
                    filename TEXT NOT NULL,
                    name TEXT,
                    email TEXT,
                    phone TEXT,
                    linkedin TEXT,
                    github TEXT,
                    skills TEXT,
                    sections_found TEXT,
                    ats_score INTEGER,
                    score_breakdown TEXT,
                    suggestions TEXT,
                    weak_verbs TEXT,
                    keywords TEXT,
                    improvement_prediction TEXT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                );
            """)
            # Check if user_id column exists in existing sqlite reports table
            cursor.execute("PRAGMA table_info(reports);")
            columns = [col[1] for col in cursor.fetchall()]
            if "user_id" not in columns:
                cursor.execute("ALTER TABLE reports ADD COLUMN user_id INTEGER;")

            cursor.execute("""
                CREATE TABLE IF NOT EXISTS jd_matches (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    report_id INTEGER,
                    role_title TEXT,
                    jd_text TEXT NOT NULL,
                    match_percentage INTEGER NOT NULL,
                    matching_skills TEXT,
                    missing_skills TEXT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE SET NULL
                );
            """)
            conn.commit()
    finally:
        conn.close()

# User helpers
def create_user(name: str, email: str, password_hash: str) -> Optional[int]:
    query = """
        INSERT INTO users (name, email, password_hash)
        VALUES (?, ?, ?)
    """
    if is_postgres():
        conn = get_db_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute(
                    "INSERT INTO users (name, email, password_hash) VALUES (%s, %s, %s) RETURNING id",
                    (name, email.lower().strip(), password_hash)
                )
                user_id = cursor.fetchone()["id"]
                conn.commit()
                return user_id
        finally:
            conn.close()
    else:
        return execute_query(query, (name, email.lower().strip(), password_hash), commit=True)

def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    return execute_query("SELECT * FROM users WHERE LOWER(email) = LOWER(?)", (email.strip(),), fetch_one=True)

def get_user_by_id(user_id: int) -> Optional[Dict[str, Any]]:
    return execute_query("SELECT id, name, email, created_at FROM users WHERE id = ?", (user_id,), fetch_one=True)

def update_user_name(user_id: int, name: str) -> bool:
    execute_query("UPDATE users SET name = ? WHERE id = ?", (name.strip(), user_id), commit=True)
    return True

def update_user_password(user_id: int, password_hash: str) -> bool:
    execute_query("UPDATE users SET password_hash = ? WHERE id = ?", (password_hash, user_id), commit=True)
    return True

def delete_user_and_all_data(user_id: int) -> bool:
    execute_query("DELETE FROM jd_matches WHERE user_id = ?", (user_id,), commit=True)
    execute_query("DELETE FROM reports WHERE user_id = ?", (user_id,), commit=True)
    execute_query("DELETE FROM users WHERE id = ?", (user_id,), commit=True)
    return True

# Report helpers
def save_report(user_id: int, report_data: Dict[str, Any]) -> int:
    query = """
        INSERT INTO reports (
            user_id, filename, name, email, phone, linkedin, github, 
            skills, sections_found, ats_score, score_breakdown, 
            suggestions, weak_verbs, keywords, improvement_prediction
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """
    params = (
        user_id,
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
    )
    if is_postgres():
        conn = get_db_connection()
        try:
            with conn.cursor() as cursor:
                pg_query = query.replace("?", "%s") + " RETURNING id"
                cursor.execute(pg_query, params)
                report_id = cursor.fetchone()["id"]
                conn.commit()
                return report_id
        finally:
            conn.close()
    else:
        return execute_query(query, params, commit=True)

def _format_report(report: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if not report:
        return None
    r = dict(report)
    for field, default in [
        ("skills", "[]"),
        ("sections_found", "{}"),
        ("score_breakdown", "{}"),
        ("suggestions", "[]"),
        ("weak_verbs", "[]"),
        ("keywords", "{}"),
        ("improvement_prediction", "{}")
    ]:
        val = r.get(field)
        if isinstance(val, str):
            try:
                r[field] = json.loads(val or default)
            except Exception:
                r[field] = json.loads(default)
        elif val is None:
            r[field] = json.loads(default)
    return r

def get_reports_by_user(user_id: int) -> List[Dict[str, Any]]:
    rows = execute_query("SELECT * FROM reports WHERE user_id = ? ORDER BY timestamp DESC", (user_id,), fetch_all=True)
    return [_format_report(r) for r in rows]

def get_report_by_id(report_id: int, user_id: int) -> Optional[Dict[str, Any]]:
    row = execute_query("SELECT * FROM reports WHERE id = ? AND user_id = ?", (report_id, user_id), fetch_one=True)
    return _format_report(row)

def delete_report(report_id: int, user_id: int) -> bool:
    execute_query("DELETE FROM jd_matches WHERE report_id = ? AND user_id = ?", (report_id, user_id), commit=True)
    execute_query("DELETE FROM reports WHERE id = ? AND user_id = ?", (report_id, user_id), commit=True)
    return True

# JD Match history
def save_jd_match(user_id: int, report_id: Optional[int], role_title: str, jd_text: str, match_percentage: int, matching_skills: List[str], missing_skills: List[str]) -> int:
    query = """
        INSERT INTO jd_matches (user_id, report_id, role_title, jd_text, match_percentage, matching_skills, missing_skills)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """
    params = (
        user_id,
        report_id,
        role_title,
        jd_text,
        match_percentage,
        json.dumps(matching_skills),
        json.dumps(missing_skills)
    )
    if is_postgres():
        conn = get_db_connection()
        try:
            with conn.cursor() as cursor:
                pg_query = query.replace("?", "%s") + " RETURNING id"
                cursor.execute(pg_query, params)
                match_id = cursor.fetchone()["id"]
                conn.commit()
                return match_id
        finally:
            conn.close()
    else:
        return execute_query(query, params, commit=True)

def get_jd_matches_by_user(user_id: int) -> List[Dict[str, Any]]:
    rows = execute_query("SELECT * FROM jd_matches WHERE user_id = ? ORDER BY timestamp DESC LIMIT 20", (user_id,), fetch_all=True)
    results = []
    for r in rows:
        item = dict(r)
        item["matching_skills"] = json.loads(item.get("matching_skills") or "[]")
        item["missing_skills"] = json.loads(item.get("missing_skills") or "[]")
        results.append(item)
    return results
