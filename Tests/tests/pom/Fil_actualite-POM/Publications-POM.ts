import { Locator, Page } from "@playwright/test";





export class PublicationsPOM {

    private page: Page

    // Les éléments de la section de création de publication
    private publicationBlock: Locator
    private publicationButton: Locator
    private publicationInput: Locator


    // Les éléments de la section de consultation des publications dans le fil d'actualité
    private publicationRealiseeBlock: Locator


    constructor(page: Page){
        this.page = page
        this.publicationBlock = page.locator('post-form')
        this.publicationButton = page.locator('post-submit-btn')
        this.publicationInput = page.locator('#post-text')
        this.publicationRealiseeBlock = page.locator('home-feed-section')

    }
}