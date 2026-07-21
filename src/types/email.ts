export type SendInvoiceEmail = {
  filename: string
  clientEmail: string
  bookTitle: string
  invoiceTotalInCents: number
  amountOfBooks: number
  bytesArray: Uint8Array<ArrayBufferLike>
}
