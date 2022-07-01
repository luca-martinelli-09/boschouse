module.exports = {
  server: {
    port: process.env.PORT || 3000,
    host: process.env.BASE_URL || "http://localhost",
    nodeOpenDoor: process.env.NODE_OPEN_DOOR || "http://localhost:1880/door/open"
  },
  database: {
    host: process.env.DB_HOST || "192.168.178.2",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "MArtine_lli9824",
    database: process.env.DB_NAME || "boschouse"
  },
  telegram: {
    api: process.env.TG_BOT_API || "5586957472:AAEUG8FUGswx7RuZ57VaS6hx2ec3jc20YM8"
  }
}