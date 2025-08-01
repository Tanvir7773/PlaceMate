import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

# Load .env file
load_dotenv()

MONGO_URL = os.getenv("MONGO_URL")
DB_NAME = os.getenv("DB_NAME")
USERS_COLLECTION_NAME = os.getenv("USERS_COLLECTION_NAME")
COMPANIES_COLLECTION_NAME = os.getenv("COMPANIES_COLLECTION_NAME")

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]
users_collection = db[USERS_COLLECTION_NAME]
companies_collection = db[COMPANIES_COLLECTION_NAME]
