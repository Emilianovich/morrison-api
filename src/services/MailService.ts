import nodemailer from "nodemailer"
import * as SMTPTransport from "nodemailer/lib/smtp-transport/index.js";
import env from "../helpers/env.js";
import type {SendEmail, SendInvoiceEmail} from "../types/email.js";

class MailService {
    private transport : nodemailer.Transporter<SMTPTransport.SentMessageInfo, SMTPTransport.Options>
    private readonly from: string;
    constructor() {
            this.transport = nodemailer.createTransport({
                host: env.SMTP_HOST,
                port: env.SMTP_PORT,
            })
        this.from = "mjdgjmzallxmpzxtyj@gonrr.net";
    }
    private async sendEmail( { from, to, append, subject, content, filename } : SendEmail ) {
        try {
            if (!append) {
                await this.transport.sendMail({
                    from,
                    to,
                    subject,
                    text: content,
                })
            }
            await this.transport.sendMail({
                from,
                to,
                subject,
                text: content,
                attachments: [
                    {
                        filename,
                        content,
                    }
                ]
            })
        } catch (e) {
            console.error(e)
        }

    }

    async sendInvoiceEmail({ bookTitle, invoiceTotal, amountOfBooks, bytesArray, clientEmail, filename } : SendInvoiceEmail) {
        const message = `Saludos. Esta es tu confirmación del pedido que realizaste del libro ${bookTitle}. Tu pedido fue de ${amountOfBooks} libro(s). El total de tu compra ha sido de $${invoiceTotal}.`
        const append = Buffer.from(bytesArray)
        await this.sendEmail({
            from : this.from,
            to: clientEmail,
            append,
            content: message,
            subject: "Confirmación de pedido",
            filename
        })
    }
}

export default MailService
