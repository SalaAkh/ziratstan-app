import asyncio
from playwright import async_api
from playwright.async_api import expect

async def run_test():
    pw = None
    browser = None
    context = None

    try:
        # Start a Playwright session in asynchronous mode
        pw = await async_api.async_playwright().start()

        # Launch a Chromium browser in headless mode with custom arguments
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--window-size=1280,720",         # Set the browser window size
                "--disable-dev-shm-usage",        # Avoid using /dev/shm which can cause issues in containers
                "--ipc=host",                     # Use host-level IPC for better stability
                "--single-process"                # Run the browser in a single process mode
            ],
        )

        # Create a new browser context (like an incognito window)
        context = await browser.new_context()
        context.set_default_timeout(5000)

        # Open a new page in the browser context
        page = await context.new_page()

        # Interact with the page elements to simulate user flow
        # -> Navigate to http://localhost:3000/D:\User\Desktop\Programms\Ziratstan.kz
        await page.goto("http://localhost:3000/D:\User\Desktop\Programms\Ziratstan.kz", wait_until="commit", timeout=10000)
        
        # -> Navigate to https://ziratstan-app.web.app/map.html and load the map page
        await page.goto("https://ziratstan-app.web.app/map.html", wait_until="commit", timeout=10000)
        
        # -> Click an individual marker on the map to open its popup (attempt marker element index 5890).
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div/div/div/div[4]/div[50]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        
        # -> Click a different individual marker on the map to try to open its popup (click element index 6206).
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div/div/div/div[4]/div[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        
        # --> Assertions to verify final state
        frame = context.pages[-1]
        # Assertions for map page and marker popup
        map_locator = frame.locator('xpath=/html/body/nav/div[1]/a[2]')
        assert await map_locator.is_visible(), 'Map element (/html/body/nav/div[1]/a[2]) is not visible'
        marker_locator = frame.locator('xpath=/html/body/div[1]/div[1]/div[1]/div[4]/div[2]')
        assert await marker_locator.is_visible(), 'Map markers (/html/body/div[1]/div[1]/div[1]/div[4]/div[2]) are not visible'
        # Verify the marker popup is visible after clicking a marker
        popup_locator = frame.locator('xpath=/html/body/div[1]/div[1]/div[1]/div[6]/div/div[2]')
        assert await popup_locator.is_visible(), 'Marker popup (/html/body/div[1]/div[1]/div[1]/div[6]/div/div[2]) is not visible'
        # Check for the popup action link (expected to open full profile)
        profile_link = frame.locator('xpath=/html/body/div[1]/div[1]/div[1]/div[6]/div/div[1]/div/div/a')
        assert await profile_link.is_visible(), 'Profile action link (/html/body/div[1]/div[1]/div[1]/div[6]/div/div[1]/div/div/a) is not visible'
        profile_text = (await profile_link.inner_text()).strip()
        if 'Ашырту' not in profile_text:
            raise AssertionError(f"Expected text 'Ашырту' in popup action but it was not found. Found text: '{profile_text}'. The expected action label appears to be missing or different; reporting issue and stopping the test.")
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    