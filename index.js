const config = require("./config/index.config.js");
const Cortex = require("ion-cortex");
const ManagersLoader = require("./loaders/ManagersLoader.js");
const Aeon = require("aeon-machine");
const mongoConnect = require("./connect/mongo.js");

console.log("\n" + "━".repeat(80));
console.log("  School Management System API - Startup");
console.log("━".repeat(80) + "\n");

process.on("uncaughtException", (err) => {
  console.error(`❌ Uncaught Exception:`, err);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection:", reason);
  process.exit(1);
});

// Initialize MongoDB connection
mongoConnect({ uri: config.dotEnv.MONGO_URI });
console.log("✓ MongoDB connection initialized");

// Initialize cache layer
const cache = require("./cache/cache.dbh")({
  prefix: config.dotEnv.CACHE_PREFIX,
  url: config.dotEnv.CACHE_REDIS,
});
console.log("✓ Cache layer initialized (Redis)");

// Initialize Oyster database
const Oyster = require("oyster-db");
const oyster = new Oyster({
  url: config.dotEnv.OYSTER_REDIS,
  prefix: config.dotEnv.OYSTER_PREFIX,
});
console.log("✓ Oyster database initialized (Redis caching)");

// Initialize Cortex event bus
const cortex = new Cortex({
  prefix: config.dotEnv.CORTEX_PREFIX,
  url: config.dotEnv.CORTEX_REDIS,
  type: config.dotEnv.CORTEX_TYPE,
  state: () => ({}),
  activeDelay: "50",
  idlDelay: "200",
});
console.log("✓ Cortex event bus initialized (Redis PubSub)");

// Initialize Aeon time machine
const aeon = new Aeon({
  cortex,
  timestampFrom: Date.now(),
  segmantDuration: 500,
});
console.log("✓ Aeon time machine initialized (Time-series)");

// Load configuration
console.log("");
console.log("✓ Configuration loaded successfully");
console.log(`  Service: ${config.dotEnv.SERVICE_NAME}`);
console.log(`  Environment: ${config.dotEnv.NODE_ENV}`);
console.log(`  Port: ${config.dotEnv.USER_PORT}`);
console.log("");

// Initialize managers
const managersLoader = new ManagersLoader({
  config,
  cache,
  cortex,
  oyster,
  aeon,
});

const managers = managersLoader.load();
console.log("✓ Managers loader initialized");
console.log("✓ All managers loaded");
console.log("");

// Start HTTP server
console.log("🚀 Starting server...\n");
managers.userServer.run();
