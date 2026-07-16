import "dotenv/config"
import {z} from "zod";



const env = z.object({
    SFTP_HOST: z.string("Host para el servidor SFTP no fue proveído").min(1),
    SFTP_PORT: z.coerce.number("Número de puerto para el servidor SFTP no fue proveído").int().positive(),
    SFTP_USERNAME: z.string("Nombre de usuario para el servidor SFTP no fue proveído").min(1),
    SFTP_PASSWORD: z.string("Contraseña para el servidor SFTP no fue proveído").min(1),
    SFTP_UPLOAD_DIRECTORY: z.string("Directorio para el servidor SFTP no fue proveído").startsWith("/"),
    SMTP_HOST: z.string("Host para el servidor SFTP no fue proveído").min(1),
    SMTP_PORT: z.coerce.number("Número de puerto para el servidor SMTP no fue proveído").int().positive(),
}).parse(process.env);

export default env;