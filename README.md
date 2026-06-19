# Flight Cancellation Agent

A real-time flight cancellation tracking dashboard for **Toronto (YYZ)**, **Amsterdam (AMS)**, **Doha (DOH)**, and **Bangalore (BLR)**.

## Features
- **Real-time Monitoring**: Tracks cancellations from now until the end of the year.
- **Persistence**: Uses SQLite to store cancellation history.
- **Responsive Dashboard**: Mobile-friendly interface with data visualizations.
- **Filtering**: Filter by Airport, Airline, and Date range.
- **Automatic Refresh**: Dashboard updates every 60 seconds.

## Tech Stack
- **Backend**: Python (Flask)
- **Database**: SQLite
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla), Chart.js

## How to Run

### 1. Install Dependencies
```bash
pip install Flask requests flask-cors
```

### 2. Set API Key (Optional but Recommended)
To get live data, set your AviationStack API key:
```bash
export AVIATIONSTACK_API_KEY='your_key_here'
```
*If no key is provided, the agent will generate realistic mock data for demonstration purposes.*

### 3. Start the Agent
```bash
python3 app.py
```

### 4. Access the Dashboard
- **Desktop**: Open `http://localhost:5000` in your browser.
- **Mobile**: Ensure your phone is on the same network and access `http://<your-computer-ip>:5000`.

## Directory Structure
- `app.py`: Main Flask application and background tracker.
- `index.html`: Dashboard structure.
- `static/css/style.css`: Responsive styling.
- `static/js/main.js`: Frontend logic and data fetching.
- `flights.db`: SQLite database (auto-generated).
