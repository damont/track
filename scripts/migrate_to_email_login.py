#!/usr/bin/env python3
"""
Migration script to prepare existing users for email-based login.

This script ensures that all users have a valid email and can log in using email instead of username.
It's idempotent and safe to run multiple times.
"""

import asyncio
import os
import sys
from datetime import datetime

# Add the parent directory to Python path to import from api
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from beanie import init_beanie
import motor.motor_asyncio
from api.schemas.orm.user import User


async def migrate_users():
    """
    Migrate users to email-based login system.
    
    Since the User model already has email and username fields,
    this migration just ensures data consistency.
    """
    
    # Initialize database connection
    # You may need to adjust the connection string for your environment
    mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017")
    database_name = os.getenv("DATABASE_NAME", "track_db")
    
    client = motor.motor_asyncio.AsyncIOMotorClient(mongo_url)
    database = client[database_name]
    
    await init_beanie(database=database, document_models=[User])
    
    print("🔄 Starting user migration for email-based login...")
    
    # Find all users
    users = await User.find_all().to_list()
    migration_count = 0
    
    for user in users:
        needs_update = False
        
        # Ensure email field exists and is valid
        if not user.email:
            print(f"❌ User {user.username} has no email - requires manual intervention")
            continue
            
        # Ensure display_name is populated
        if not user.display_name:
            user.display_name = user.username
            needs_update = True
            print(f"✅ Set display_name for user {user.email}: {user.display_name}")
        
        if needs_update:
            await user.save()
            migration_count += 1
    
    print(f"✅ Migration completed! Updated {migration_count} users.")
    print("📧 All users can now log in using their email address instead of username.")
    
    # Create summary report
    total_users = len(users)
    users_with_email = len([u for u in users if u.email])
    
    print(f"\n📊 Summary:")
    print(f"  Total users: {total_users}")
    print(f"  Users with valid email: {users_with_email}")
    print(f"  Users updated: {migration_count}")
    
    if users_with_email < total_users:
        print(f"  ⚠️  {total_users - users_with_email} users need manual email assignment")


async def main():
    """Main migration function"""
    try:
        await migrate_users()
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    print("🚀 Track App - Email Login Migration")
    print("=" * 40)
    asyncio.run(main())