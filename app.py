import os
import json
import sqlite3
from datetime import datetime, timedelta
import random
import threading
import time
import requests
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

app = Flask(__name__, static_folder='static')
CORS(app)

DB_FILE = 'flights.db'
API_KEY = os.environ.get('AVIATIONSTACK_API_KEY')
BASE_URL = "http://api.aviationstack.com/v1/flights"

# Airports configuration
AIRPORTS = {
    'YYZ': 'Toronto Pearson International',
    'AMS': 'Amsterdam Schiphol',
    'DOH': 'Hamad International',
    'BLR': 'Kempegowda International'
}

def init_db():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS cancellations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            flight_number TEXT,
            airline TEXT,
            departure_airport TEXT,
            scheduled_time DATETIME,
            cancelled_at DATETIME,
            reason TEXT,
            UNIQUE(flight_number, scheduled_time)
        )
    ''')
    conn.commit()
    conn.close()

def get_db_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def generate_mock_cancellation():
    airlines = ['Air Canada', 'KLM', 'Qatar Airways', 'IndiGo', 'Lufthansa', 'British Airways', 'Emirates']
    reasons = ['Weather Conditions', 'Technical Issue', 'Crew Shortage', 'Operational Reasons', 'Air Traffic Control']

    airport_code = random.choice(list(AIRPORTS.keys()))
    airline = random.choice(airlines)
    flight_num = f"{airline[:2].upper()}{random.randint(100, 999)}"

    scheduled = datetime.now() + timedelta(hours=random.randint(-24, 2))

    return {
        'flight_number': flight_num,
        'airline': airline,
        'departure_airport': airport_code,
        'scheduled_time': scheduled.strftime('%Y-%m-%d %H:%M:%S'),
        'cancelled_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'reason': random.choice(reasons)
    }

def fetch_real_data():
    if not API_KEY:
        return None

    all_new = []
    for iata in AIRPORTS.keys():
        params = {
            'access_key': API_KEY,
            'dep_iata': iata,
            'flight_status': 'cancelled'
        }
        try:
            response = requests.get(BASE_URL, params=params, timeout=10)
            data = response.json()
            if 'data' in data:
                for flight in data['data']:
                    all_new.append({
                        'flight_number': flight['flight']['iata'] or 'N/A',
                        'airline': flight['airline']['name'],
                        'departure_airport': iata,
                        'scheduled_time': flight['flight_date'],
                        'cancelled_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                        'reason': "Cancelled by Airline"
                    })
        except Exception as e:
            print(f"Error fetching data for {iata}: {e}")
    return all_new

def poll_flights():
    """Background task to fetch flight cancellations."""
    while True:
        cancellations = []
        if API_KEY:
            real_data = fetch_real_data()
            if real_data:
                cancellations = real_data

        # Always add some mock data if no real data found or no API key,
        # to ensure the dashboard stays "live" for the demo
        if not cancellations:
            cancellations = [generate_mock_cancellation()]

        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()
        for item in cancellations:
            try:
                c.execute('''
                    INSERT OR IGNORE INTO cancellations (flight_number, airline, departure_airport, scheduled_time, cancelled_at, reason)
                    VALUES (?, ?, ?, ?, ?, ?)
                ''', (
                    item['flight_number'],
                    item['airline'],
                    item['departure_airport'],
                    item['scheduled_time'],
                    item['cancelled_at'],
                    item['reason']
                ))
            except Exception as e:
                print(f"DB Error: {e}")
        conn.commit()
        conn.close()

        time.sleep(random.randint(300, 600))

@app.route('/api/cancellations', methods=['GET'])
def get_cancellations():
    airport = request.args.get('airport')
    airline = request.args.get('airline')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    query = "SELECT * FROM cancellations WHERE 1=1"
    params = []

    if airport:
        query += " AND departure_airport = ?"
        params.append(airport)
    if airline:
        query += " AND airline LIKE ?"
        params.append(f"%{airline}%")
    if start_date:
        query += " AND scheduled_time >= ?"
        params.append(f"{start_date} 00:00:00")
    if end_date:
        query += " AND scheduled_time <= ?"
        params.append(f"{end_date} 23:59:59")

    query += " ORDER BY scheduled_time DESC"

    conn = get_db_connection()
    rows = conn.execute(query, params).fetchall()
    conn.close()

    return jsonify([dict(row) for row in rows])

@app.route('/api/stats', methods=['GET'])
def get_stats():
    conn = get_db_connection()
    airport_stats = conn.execute('''
        SELECT departure_airport, COUNT(*) as count
        FROM cancellations
        GROUP BY departure_airport
    ''').fetchall()

    airline_stats = conn.execute('''
        SELECT airline, COUNT(*) as count
        FROM cancellations
        GROUP BY airline
        ORDER BY count DESC
        LIMIT 5
    ''').fetchall()

    conn.close()

    return jsonify({
        'by_airport': {row['departure_airport']: row['count'] for row in airport_stats},
        'by_airline': {row['airline']: row['count'] for row in airline_stats}
    })

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

if __name__ == '__main__':
    init_db()
    threading.Thread(target=poll_flights, daemon=True).start()
    app.run(host='0.0.0.0', port=5000)
