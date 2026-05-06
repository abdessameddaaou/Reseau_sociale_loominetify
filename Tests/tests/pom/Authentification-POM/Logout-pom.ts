import { Locator, Page } from "@playwright/test";

export class LogoutPage {

    private page: Page
    private logoutButton: Locator

    constructor(page: Page) {
        this.page = page
        this.logoutButton = page.locator('xpath=//*[@id="nav-logout-button"]/span/i')
    }

    async clickLogoutButton() {
        await this.logoutButton.click()
    }
}