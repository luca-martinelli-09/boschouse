module.exports = {
  server: {
    port: process.env.PORT || 3000,
    host: process.env.BASE_URL || "http://localhost",
    nodeOpenDoor: process.env.NODE_OPEN_DOOR || "http://localhost:1880/door/open",
    nodeRingDoor: process.env.NODE_RING || "http://localhost:1880/door/ring",
  },
  database: {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "root",
    database: process.env.DB_NAME || "boschouse",
  },
  telegram: {
    api: process.env.TG_BOT_API || "",
  }
}