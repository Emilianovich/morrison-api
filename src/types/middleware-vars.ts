export type MiddlewareVars = {
    Variables:  {
        session_cookie: string;
}
}

export type GenerateInvoiceProps = {
    invoiceId: string;
    clientId: string;
    bookId: string;
    bookTitle: string;
    invoiceTotal: number;
    amountOfBooks: number;
}