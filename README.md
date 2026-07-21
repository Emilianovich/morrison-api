# morrison-api

API REST en Hono que adapta HTTP y TCP a los servicios gRPC de Pequeño Morrison. También genera facturas PDF, las almacena por SFTP, las envía por SMTP y publica eventos al servidor WebSocket.

## Desarrollo

```bash
corepack enable
pnpm install
pnpm dev
```

HTTP: `http://localhost:3124`  
TCP: `localhost:3113`

## Variables de entorno

Copia `.env.example` a `.env` y configura los hosts según el entorno. Dentro de Docker, usa nombres de servicio (`morrison-grpc`, `websocket-server`, `sftp-server`, `smtp-server`) en lugar de `localhost`.

La conexión gRPC utiliza `credentials.createInsecure()`.

## Mensajes TCP

Entrada, terminada en salto de línea:

```text
{book_uuid} {cantidad}\n
```

Respuestas:

```text
OK {book_title} {current_stock}
ERROR {domain_code}
```

## Docker

```bash
docker build -t morrison-api .
docker run --env-file .env -p 3124:3124 -p 3113:3113 morrison-api
```
