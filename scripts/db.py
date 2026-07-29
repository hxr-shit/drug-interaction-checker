import os
import mysql.connector
from dotenv import load_dotenv
load_dotenv()

def get_connection():
    ssl_ca = os.getenv("DB_SSL_CA")
    
    config = {
        "host": os.getenv("DB_HOST"),
        "port": int(os.getenv("DB_PORT")),
        "user": os.getenv("DB_USER"),
        "password": os.getenv("DB_PASSWORD"),
        "database": os.getenv("DB_NAME"),
    }
    
    if ssl_ca and os.path.exists(ssl_ca):
        config["ssl_ca"] = ssl_ca
        config["ssl_verify_cert"] = True
    else:
        config["ssl_disabled"] = False
    connect = mysql.connector.connect(**config)
    cursor = connect.cursor()
    return connect, cursor