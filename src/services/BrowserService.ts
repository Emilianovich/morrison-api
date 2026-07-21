import puppeteer, { type Browser, type Page } from "puppeteer"

class BrowserService {
  private browser?: Browser

  async getPage(): Promise<Page> {
    this.browser ??= await puppeteer.launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] })
    return this.browser.newPage()
  }

  async close(): Promise<void> {
    if (!this.browser) return
    await this.browser.close()
    this.browser = undefined
  }
}

export default BrowserService
