# db.py
import os
import mysql.connector
from dotenv import load_dotenv
load_dotenv()

def get_connection():
    connect = mysql.connector.connect(
        host=os.getenv("DB_HOST"),
        port=int(os.getenv("DB_PORT")),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME")
    )
    cursor = connect.cursor()
    return connect, cursor