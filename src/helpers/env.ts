import "dotenv/config"
import { z } from "zod"

const booleanFromString = z
  .enum(["true", "false"])
  .transform((value) => value === "true")

const env = z
  .object({
    HTTP_PORT: z.coerce.number().int().positive().default(3124),
    TCP_PORT: z.coerce.number().int().positive().default(3113),

    GRPC_HOST: z.string().min(1).default("morrison-grpc"),
    GRPC_PORT: z.coerce.number().int().positive().default(50051),

    EVENT_SERVER_PROTOCOL: z.enum(["http", "https"]).default("http"),
    EVENT_SERVER_HOST: z.string().min(1).default("localhost"),
    EVENT_SERVER_PORT: z.coerce.number().int().positive().default(8766),
    EVENT_SERVER_PATH: z.string().startsWith("/").default("/eventos"),

    SFTP_HOST: z.string().min(1),
    SFTP_PORT: z.coerce.number().int().positive(),
    SFTP_USERNAME: z.string().min(1),
    SFTP_PASSWORD: z.string().min(1),
    SFTP_UPLOAD_DIRECTORY: z.string().startsWith("/"),

    SMTP_HOST: z.string().min(1),
    SMTP_PORT: z.coerce.number().int().positive(),
    SMTP_FROM: z
      .string()
      .email()
      .default("facturas@pequeno-morrison.local"),

    SESSION_COOKIE_NAME: z.string().min(1).default("user_session"),

    SESSION_COOKIE_SECURE: booleanFromString.default(true),

    SESSION_COOKIE_SAME_SITE: z
      .enum(["Strict", "Lax", "None"])
      .default("None"),

    CORS_ALLOWED_ORIGINS: z
      .string()
      .default("http://localhost:5500")
      .transform((value) =>
        value
          .split(",")
          .map((origin) => origin.trim())
          .filter(Boolean),
      ),
  })
  .superRefine((values, ctx) => {
    if (
      values.SESSION_COOKIE_SAME_SITE === "None" &&
      !values.SESSION_COOKIE_SECURE
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["SESSION_COOKIE_SECURE"],
        message:
          "SESSION_COOKIE_SECURE debe ser true cuando SESSION_COOKIE_SAME_SITE es None",
      })
    }
  })
  .parse(process.env)

export default env