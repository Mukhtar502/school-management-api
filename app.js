/**
 * APP.JS
 * ======
 * Legacy/simplified application initialization
 * Not used in current deployment (see index.js for main entry point)
 *
 * This file provides an alternative initialization pattern
 * Kept for reference or fallback purposes
 */

const config = require("./config/index.config.js");
const Cortex = require("ion-cortex");
const ManagersLoader = require("./loaders/ManagersLoader.js");

// STEP 1: CONNECT TO MONGODB
// ==========================
// Initialize MongoDB connection if URI is provided
// Returns connection object or null if MONGO_URI not configured
const mongoDB = config.dotEnv.MONGO_URI
  ? require("./connect/mongo")({
      uri: config.dotEnv.MONGO_URI,
    })
  : null;

// STEP 2: SETUP REDIS CACHE
// ==========================
// Initialize Redis client for caching layer
// Used by managers to cache frequently accessed data
const cache = require("./cache/cache.dbh")({
  prefix: config.dotEnv.CACHE_PREFIX,
  url: config.dotEnv.CACHE_REDIS,
});

// STEP 3: SETUP CORTEX EVENT BUS
// ==============================
// Initialize Cortex for pub/sub messaging between services
// Enables real-time event broadcasting and communication
const cortex = new Cortex({
  prefix: config.dotEnv.CORTEX_PREFIX,
  url: config.dotEnv.CORTEX_REDIS,
  type: config.dotEnv.CORTEX_TYPE,
  state: () => {
    return {};
  },
  activeDelay: "50ms",
  idlDelay: "200ms",
});

// STEP 4: LOAD MANAGERS
// =====================
// ManagersLoader initializes all business logic managers
// Loads in specific order: ResponseDispatcher, Validators, TokenManager, Entity Managers
const managersLoader = new ManagersLoader({ config, cache, cortex });
const managers = managersLoader.load();

// STEP 5: START HTTP SERVER
// ==========================
// Start Express HTTP server on configured port
// Server handles all API requests through unified /api/:module/:fn endpoint
managers.userServer.run();
