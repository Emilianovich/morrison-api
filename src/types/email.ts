export type SendEmail = {
    append?: Buffer<ArrayBuffer>
    from: string;
    to: string;
    subject: string;
    content: string;
    filename: string;
}

export type SendInvoiceEmail = {
    filename: string;
    clientEmail: string;
    bookTitle: string;
    invoiceTotal: number;
    amountOfBooks: number;
    bytesArray: Uint8Array<ArrayBufferLike>;
}