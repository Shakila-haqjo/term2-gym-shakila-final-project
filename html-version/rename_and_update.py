#!/usr/bin/env python3
"""
Script to rename sessions to timetables and update all references
Also creates missing blog pages and updates navigation
"""

import os
import shutil
import re

BASE_DIR = "/Users/TAYAB/Advantures/Business/NeuroApp/Customers/shakila_gym_pjt/html-version/pages"

# Files to rename (old_name -> new_name)
RENAME_MAP = {
    "admin/sessions.html": "admin/timetables.html",
    "trainer/sessions.html": "trainer/timetables.html",
    "trainer/create-session.html": "trainer/create-timetable.html",
    "trainer/edit-session.html": "trainer/edit-timetable.html",
    "trainer/session-bookings.html": "trainer/timetable-bookings.html",
    "member/sessions.html": "member/timetables.html",
    "member/book-session.html": "member/book-timetable.html",
    "member/profile.html": "member/blogs.html",
    "trainer/profile.html": "trainer/blogs.html",
}

# Text replacements (case-sensitive)
TEXT_REPLACEMENTS = [
    ("sessions.html", "timetables.html"),
    ("create-session.html", "create-timetable.html"),
    ("edit-session.html", "edit-timetable.html"),
    ("session-bookings.html", "timetable-bookings.html"),
    ("book-session.html", "book-timetable.html"),
    ("Sessions", "Timetables"),
    ("Session", "Timetable"),
    ("sessions", "timetables"),
    ("session", "timetable"),
    ("My Sessions", "My Timetables"),
    ("Create Session", "Create Timetable"),
    ("Edit Session", "Edit Timetable"),
    ("Manage Sessions", "Manage Timetables"),
    ("Book a Session", "Book a Timetable"),
    ("View Sessions", "View Timetables"),
    ("Browse Sessions", "Browse Timetables"),
    ("training sessions", "training timetables"),
    ("Profile", "Blogs"),
    ("profile.html", "blogs.html"),
]

def rename_files():
    """Rename files according to RENAME_MAP"""
    print("=== RENAMING FILES ===")
    for old_path, new_path in RENAME_MAP.items():
        old_full = os.path.join(BASE_DIR, old_path)
        new_full = os.path.join(BASE_DIR, new_path)
        
        if os.path.exists(old_full):
            print(f"Renaming: {old_path} -> {new_path}")
            shutil.copy2(old_full, new_full)
        else:
            print(f"Warning: {old_path} not found")

def update_file_content(filepath):
    """Update content in a single file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Apply all text replacements
        for old_text, new_text in TEXT_REPLACEMENTS:
            content = content.replace(old_text, new_text)
        
        # Only write if content changed
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        return False
    except Exception as e:
        print(f"Error updating {filepath}: {e}")
        return False

def update_all_html_files():
    """Update all HTML files with new terminology"""
    print("\n=== UPDATING FILE CONTENTS ===")
    updated_count = 0
    
    for root, dirs, files in os.walk(BASE_DIR):
        for file in files:
            if file.endswith('.html'):
                filepath = os.path.join(root, file)
                if update_file_content(filepath):
                    updated_count += 1
                    print(f"Updated: {os.path.relpath(filepath, BASE_DIR)}")
    
    print(f"\nTotal files updated: {updated_count}")

def main():
    print("Starting renaming and update process...\n")
    rename_files()
    update_all_html_files()
    print("\n=== COMPLETE ===")
    print("Files have been renamed and updated.")
    print("Note: Original session files are preserved. You can delete them manually if needed.")

if __name__ == "__main__":
    main()
