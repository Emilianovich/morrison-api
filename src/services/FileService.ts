import SftpClient from "ssh2-sftp-client"
import env from "../helpers/env.js"
import BrowserService from "./BrowserService.js";
import type {GenerateInvoiceProps} from "../types/middleware-vars.js";

type SaveInvoice = {
    bytesArray : Uint8Array<ArrayBufferLike>;
    fileName: string;
}
class FileService {
    private readonly sftpClient : SftpClient
    private readonly browser: BrowserService
    constructor() {
        this.sftpClient = new SftpClient()
        this.browser = new BrowserService()
    }
    private async connect()  {
        try {
            await this.sftpClient.connect({
                host: env.SFTP_HOST,
                port: env.SFTP_PORT,
                username: env.SFTP_USERNAME,
                password: env.SFTP_PASSWORD,
            })
        } catch (error) {
            console.error(error)
        }

    }

    private async end() {
        try {
            await this.sftpClient.end()
        } catch (error) {
            console.error(error)
        }
    }

    async createInvoice(props: GenerateInvoiceProps) {
        const page = await this.browser.getPage()
        await page.setContent("" +
            "<!doctype html>" +
            "<html lang='es'>" +
                "<head>" +
                    "<body>" +
                        `<h1>Factura emitida al cliente ${props.clientId} el ${new Date(Date.now()).toLocaleString()}</h1>` +
                        `<p>Compra exitosa de ${props.amountOfBooks} ${props.amountOfBooks > 1 ? "unidades" : "unidad"} del libro ${props.bookTitle}.</p>` +
                        "<hr />" +
                        `<p style='font-weight: bold'>Total : $${props.invoiceTotal}</p>` +
                    "</body>" +
                "</head>" +
            "</html>")
        await this.browser.close();
        return {
            bytesArray : await page.pdf(),
            fileName: `${props.invoiceId}-client_${props.clientId}.pdf`
        }
    }
    async saveInvoice({ bytesArray, fileName } : SaveInvoice) {
        try {
            await this.connect()
            await this.sftpClient.put(Buffer.from(bytesArray), `/invoices/${fileName}`)
            await this.end()
        } catch (err) {
            console.log(err)
        }
    }
}

export default FileService