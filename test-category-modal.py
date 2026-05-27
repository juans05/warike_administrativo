#!/usr/bin/env python3
from playwright.sync_api import sync_playwright
import json
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)
    page = browser.new_page()

    # Navigate to dashboard
    page.goto('http://localhost:3002/inicio')
    page.wait_for_load_state('networkidle')

    # Check if we're logged in by looking for localStorage token
    token = page.evaluate('() => localStorage.getItem("token")')

    if not token:
        print("❌ Not logged in - need valid token in localStorage")
        print("Please log in manually or set token in localStorage")
        browser.close()
        exit(1)

    print("✅ Logged in successfully")

    # Navigate to carta page
    print("\n📄 Navigating to Carta page...")
    page.goto('http://localhost:3002/carta')
    page.wait_for_load_state('networkidle')
    time.sleep(2)  # Wait for animations

    # Take screenshot of initial state
    page.screenshot(path='carta_initial.png', full_page=True)
    print("📸 Screenshot 1: Initial carta page saved")

    # Check if there are existing categories
    categories = page.locator('h2:has-text("NUEVA CATEGORÍA"), h2:has-text("EDITAR CATEGORÍA")').count()
    print(f"📊 Found {categories} category sections visible")

    # Look for the "Crear mi primera categoría" button or "Agregar" buttons
    try:
        create_first_button = page.locator('text=Crear mi primera categoría')
        if create_first_button.is_visible():
            print("\n✨ Testing: Creating first category...")
            create_first_button.click()
            time.sleep(0.5)

            # Take screenshot of modal
            page.screenshot(path='category_modal_create.png', full_page=True)
            print("📸 Screenshot 2: Category creation modal saved")

            # Test modal interaction
            input_field = page.locator('input[placeholder="Nombre de la categoría"]')
            if input_field.is_visible():
                input_field.fill('Test Category 🍕')
                print("✅ Typed category name: 'Test Category 🍕'")
                time.sleep(0.3)

                # Take screenshot with text entered
                page.screenshot(path='category_modal_filled.png', full_page=True)
                print("📸 Screenshot 3: Modal with filled text saved")

                # Test keyboard support (Enter key)
                print("\n⌨️  Testing keyboard support (Enter key)...")
                input_field.press('Enter')
                time.sleep(1)

                # Check if modal closed
                if not input_field.is_visible():
                    print("✅ Modal closed after pressing Enter")
                else:
                    print("⚠️  Modal still visible after Enter key")
            else:
                print("❌ Input field not found in modal")
        else:
            print("\n✨ Testing: Adding category to existing structure...")
            # Try to find an "Agregar" button
            add_buttons = page.locator('text=Agregar')
            if add_buttons.count() > 0:
                print(f"Found {add_buttons.count()} 'Agregar' buttons")
    except Exception as e:
        print(f"Error during test: {e}")

    # Take final screenshot
    page.screenshot(path='carta_final.png', full_page=True)
    print("\n📸 Screenshot 4: Final state saved")

    print("\n✅ Test completed!")
    print("Screenshots saved: carta_initial.png, category_modal_create.png, category_modal_filled.png, carta_final.png")

    browser.close()
