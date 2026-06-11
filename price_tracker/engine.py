import json
import os
import smtplib
import html
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

class PriceEngine:
    def __init__(self, history_file="price_tracker/history.json"):
        self.history_file = history_file
        self.history = self.load_history()
        self.recipient_email = os.environ.get("RECIPIENT_EMAIL", "mshaik467@gmail.com")
        self.sender_email = os.environ.get("SENDER_EMAIL", "tracker@example.com")
        self.sender_password = os.environ.get("SENDER_PASSWORD")
        self.email_log = "price_tracker/sent_emails.html"
        self.dashboard_data = "price_tracker/dashboard/data.json"

    def load_history(self):
        if os.path.exists(self.history_file):
            try:
                with open(self.history_file, "r") as f:
                    return json.load(f)
            except:
                return []
        return []

    def save_history(self, new_results):
        entry = {
            "timestamp": datetime.now().isoformat(),
            "results": new_results
        }
        self.history.append(entry)
        self.history = self.history[-30:]
        with open(self.history_file, "w") as f:
            json.dump(self.history, f, indent=4)

        # Also save to dashboard data
        try:
            if not os.path.exists("price_tracker/dashboard"):
                os.makedirs("price_tracker/dashboard")
            with open(self.dashboard_data, "w") as f:
                json.dump(entry, f, indent=4)
        except Exception as e:
            print(f"Failed to save dashboard data: {e}")

    def find_previous_price(self, retailer, title):
        if len(self.history) < 1:
            return None
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
        subject = "Daily Samsung Price Report - Canada"
        date_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        body = f"<h2>Samsung Price Report - {date_str}</h2>"

        if drops:
            body += "<h3>🚨 Price Drops Detected!</h3><ul>"
            for item in drops:
                t = html.escape(item['title'])
                r = html.escape(item['retailer'])
                body += f"<li><b>{t}</b> at {r}: <span style='color:green'>${item['price']}</span> (was ${item['prev_price']})</li>"
            body += "</ul>"
        else:
            body += "<p>No price drops detected since the last run.</p>"

        body += "<h3>🏆 Best Current Deals</h3>"
        if best_watch:
            t = html.escape(best_watch['title'])
            r = html.escape(best_watch['retailer'])
            body += f"<p><b>Cheapest Watch:</b> {t} - <b>${best_watch['price']}</b> at {r}</p>"
        if best_phone:
            t = html.escape(best_phone['title'])
            r = html.escape(best_phone['retailer'])
            body += f"<p><b>Cheapest Phone:</b> {t} - <b>${best_phone['price']}</b> at {r}</p>"

        body += "<h3>Detailed Comparison</h3>"
        body += "<table border='1'><tr><th>Retailer</th><th>Product</th><th>Current Price</th></tr>"
        for item in sorted(current_results, key=lambda x: x['price'])[:20]:
            t = html.escape(item['title'])
            r = html.escape(item['retailer'])
            body += f"<tr><td>{r}</td><td>{t}</td><td>${item['price']}</td></tr>"
        body += "</table>"

        # Always log to file for verification
        try:
            if not os.path.exists("price_tracker"):
                os.makedirs("price_tracker")
            with open(self.email_log, "a") as f:
                f.write(f"<hr><h3>Subject: {subject}</h3>{body}")
        except Exception as e:
            print(f"Failed to log email to file: {e}")

        if not self.sender_email:
            print("Sender email not set. Email logged to file.")
            return

        msg = MIMEMultipart()
        msg['From'] = self.sender_email
        msg['To'] = self.recipient_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'html'))

        try:
            if self.sender_password:
                with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
                    server.login(self.sender_email, self.sender_password)
                    server.send_message(msg)
                print("Email sent successfully via Gmail.")
            else:
                # Attempt unauthenticated
                with smtplib.SMTP("localhost") as server:
                    server.send_message(msg)
                print("Email sent successfully via localhost.")
        except Exception as e:
            print(f"Failed to send email via SMTP: {e}. Report saved to {self.email_log}")

    def process(self, current_results):
        drops, best_watch, best_phone = self.generate_report(current_results)
        # save_history now also saves dashboard data
        self.save_history(current_results)
        self.send_email(drops, best_watch, best_phone, current_results)
        return drops
