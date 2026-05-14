const path = require("path");

// Passenger (cPanel) pasa el puerto por variable de entorno
const port = parseInt(process.env.PORT, 10) || 3000;
const hostname = "0.0.0.0";

// En standalone mode, Next.js genera su propio server.js dentro de .next/standalone/
// Este archivo lo envuelve para que Passenger lo pueda levantar.
process.env.HOSTNAME = hostname;
process.env.PORT = String(port);

// Carga el server que Next.js generó en el build standalone
require("./.next/standalone/server.js");
