require('dotenv').config();
const express = require('express');
const cron = require('node-cron');
const path = require('path');
const Scraper = require('./scraper');
const PriceEngine = require('./engine');

const app = express();
const PORT = process.env.PORT || 3000;

const scraper = new Scraper();
const engine = new PriceEngine();

const startTime = new Date();
const endTime = new Date(startTime.getTime() + 30 * 24 * 60 * 60 * 1000);

console.log(`Agent starting. Will run until ${endTime.toISOString()}`);

async function runTask() {
    if (new Date() > endTime) {
        console.log("30-day limit reached. Agent stopping.");
        process.exit(0);
    }

    console.log(`\n--- Starting run at ${new Date().toISOString()} ---`);
    try {
        const results = await scraper.runAll();
        console.log(`Scraped ${results.length} items.`);
        await engine.process(results);
        console.log("Run completed successfully.");
    } catch (e) {
        console.error(`Error during agent run: ${e.message}`);
    }
}

// Schedule: 3 times daily (every 8 hours: 00:00, 08:00, 16:00)
cron.schedule('0 */8 * * *', runTask);

// Serve dashboard
app.use(express.static(path.join(__dirname, 'dashboard')));

app.get('/api/data', (req, res) => {
    const dataPath = path.join(__dirname, 'dashboard', 'data.json');
    res.sendFile(dataPath);
});

app.listen(PORT, () => {
    console.log(`Dashboard available at http://localhost:${PORT}`);

    // Initial run
    if (process.env.SKIP_INITIAL !== '1') {
        runTask();
    }
});
