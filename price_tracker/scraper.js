const { chromium } = require('playwright');

class Scraper {
    constructor() {
        this.results = [];
        this.userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
        this.postalCode = "L5B 2C9";
    }

    cleanPrice(priceStr) {
        if (!priceStr || priceStr === "N/A") return null;
        const clean = priceStr.replace(/[^\d.]/g, '');
        const price = parseFloat(clean);
        return isNaN(price) ? null : price;
    }

    async setStaplesLocation(page) {
        try {
            console.log("Setting Staples location for Mississauga...");
            await page.goto("https://www.staples.ca/", { waitUntil: 'domcontentloaded' });
            await page.waitForTimeout(3000);

            const postalBtn = await page.$("button:has-text('Change location'), .delivery-location-selector");
            if (postalBtn) {
                await postalBtn.click();
                await page.waitForTimeout(1000);
            }

            const postalInput = await page.$("input[placeholder*='Postal Code'], #postal-code-input");
            if (postalInput) {
                await postalInput.fill(this.postalCode);
                await postalInput.press("Enter");
                await page.waitForTimeout(2000);
            }
        } catch (e) {
            console.log(`Could not set Staples location: ${e.message}`);
        }
    }

    async scrapeStaples(page) {
        await this.setStaplesLocation(page);
        const queries = [
            "Samsung Galaxy Watch 7",
            "Samsung Galaxy Watch 8",
            "Samsung Galaxy A15 5G",
            "Samsung Galaxy A14 5G",
            "Samsung Galaxy A13 5G"
        ];

        for (const query of queries) {
            const url = `https://www.staples.ca/search?query=${query.replace(/ /g, '+')}`;
            try {
                console.log(`Scraping Staples for ${query}...`);
                await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
                await page.waitForTimeout(5000);

                const items = await page.$$(".product-thumbnail");
                for (const item of items) {
                    const titleEl = await item.$(".product-thumbnail__title");
                    const priceEl = await item.$(".money");

                    const title = titleEl ? await titleEl.innerText() : "N/A";
                    const priceText = priceEl ? await priceEl.innerText() : "N/A";

                    const titleLower = title.toLowerCase();
                    const isWatch = (titleLower.includes("watch") && (titleLower.includes("7") || titleLower.includes("8")));
                    const isPhone = ((titleLower.includes("a13") || titleLower.includes("a14") || titleLower.includes("a15")) && titleLower.includes("5g"));

                    if (isWatch || isPhone) {
                        const price = this.cleanPrice(priceText);
                        if (price) {
                            const availabilityText = await item.innerText();
                            const availability = availabilityText.includes("Pick up") ? "Available for Pickup (Mississauga)" : "In Stock";

                            this.results.push({
                                retailer: "Staples",
                                title: title.trim(),
                                price: price,
                                currency: "CAD",
                                availability: availability,
                                url: url,
                                timestamp: new Date().toISOString(),
                                category: isWatch ? "Watch" : "Phone"
                            });
                        }
                    }
                }
            } catch (e) {
                console.log(`Error scraping Staples for ${query}: ${e.message}`);
            }
        }
    }

    async setSamsungLocation(page) {
        try {
            console.log("Setting Samsung location for Ontario...");
            await page.goto("https://www.samsung.com/ca/watches/all-watches/", { waitUntil: 'domcontentloaded' });
            await page.waitForTimeout(5000);
            const selector = await page.$("button[aria-label*='Select your province'], .cod03-delivery-location-selector__button");
            if (selector) {
                await selector.click();
                await page.waitForTimeout(2000);
                const ontario = await page.$("text=Ontario");
                if (ontario) {
                    await ontario.click();
                    const confirm = await page.$("button:has-text('Confirm')");
                    if (confirm) {
                        await confirm.click();
                        await page.waitForTimeout(3000);
                    }
                }
            }
        } catch (e) {
            console.log(`Could not set Samsung location: ${e.message}`);
        }
    }

    async scrapeSamsung(page) {
        await this.setSamsungLocation(page);
        const urls = [
            "https://www.samsung.com/ca/watches/all-watches/",
            "https://www.samsung.com/ca/smartphones/galaxy-a/"
        ];

        for (const url of urls) {
            try {
                console.log(`Scraping Samsung for ${url}...`);
                await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
                await page.waitForTimeout(10000);

                const cards = await page.$$("[class*='product-card']");
                for (const card of cards) {
                    const text = await card.innerText();
                    const textLower = text.toLowerCase();

                    const isWatch = (textLower.includes("watch") && (textLower.includes("7") || textLower.includes("8")));
                    const isPhone = ((textLower.includes("a13") || textLower.includes("a14") || textLower.includes("a15")) && textLower.includes("5g"));

                    if (isWatch || isPhone) {
                        const titleEl = await card.$("[class*='name'], [class*='title']");
                        const priceEl = await card.$("[class*='price']");

                        const title = titleEl ? await titleEl.innerText() : "Samsung Product";
                        const priceText = priceEl ? await priceEl.innerText() : "N/A";

                        const price = this.cleanPrice(priceText);
                        if (price) {
                            this.results.push({
                                retailer: "Samsung",
                                title: title.trim(),
                                price: price,
                                currency: "CAD",
                                availability: (textLower.includes("buy") || textLower.includes("add to cart")) ? "In Stock (Ontario)" : "Check Site",
                                url: url,
                                timestamp: new Date().toISOString(),
                                category: isWatch ? "Watch" : "Phone"
                            });
                        }
                    }
                }
            } catch (e) {
                console.log(`Error scraping Samsung ${url}: ${e.message}`);
            }
        }
    }

    async scrapeAmazon(page) {
        const queries = [
            "Samsung Galaxy Watch 7",
            "Samsung Galaxy Watch 8",
            "Samsung Galaxy A15 5G",
            "Samsung Galaxy A14 5G",
            "Samsung Galaxy A13 5G"
        ];

        for (const query of queries) {
            const url = `https://www.amazon.ca/s?k=${query.replace(/ /g, '+')}`;
            try {
                console.log(`Scraping Amazon for ${query}...`);
                await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
                await page.waitForTimeout(5000);

                const items = await page.evaluate(() => {
                    const results = [];
                    const searchResults = document.querySelectorAll(".s-result-item");
                    searchResults.forEach(item => {
                        const titleEl = item.querySelector("h2 span");
                        const priceEl = item.querySelector(".a-price .a-offscreen");
                        if (titleEl && priceEl) {
                            results.push({
                                title: titleEl.innerText,
                                priceText: priceEl.innerText
                            });
                        }
                    });
                    return results;
                });

                for (const item of items) {
                    const { title, priceText } = item;
                    const titleLower = title.toLowerCase();
                    const isWatch = (titleLower.includes("watch") && (titleLower.includes("7") || titleLower.includes("8")));
                    const isPhone = ((titleLower.includes("a13") || titleLower.includes("a14") || titleLower.includes("a15")) && titleLower.includes("5g"));

                    if (isWatch || isPhone) {
                        const price = this.cleanPrice(priceText);
                        if (price) {
                            this.results.push({
                                retailer: "Amazon",
                                title: title.trim(),
                                price: price,
                                currency: "CAD",
                                availability: "In Stock",
                                url: url,
                                timestamp: new Date().toISOString(),
                                category: isWatch ? "Watch" : "Phone"
                            });
                        }
                    }
                }
            } catch (e) {
                console.log(`Error scraping Amazon for ${query}: ${e.message}`);
            }
        }
    }

    async runAll() {
        this.results = [];
        const browser = await chromium.launch({ headless: true });
        const context = await browser.newContext({ userAgent: this.userAgent });
        const page = await context.newPage();

        await this.scrapeStaples(page);
        await this.scrapeSamsung(page);
        await this.scrapeAmazon(page);

        await browser.close();
        return this.results;
    }
}

module.exports = Scraper;
