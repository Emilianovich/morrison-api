import puppeteer, { Browser, Page } from "puppeteer/src/puppeteer.js";

class BrowserService {
    private browser!: Browser;
    constructor() {}
    private async getBrowser() {
        this.browser = await puppeteer.launch({headless: true, args: ['--no-sandbox']});
    }
    async getPage() : Promise<Page> {
        await this.getBrowser();
        return this.browser.newPage()
    }
    async close() {
        await this.getBrowser()
        return this.browser.close()
    }
}

export default BrowserService;