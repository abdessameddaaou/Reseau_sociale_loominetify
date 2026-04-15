import { Locator, Page } from "@playwright/test";

export class LogoutPage {

    private page: Page
    private logoutButton: Locator

    constructor(page: Page) {
        this.page = page
        this.logoutButton = page.locator('#nav-logout-button')
    }

    async clickLogoutButton() {
        await this.logoutButton.click()
    }
}