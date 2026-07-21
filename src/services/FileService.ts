import path from "node:path/posix"
import SftpClient from "ssh2-sftp-client"
import env from "../helpers/env.js"
import type { GenerateInvoiceProps } from "../types/middleware-vars.js"
import { formatCents } from "../utils/money.js"
import BrowserService from "./BrowserService.js"

type SaveInvoice = { bytesArray: Uint8Array<ArrayBufferLike>; fileName: string }

class FileService {
  private readonly browser = new BrowserService()

  async createInvoice(props: GenerateInvoiceProps): Promise<SaveInvoice> {
    const page = await this.browser.getPage()
    try {
      await page.setContent(`
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Factura ${props.invoiceId}</title>

  <style>
    @page {
      size: A4;
      margin: 0;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      background: #f4f1ef;
      color: #2b2528;
      font-family: "Goga", "Helvetica Neue", Arial, sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .invoice {
      position: relative;
      width: 100%;
      min-height: 100vh;
      padding: 54px;
      overflow: hidden;
      background:
        radial-gradient(
          circle at top right,
          rgba(255, 177, 115, 0.28),
          transparent 34%
        ),
        linear-gradient(
          145deg,
          #ffffff 0%,
          #fff9f4 100%
        );
    }

    .decorative-circle {
      position: absolute;
      border-radius: 999px;
      opacity: 0.14;
    }

    .circle-one {
      width: 240px;
      height: 240px;
      top: -110px;
      right: -70px;
      background: #ca2851;
    }

    .circle-two {
      width: 180px;
      height: 180px;
      bottom: -90px;
      left: -70px;
      background: #ffb173;
    }

    .header {
      position: relative;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 34px;
      border-bottom: 2px solid #ffe3b3;
      z-index: 1;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .brand-mark {
      display: grid;
      place-items: center;
      width: 58px;
      height: 58px;
      border-radius: 18px;
      color: #ffffff;
      font-family: Georgia, serif;
      font-size: 32px;
      font-weight: 700;
      background: linear-gradient(
        135deg,
        #ca2851,
        #ff6766
      );
      box-shadow: 0 10px 24px rgba(202, 40, 81, 0.2);
    }

    .brand-name {
      margin: 0;
      color: #ca2851;
      font-size: 30px;
      font-weight: 700;
      letter-spacing: -0.8px;
    }

    .brand-description {
      margin: 4px 0 0;
      color: #786970;
      font-size: 13px;
      letter-spacing: 1.5px;
      text-transform: uppercase;
    }

    .invoice-heading {
      text-align: right;
    }

    .invoice-heading h2 {
      margin: 0;
      color: #2b2528;
      font-size: 32px;
      font-weight: 600;
      letter-spacing: -0.5px;
    }

    .invoice-number {
      display: inline-block;
      margin-top: 8px;
      padding: 7px 13px;
      border-radius: 999px;
      color: #8e2945;
      background: #ffe3b3;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.5px;
    }

    .information-grid {
      position: relative;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 22px;
      margin-top: 34px;
      z-index: 1;
    }

    .information-card {
      padding: 22px;
      border: 1px solid rgba(202, 40, 81, 0.1);
      border-radius: 20px;
      background: rgba(255, 255, 255, 0.84);
      box-shadow: 0 10px 30px rgba(63, 42, 50, 0.06);
    }

    .label {
      display: block;
      margin-bottom: 7px;
      color: #ca2851;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 1.5px;
      text-transform: uppercase;
    }

    .value {
      margin: 0;
      color: #40383c;
      font-size: 15px;
      line-height: 1.5;
      overflow-wrap: anywhere;
    }

    .details {
      position: relative;
      margin-top: 40px;
      z-index: 1;
    }

    .section-title {
      margin: 0 0 18px;
      color: #2b2528;
      font-size: 20px;
      font-weight: 600;
    }

    .table {
      overflow: hidden;
      border: 1px solid rgba(202, 40, 81, 0.1);
      border-radius: 20px;
      background: #ffffff;
      box-shadow: 0 14px 34px rgba(63, 42, 50, 0.07);
    }

    .table-row {
      display: grid;
      grid-template-columns: 2.3fr 0.65fr 1fr 1fr;
      align-items: center;
      gap: 16px;
      padding: 19px 22px;
    }

    .table-header {
      color: #ffffff;
      background: linear-gradient(
        90deg,
        #ca2851,
        #ff6766
      );
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.8px;
      text-transform: uppercase;
    }

    .table-content {
      min-height: 84px;
      color: #40383c;
      font-size: 14px;
    }

    .book-title {
      font-size: 16px;
      font-weight: 600;
    }

    .numeric {
      text-align: right;
    }

    .summary {
      display: flex;
      justify-content: flex-end;
      margin-top: 28px;
    }

    .summary-card {
      width: 310px;
      padding: 22px 24px;
      border-radius: 22px;
      color: #ffffff;
      background: linear-gradient(
        135deg,
        #ca2851,
        #ff6766 58%,
        #ffb173
      );
      box-shadow: 0 16px 34px rgba(202, 40, 81, 0.22);
    }

    .summary-label {
      margin: 0;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 1.4px;
      text-transform: uppercase;
      opacity: 0.85;
    }

    .summary-total {
      margin: 7px 0 0;
      font-size: 32px;
      font-weight: 700;
      letter-spacing: -0.6px;
    }

    .footer {
      position: absolute;
      right: 54px;
      bottom: 42px;
      left: 54px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding-top: 20px;
      border-top: 1px solid #ecdcd6;
      color: #817278;
      font-size: 11px;
    }

    .footer-message {
      max-width: 420px;
      margin: 0;
      line-height: 1.6;
    }

    .footer-brand {
      color: #ca2851;
      font-weight: 700;
    }
  </style>
</head>

<body>
  <main class="invoice">
    <div class="decorative-circle circle-one"></div>
    <div class="decorative-circle circle-two"></div>

    <header class="header">
      <div class="brand">
        <div class="brand-mark">M</div>

        <div>
          <h1 class="brand-name">Pequeño Morrison</h1>
          <p class="brand-description">Historias para recordar</p>
        </div>
      </div>

      <div class="invoice-heading">
        <h2>Factura</h2>
        <span class="invoice-number">#${props.invoiceId}</span>
      </div>
    </header>

    <section class="information-grid">
      <article class="information-card">
        <span class="label">Cliente</span>
        <p class="value">${props.clientId}</p>
      </article>

      <article class="information-card">
        <span class="label">Fecha de emisión</span>
        <p class="value">
          ${new Date().toLocaleString("es-PA", {
        dateStyle: "long",
        timeStyle: "short",
      })}
        </p>
      </article>
    </section>

    <section class="details">
      <h3 class="section-title">Detalle de la compra</h3>

      <div class="table">
        <div class="table-row table-header">
          <span>Libro</span>
          <span class="numeric">Cantidad</span>
          <span class="numeric">Precio unitario</span>
          <span class="numeric">Subtotal</span>
        </div>

        <div class="table-row table-content">
          <span class="book-title">${props.bookTitle}</span>
          <span class="numeric">${props.amountOfBooks}</span>
          <span class="numeric">
            ${formatCents(props.unitPriceInCents)}
          </span>
          <span class="numeric">
            ${formatCents(props.invoiceTotalInCents)}
          </span>
        </div>
      </div>

      <div class="summary">
        <div class="summary-card">
          <p class="summary-label">Total pagado</p>
          <p class="summary-total">
            ${formatCents(props.invoiceTotalInCents)}
          </p>
        </div>
      </div>
    </section>

    <footer class="footer">
      <p class="footer-message">
        Gracias por comprar en
        <span class="footer-brand">Pequeño Morrison</span>.
        Esperamos que disfrutes tu próxima lectura.
      </p>

      <span>Documento generado automáticamente</span>
    </footer>
  </main>
</body>
</html>
`)
      const bytesArray = await page.pdf({ format: "A4", printBackground: true })
      return { bytesArray, fileName: `${props.invoiceId}-client_${props.clientId}.pdf` }
    } finally {
      await page.close()
      await this.browser.close()
    }
  }

  async saveInvoice({ bytesArray, fileName }: SaveInvoice): Promise<void> {
    const sftpClient = new SftpClient()
    try {
      await sftpClient.connect({
        host: env.SFTP_HOST,
        port: env.SFTP_PORT,
        username: env.SFTP_USERNAME,
        password: env.SFTP_PASSWORD,
      })
      const directory = env.SFTP_UPLOAD_DIRECTORY
      if (!(await sftpClient.exists(directory))) await sftpClient.mkdir(directory, true)
      await sftpClient.put(Buffer.from(bytesArray), path.join(directory, fileName))
    } finally {
      await sftpClient.end().catch(() => undefined)
    }
  }
}

export default FileService
