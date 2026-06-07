import json
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

class PriceEngine:
    def __init__(self, history_file="price_tracker/history.json"):
        self.history_file = history_file
        self.history = self.load_history()
        self.recipient_email = os.environ.get("RECIPIENT_EMAIL", "mshaik467@gmail.com")
        self.sender_email = os.environ.get("SENDER_EMAIL")
        self.sender_password = os.environ.get("SENDER_PASSWORD")

    def load_history(self):
        if os.path.exists(self.history_file):
            try:
                with open(self.history_file, "r") as f:
                    return json.load(f)
            except:
                return []
        return []

    def save_history(self, new_results):
        # We append new results with a timestamp batch
        entry = {
            "timestamp": datetime.now().isoformat(),
            "results": new_results
        }
        self.history.append(entry)
        # Keep only last 30 runs to save space
        self.history = self.history[-30:]
        with open(self.history_file, "w") as f:
            json.dump(self.history, f, indent=4)

    def find_previous_price(self, retailer, title):
        if len(self.history) < 1: # Change from 2 to 1 because we call find_previous_price BEFORE appending current
            return None
        # Look in the last run currently in history
        prev_run = self.history[-1]["results"]
        for item in prev_run:
            if item["retailer"] == retailer and item["title"] == title:
                return item["price"]
        return None

    def generate_report(self, current_results):
        drops = []
        best_watch = None
        best_phone = None

        for item in current_results:
            prev_price = self.find_previous_price(item["retailer"], item["title"])
            if prev_price and item["price"] < prev_price:
                item["prev_price"] = prev_price
                item["drop"] = prev_price - item["price"]
                drops.append(item)

            if item["category"] == "Watch":
                if not best_watch or item["price"] < best_watch["price"]:
                    best_watch = item
            elif item["category"] == "Phone":
                if not best_phone or item["price"] < best_phone["price"]:
                    best_phone = item

        return drops, best_watch, best_phone

    def send_email(self, drops, best_watch, best_phone, current_results):
        if not self.sender_email or not self.sender_password:
            print("Email credentials not set. Skipping email.")
            return

        subject = "Daily Samsung Price Report - Canada"
        body = f"<h2>Samsung Price Report - {datetime.now().strftime('%Y-%m-%d')}</h2>"

        if drops:
            body += "<h3>🚨 Price Drops Detected!</h3><ul>"
            for item in drops:
                body += f"<li><b>{item['title']}</b> at {item['retailer']}: <span style='color:green'>${item['price']}</span> (was ${item['prev_price']})</li>"
            body += "</ul>"
        else:
            body += "<p>No price drops detected since the last run.</p>"

        body += "<h3>🏆 Best Current Deals</h3>"
        if best_watch:
            body += f"<p><b>Cheapest Watch:</b> {best_watch['title']} - <b>${best_watch['price']}</b> at {best_watch['retailer']}</p>"
        if best_phone:
            body += f"<p><b>Cheapest Phone:</b> {best_phone['title']} - <b>${best_phone['price']}</b> at {best_phone['retailer']}</p>"

        body += "<h3>Detailed Comparison</h3>"
        body += "<table border='1'><tr><th>Retailer</th><th>Product</th><th>Current Price</th></tr>"
        for item in sorted(current_results, key=lambda x: x['price'])[:20]: # Show top 20
            body += f"<tr><td>{item['retailer']}</td><td>{item['title']}</td><td>${item['price']}</td></tr>"
        body += "</table>"

        msg = MIMEMultipart()
        msg['From'] = self.sender_email
        msg['To'] = self.recipient_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'html'))

        try:
            # Use local relay or unauthenticated SMTP if no password provided
            if self.sender_password:
                with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
                    server.login(self.sender_email, self.sender_password)
                    server.send_message(msg)
            else:
                # Attempt to send without login (for local relays or specific setups)
                with smtplib.SMTP("localhost") as server:
                    server.send_message(msg)
            print("Email sent successfully.")
        except Exception as e:
            print(f"Failed to send email: {e}")

    def process(self, current_results):
        drops, best_watch, best_phone = self.generate_report(current_results)
        self.save_history(current_results)
        self.send_email(drops, best_watch, best_phone, current_results)
        return drops

if __name__ == "__main__":
    # Test logic
    engine = PriceEngine()
    if os.path.exists("price_tracker/current_results.json"):
        with open("price_tracker/current_results.json", "r") as f:
            curr = json.load(f)
            engine.process(curr)
