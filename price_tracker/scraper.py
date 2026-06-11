import asyncio
import json
import os
import re
from datetime import datetime
from playwright.async_api import async_playwright

class Scraper:
    def __init__(self):
        self.results = []
        self.user_agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
        self.postal_code = "L5B 2C9" # Mississauga City Hall postal code

    def clean_price(self, price_str):
        if not price_str or price_str == "N/A":
            return None
        clean = re.sub(r'[^\d.]', '', price_str)
        try:
            return float(clean)
        except ValueError:
            return None

    async def set_staples_location(self, page):
        try:
            print("Setting Staples location for Mississauga...")
            await page.goto("https://www.staples.ca/", wait_until="domcontentloaded")
            await asyncio.sleep(3)

            postal_btn = await page.query_selector("button:has-text('Change location'), .delivery-location-selector")
            if postal_btn:
                await postal_btn.click()
                await asyncio.sleep(1)

            postal_input = await page.query_selector("input[placeholder*='Postal Code'], #postal-code-input")
            if postal_input:
                await postal_input.fill(self.postal_code)
                await postal_input.press("Enter")
                await asyncio.sleep(2)
        except Exception as e:
            print(f"Could not set Staples location: {e}")

    async def scrape_staples(self, page):
        await self.set_staples_location(page)
        queries = [
            "Samsung Galaxy Watch 7",
            "Samsung Galaxy Watch 8",
            "Samsung Galaxy A15 5G",
            "Samsung Galaxy A14 5G",
            "Samsung Galaxy A13 5G"
        ]

        for query in queries:
            url = f"https://www.staples.ca/search?query={query.replace(' ', '+')}"
            try:
                print(f"Scraping Staples for {query}...")
                await page.goto(url, wait_until="domcontentloaded", timeout=60000)
                await asyncio.sleep(5)

                items = await page.query_selector_all(".product-thumbnail")
                for item in items:
                    title_el = await item.query_selector(".product-thumbnail__title")
                    price_el = await item.query_selector(".money")

                    title = await title_el.inner_text() if title_el else "N/A"
                    price_text = await price_el.inner_text() if price_el else "N/A"

                    title_lower = title.lower()
                    is_watch = ("watch" in title_lower and ("7" in title_lower or "8" in title_lower))
                    is_phone = (("a13" in title_lower or "a14" in title_lower or "a15" in title_lower) and "5g" in title_lower)

                    if is_watch or is_phone:
                        price = self.clean_price(price_text)
                        if price:
                            availability_text = await item.inner_text()
                            availability = "Available for Pickup (Mississauga)" if "Pick up" in availability_text else "In Stock"

                            self.results.append({
                                "retailer": "Staples",
                                "title": title.strip(),
                                "price": price,
                                "currency": "CAD",
                                "availability": availability,
                                "url": url,
                                "timestamp": datetime.now().isoformat(),
                                "category": "Watch" if is_watch else "Phone"
                            })
            except Exception as e:
                print(f"Error scraping Staples for {query}: {e}")

    async def set_samsung_location(self, page):
        try:
            print("Setting Samsung location for Ontario...")
            await page.goto("https://www.samsung.com/ca/watches/all-watches/", wait_until="domcontentloaded")
            await asyncio.sleep(5)
            selector = await page.query_selector("button[aria-label*='Select your province'], .cod03-delivery-location-selector__button")
            if selector:
                await selector.click()
                await asyncio.sleep(2)
                ontario = await page.query_selector("text=Ontario")
                if ontario:
                    await ontario.click()
                    confirm = await page.query_selector("button:has-text('Confirm')")
                    if confirm:
                        await confirm.click()
                        await asyncio.sleep(3)
        except Exception as e:
            print(f"Could not set Samsung location: {e}")

    async def scrape_samsung(self, page):
        await self.set_samsung_location(page)
        urls = [
            "https://www.samsung.com/ca/watches/all-watches/",
            "https://www.samsung.com/ca/smartphones/galaxy-a/"
        ]

        for url in urls:
            try:
                print(f"Scraping Samsung for {url}...")
                await page.goto(url, wait_until="domcontentloaded", timeout=60000)
                await asyncio.sleep(10)

                cards = await page.query_selector_all("[class*='product-card']")
                for card in cards:
                    text = await card.inner_text()
                    text_lower = text.lower()

                    is_watch = ("watch" in text_lower and ("7" in text_lower or "8" in text_lower))
                    is_phone = (("a13" in text_lower or "a14" in text_lower or "a15" in text_lower) and "5g" in text_lower)

                    if is_watch or is_phone:
                        title_el = await card.query_selector("[class*='name'], [class*='title']")
                        price_el = await card.query_selector("[class*='price']")

                        title = await title_el.inner_text() if title_el else "Samsung Product"
                        price_text = await price_el.inner_text() if price_el else "N/A"

                        price = self.clean_price(price_text)
                        if price:
                            self.results.append({
                                "retailer": "Samsung",
                                "title": title.strip(),
                                "price": price,
                                "currency": "CAD",
                                "availability": "In Stock (Ontario)" if "buy" in text_lower or "add to cart" in text_lower else "Check Site",
                                "url": url,
                                "timestamp": datetime.now().isoformat(),
                                "category": "Watch" if is_watch else "Phone"
                            })
            except Exception as e:
                print(f"Error scraping Samsung {url}: {e}")

    async def scrape_amazon(self, page):
        queries = [
            "Samsung Galaxy Watch 7",
            "Samsung Galaxy Watch 8",
            "Samsung Galaxy A15 5G",
            "Samsung Galaxy A14 5G",
            "Samsung Galaxy A13 5G"
        ]

        for query in queries:
            url = f"https://www.amazon.ca/s?k={query.replace(' ', '+')}"
            try:
                print(f"Scraping Amazon for {query}...")
                await page.goto(url, wait_until="domcontentloaded", timeout=60000)
                await asyncio.sleep(5)

                items = await page.evaluate('''() => {
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
                }''')

                for item in items:
                    title = item["title"]
                    price_text = item["priceText"]

                    title_lower = title.lower()
                    is_watch = ("watch" in title_lower and ("7" in title_lower or "8" in title_lower))
                    is_phone = (("a13" in title_lower or "a14" in title_lower or "a15" in title_lower) and "5g" in title_lower)

                    if is_watch or is_phone:
                        price = self.clean_price(price_text)
                        if price:
                            self.results.append({
                                "retailer": "Amazon",
                                "title": title.strip(),
                                "price": price,
                                "currency": "CAD",
                                "availability": "In Stock",
                                "url": url,
                                "timestamp": datetime.now().isoformat(),
                                "category": "Watch" if is_watch else "Phone"
                            })
            except Exception as e:
                print(f"Error scraping Amazon for {query}: {e}")

    async def run_all(self):
        # Clear results from previous run to avoid data duplication
        self.results = []

        async with async_playwright() as p:
            browser = await p.chromium.launch()
            context = await browser.new_context(user_agent=self.user_agent)
            page = await context.new_page()

            await self.scrape_staples(page)
            await self.scrape_samsung(page)
            await self.scrape_amazon(page)

            await browser.close()

        return self.results

if __name__ == "__main__":
    if not os.path.exists("price_tracker"):
        os.makedirs("price_tracker")
    scraper = Scraper()
    results = asyncio.run(scraper.run_all())
    with open("price_tracker/current_results.json", "w") as f:
        json.dump(results, f, indent=4)
    print(f"Scraped {len(results)} items in total.")
