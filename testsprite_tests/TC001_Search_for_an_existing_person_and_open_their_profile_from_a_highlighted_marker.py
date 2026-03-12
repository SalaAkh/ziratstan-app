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
        # -> Navigate to http://localhost:8080/D:\User\Desktop\Programms\Ziratstan.kz
        await page.goto("http://localhost:8080/D:\User\Desktop\Programms\Ziratstan.kz", wait_until="commit", timeout=10000)
        
        # -> Navigate to http://localhost:8080/D:\User\Desktop\Programms\Ziratstan.kz
        await page.goto("http://localhost:8080/D:\User\Desktop\Programms\Ziratstan.kz", wait_until="commit", timeout=10000)
        
        # -> Navigate to http://localhost:8080/D:\User\Desktop\Programms\Ziratstan.kz
        await page.goto("http://localhost:8080/D:\User\Desktop\Programms\Ziratstan.kz", wait_until="commit", timeout=10000)
        
        # --> Assertions to verify final state
        frame = context.pages[-1]
        # The page appears to be missing (404). Report and stop the test here.
        content = await frame.locator('xpath=/html/body').inner_text()
        assert any(sub in content for sub in ["No webpage was found", "HTTP ERROR 404", "This localhost page can’t be found", "404"]), "Expected a 'page not found' (404) message — the tested feature/page appears to be missing."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    