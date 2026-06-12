const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const htmlEscape = require('escape-html');

class PriceEngine {
    constructor(historyFile = "price_tracker/history.json") {
        this.historyFile = historyFile;
        this.history = this.loadHistory();
        this.recipientEmail = process.env.RECIPIENT_EMAIL || "mshaik467@gmail.com";
        this.senderEmail = process.env.SENDER_EMAIL || "tracker@example.com";
        this.senderPassword = process.env.SENDER_PASSWORD;
        this.emailLog = "price_tracker/sent_emails.html";
        this.dashboardData = "price_tracker/dashboard/data.json";
    }

    loadHistory() {
        if (fs.existsSync(this.historyFile)) {
            try {
                return JSON.parse(fs.readFileSync(this.historyFile, 'utf8'));
            } catch (e) {
                return [];
            }
        }
        return [];
    }

    saveHistory(newResults) {
        const entry = {
            timestamp: new Date().toISOString(),
            results: newResults
        };
        this.history.push(entry);
        if (this.history.length > 30) this.history.shift();

        fs.writeFileSync(this.historyFile, JSON.stringify(this.history, null, 4));

        // Save to dashboard data
        const dashboardDir = path.dirname(this.dashboardData);
        if (!fs.existsSync(dashboardDir)) fs.mkdirSync(dashboardDir, { recursive: true });
        fs.writeFileSync(this.dashboardData, JSON.stringify(entry, null, 4));
    }

    findPreviousPrice(retailer, title) {
        if (this.history.length < 1) return null;
        const prevRun = this.history[this.history.length - 1].results;
        const item = prevRun.find(i => i.retailer === retailer && i.title === title);
        return item ? item.price : null;
    }

    generateReport(currentResults) {
        const drops = [];
        let bestWatch = null;
        let bestPhone = null;

        for (const item of currentResults) {
            const prevPrice = this.findPreviousPrice(item.retailer, item.title);
            if (prevPrice && item.price < prevPrice) {
                item.prevPrice = prevPrice;
                item.drop = prevPrice - item.price;
                drops.push(item);
            }

            if (item.category === 'Watch') {
                if (!bestWatch || item.price < bestWatch.price) bestWatch = item;
            } else if (item.category === 'Phone') {
                if (!bestPhone || item.price < bestPhone.price) bestPhone = item;
            }
        }

        return { drops, bestWatch, bestPhone };
    }

    async sendEmail(drops, bestWatch, bestPhone, currentResults) {
        const dateStr = new Date().toLocaleString();
        let body = `<h2>Samsung Price Report - ${dateStr}</h2>`;

        if (drops.length > 0) {
            body += "<h3>🚨 Price Drops Detected!</h3><ul>";
            for (const item of drops) {
                const t = htmlEscape(item.title);
                const r = htmlEscape(item.retailer);
                body += `<li><b>${t}</b> at ${r}: <span style='color:green'>$${item.price}</span> (was $${item.prevPrice})</li>`;
            }
            body += "</ul>";
        } else {
            body += "<p>No price drops detected since the last run.</p>";
        }

        body += "<h3>🏆 Best Current Deals</h3>";
        if (bestWatch) {
            const t = htmlEscape(bestWatch.title);
            const r = htmlEscape(bestWatch.retailer);
            body += `<p><b>Cheapest Watch:</b> ${t} - <b>$${bestWatch.price}</b> at ${r}</p>`;
        }
        if (bestPhone) {
            const t = htmlEscape(bestPhone.title);
            const r = htmlEscape(bestPhone.retailer);
            body += `<p><b>Cheapest Phone:</b> ${t} - <b>$${bestPhone.price}</b> at ${r}</p>`;
        }

        body += "<h3>Detailed Comparison</h3>";
        body += "<table border='1'><tr><th>Retailer</th><th>Product</th><th>Current Price</th></tr>";
        const sorted = [...currentResults].sort((a, b) => a.price - b.price).slice(0, 20);
        for (const item of sorted) {
            const t = htmlEscape(item.title);
            const r = htmlEscape(item.retailer);
            body += `<tr><td>${r}</td><td>${t}</td><td>$${item.price}</td></tr>`;
        }
        body += "</table>";

        // Log to file
        const logDir = path.dirname(this.emailLog);
        if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
        fs.appendFileSync(this.emailLog, `<hr><h3>Subject: Daily Samsung Price Report</h3>${body}`);

        if (!this.senderEmail) {
            console.log("Sender email not set. Email logged to file.");
            return;
        }

        const transporter = nodemailer.createTransport(this.senderPassword ? {
            service: 'gmail',
            auth: {
                user: this.senderEmail,
                pass: this.senderPassword
            }
        } : {
            host: 'localhost',
            port: 25,
            tls: { rejectUnauthorized: false }
        });

        const mailOptions = {
            from: this.senderEmail,
            to: this.recipientEmail,
            subject: "Daily Samsung Price Report - Canada",
            html: body
        };

        try {
            await transporter.sendMail(mailOptions);
            console.log("Email sent successfully.");
        } catch (e) {
            console.log(`Failed to send email: ${e.message}. Report saved to ${this.emailLog}`);
        }
    }

    async process(currentResults) {
        const { drops, bestWatch, bestPhone } = this.generateReport(currentResults);
        this.saveHistory(currentResults);
        await this.sendEmail(drops, bestWatch, bestPhone, currentResults);
        return drops;
    }
}

module.exports = PriceEngine;
