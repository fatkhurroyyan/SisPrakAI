from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    
    # Go to login page
    page.goto('http://localhost:3000/dosen/login')
    page.wait_for_load_state('networkidle')
    
    # Login
    page.fill('input[type="text"]', 'YSN')
    page.click('button[type="submit"]')
    
    # Wait for the exact URL or a specific element on the dashboard
    page.wait_for_url('http://localhost:3000/dosen')
    page.wait_for_load_state('networkidle')
    
    # Go to nilai page
    page.goto('http://localhost:3000/dosen/nilai')
    page.wait_for_load_state('networkidle')
    time.sleep(2)
    
    # Extract content
    rows = page.locator('tr').all_inner_texts()
    print("NILAI TABLE ROWS:")
    for row in rows:
        print(row)
        
    print("\n----------------\n")
    
    # Go to kehadiran page
    page.goto('http://localhost:3000/dosen/kehadiran')
    page.wait_for_load_state('networkidle')
    time.sleep(2)
    
    rows = page.locator('tr').all_inner_texts()
    print("KEHADIRAN TABLE ROWS:")
    for row in rows:
        print(row)
        
    browser.close()
