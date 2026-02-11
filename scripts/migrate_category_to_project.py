#!/usr/bin/env python3
"""
Migration script: Rename 'category' to 'project' in MongoDB.

Operations:
1. Rename 'categories' collection -> 'projects'
2. In 'tasks' collection: rename fields category_id -> project_id, category_order -> project_order
3. In 'notes' collection: rename field category_id -> project_id

Usage:
    python scripts/migrate_category_to_project.py

Reads MONGODB_URL and MONGODB_DB_NAME from .env file or environment variables.
"""

import os
import sys
from pymongo import MongoClient

# Try to load .env file
env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
if os.path.exists(env_path):
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                os.environ.setdefault(key.strip(), value.strip())

MONGODB_URL = os.environ.get('MONGODB_URL', 'mongodb://localhost:27017')
MONGODB_DB_NAME = os.environ.get('MONGODB_DB_NAME', 'track')


def migrate():
    client = MongoClient(MONGODB_URL)
    db = client[MONGODB_DB_NAME]

    print(f"Connected to MongoDB: {MONGODB_URL}, database: {MONGODB_DB_NAME}")

    # 1. Rename 'categories' collection to 'projects'
    if 'categories' in db.list_collection_names():
        print("Renaming collection 'categories' -> 'projects'...")
        db.categories.rename('projects')
        print("  Done.")
    elif 'projects' in db.list_collection_names():
        print("Collection 'projects' already exists, skipping rename.")
    else:
        print("Neither 'categories' nor 'projects' collection found, skipping.")

    # 2. Rename fields in 'tasks' collection
    tasks = db.tasks
    task_count = tasks.count_documents({})
    print(f"\nUpdating 'tasks' collection ({task_count} documents)...")

    # Rename category_id -> project_id
    result = tasks.update_many(
        {'category_id': {'$exists': True}},
        {'$rename': {'category_id': 'project_id'}}
    )
    print(f"  Renamed category_id -> project_id in {result.modified_count} tasks.")

    # Rename category_order -> project_order
    result = tasks.update_many(
        {'category_order': {'$exists': True}},
        {'$rename': {'category_order': 'project_order'}}
    )
    print(f"  Renamed category_order -> project_order in {result.modified_count} tasks.")

    # 3. Rename fields in 'notes' collection
    notes = db.notes
    note_count = notes.count_documents({})
    print(f"\nUpdating 'notes' collection ({note_count} documents)...")

    result = notes.update_many(
        {'category_id': {'$exists': True}},
        {'$rename': {'category_id': 'project_id'}}
    )
    print(f"  Renamed category_id -> project_id in {result.modified_count} notes.")

    print("\nMigration complete!")
    client.close()


if __name__ == '__main__':
    migrate()
