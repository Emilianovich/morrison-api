import nodemailer from "nodemailer"
import env from "../helpers/env.js"
import type { SendInvoiceEmail } from "../types/email.js"
import { formatCents } from "../utils/money.js"

class MailService {
  private readonly transport = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: false,
  })

  async sendInvoiceEmail(props: SendInvoiceEmail): Promise<void> {
    const message = `Saludos. Esta es la confirmación de tu compra de ${props.amountOfBooks} unidad(es) de ${props.bookTitle}. El total fue ${formatCents(props.invoiceTotalInCents)}.`
    await this.transport.sendMail({
      from: env.SMTP_FROM,
      to: props.clientEmail,
      subject: "Confirmación de pedido - Pequeño Morrison",
      text: message,
      attachments: [{ filename: props.filename, content: Buffer.from(props.bytesArray) }],
    })
  }
}

export default MailService
