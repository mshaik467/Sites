import asyncio
import time
import os
import sys
from datetime import datetime, timedelta
from price_tracker.scraper import Scraper
from price_tracker.engine import PriceEngine

async def run_agent():
    print("Starting Samsung Price Tracker Agent...", flush=True)
    start_time = datetime.now()
    end_time = start_time + timedelta(days=30)

    print(f"Agent will run until: {end_time.isoformat()}", flush=True)

    scraper = Scraper()
    engine = PriceEngine()

    while datetime.now() < end_time:
        print(f"\n--- Starting run at {datetime.now().isoformat()} ---", flush=True)
        try:
            results = await scraper.run_all()
            print(f"Scraped {len(results)} items.", flush=True)

            engine.process(results)
            print("Run completed successfully.", flush=True)

        except Exception as e:
            print(f"Error during agent run: {e}", flush=True)

        print("Waiting 8 hours for next run...", flush=True)
        if os.environ.get("FAST_MODE") == "1":
             break

        # Use asyncio.sleep instead of time.sleep in an async function
        await asyncio.sleep(8 * 3600)

    print("Agent has reached the 30-day limit and is stopping.", flush=True)

if __name__ == "__main__":
    asyncio.run(run_agent())
