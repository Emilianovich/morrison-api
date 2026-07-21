import { credentials } from "@grpc/grpc-js"
import env from "../helpers/env.js"
import { AuthServiceClient } from "../generated/auth.js"
import { BookServiceClient } from "../generated/books.js"
import { ClientServiceClient } from "../generated/clients.js"

const address = `${env.GRPC_HOST}:${env.GRPC_PORT}`
const channelCredentials = credentials.createInsecure()

export const authGrpcClient = new AuthServiceClient(address, channelCredentials)
export const bookGrpcClient = new BookServiceClient(address, channelCredentials)
export const clientGrpcClient = new ClientServiceClient(address, channelCredentials)
