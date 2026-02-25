const MiddlewaresLoader = require("./MiddlewaresLoader");
const ApiHandler = require("../managers/api/Api.manager");
const LiveDB = require("../managers/live_db/LiveDb.manager");
const UserServer = require("../managers/http/UserServer.manager");
const ResponseDispatcher = require("../managers/response_dispatcher/ResponseDispatcher.manager");
const VirtualStack = require("../managers/virtual_stack/VirtualStack.manager");
const ValidatorsLoader = require("./ValidatorsLoader");
const ResourceMeshLoader = require("./ResourceMeshLoader");
const utils = require("../libs/utils");

const systemArch = require("../static_arch/main.system");
const TokenManager = require("../managers/token/Token.manager");
const SharkFin = require("../managers/shark_fin/SharkFin.manager");
const TimeMachine = require("../managers/time_machine/TimeMachine.manager");

/**
 * MANAGERS LOADER
 * ===============
 * Responsible for initializing and loading all business logic managers
 *
 * Managers Pattern:
 * - Each manager class handles a specific domain (User, School, Student, Classroom)
 * - Managers are instantiated with dependencies injected through the injectable object
 * - Managers expose public methods via httpExposed array to make them HTTP-accessible
 *
 * Loading Order (CRITICAL):
 * 1. ResponseDispatcher - Used to format all API responses
 * 2. Validators - Schema validation rules for all entities
 * 3. MongoDB Models - Mongoose database collections
 * 4. TokenManager - JWT token creation/verification (MUST BE BEFORE ENTITY MANAGERS)
 * 5. Entity Managers - User, School, Student, Classroom (depend on TokenManager)
 * 6. Middlewares - Request interceptors that attach to routes
 * 7. API Handler - Route dispatcher that connects HTTP requests to manager methods
 *
 * This order is critical because:
 * - Entity managers call TokenManager which must be initialized first
 * - Middlewares need access to all managers for injection
 * - API Handler builds routes from all manager httpExposed arrays
 */
module.exports = class ManagersLoader {
  /**
   * Constructor - Initialize the manager loader
   * @param {object} config - Application configuration
   * @param {object} cortex - Event messaging system
   * @param {object} cache - Redis cache instance
   * @param {object} oyster - Database abstraction layer
   * @param {object} aeon - Time/date utilities
   */
  constructor({ config, cortex, cache, oyster, aeon }) {
    this.managers = {}; // Will store all initialized managers
    this.config = config;
    this.cache = cache;
    this.cortex = cortex;

    // Preload validators, resource nodes, and database models
    this._preload();

    // Create injectable container with all dependencies to pass to managers
    // This allows managers to access config, database, cache, other managers, etc.
    this.injectable = {
      utils,
      cache,
      config,
      cortex,
      oyster,
      aeon,
      managers: this.managers, // Reference to this.managers (populated during load())
      validators: this.validators, // Schema validators
      mongomodels: this.mongomodels, // Mongoose models
      resourceNodes: this.resourceNodes,
    };
  }

  /**
   * Preload step - Initialize validators, schemas, and database models
   * Called before main load() to prepare dependencies
   */
  _preload() {
    // Create instances of built-in validators using schema definitions
    const validatorsLoader = new ValidatorsLoader({
      models: require("../managers/_common/schema.models"), // Field validation rules
      customValidators: require("../managers/_common/schema.validators"), // Custom validation logic
    });

    // Resource loader for building resource mesh/tree structure
    const resourceMeshLoader = new ResourceMeshLoader({});

    // Load validators into this.validators for injection into managers
    this.validators = validatorsLoader.load();
    this.resourceNodes = resourceMeshLoader.load();

    // Load MongoDB (Mongoose) models for database access
    // These are used by entity managers to query/insert/update database documents
    this.mongomodels = {
      user: require("../managers/entities/user/user.mongoose"),
      school: require("../managers/entities/school/school.mongoose"),
      classroom: require("../managers/entities/classroom/classroom.mongoose"),
      student: require("../managers/entities/student/student.mongoose"),
    };
  }

  /**
   * Main load() method - Initialize all managers and build routing
   * This is called after preload and does the actual manager instantiation
   */
  load() {
    // STEP 1: Initialize system managers needed by all services
    // ==========================================================
    this.managers.responseDispatcher = new ResponseDispatcher(); // Formats all API responses
    this.managers.liveDb = new LiveDB(this.injectable); // Database query layer

    // Load all middleware functions (__token, __device, etc.)
    const middlewaresLoader = new MiddlewaresLoader(this.injectable);
    const mwsRepo = middlewaresLoader.load(); // Repository of middleware functions

    // Get system architecture configuration (layers, actions, etc.)
    const { layers, actions } = systemArch;
    this.injectable.mwsRepo = mwsRepo; // Add middleware repo to injectable for access by managers

    // STEP 2: Load TokenManager FIRST (CRITICAL ORDER)
    // =================================================
    // Token manager MUST be loaded before entity managers because:
    // - User.manager calls this.tokenManager in registerUser/loginUser
    // - School.manager and other entity managers inject __token middleware
    // - If TokenManager isn't initialized, these managers will fail
    //
    // This addresses the critical bug where old Token.manager in entities/token
    // was being load after entity managers, causing undefined references
    console.log("[ManagersLoader] Loading TokenManager first...");
    this.managers.token = new TokenManager(this.injectable);
    console.log("[ManagersLoader] TokenManager loaded successfully");

    // STEP 3: Load entity managers dynamically
    // ========================================
    // Use fileLoader to find all .manager.js files in managers/entities/ directories
    // This allows adding new entity managers without modifying this loader
    const loader = require("./_common/fileLoader");
    const entityManagers = loader("./managers/entities/**/*.manager.js");

    // Instantiate each entity manager class with injected dependencies
    Object.keys(entityManagers).forEach((managerName) => {
      const ManagerClass = entityManagers[managerName];

      // Convert manager file name to camelCase key (e.g., "UserManager" → "user")
      const key = managerName.toLowerCase();

      // Instantiate manager with all dependencies injected
      this.managers[key] = new ManagerClass(this.injectable);

      console.log(`[ManagersLoader] Loaded entity manager: ${key}`);
    });

    /*****************************************CUSTOM MANAGERS*****************************************/
    this.managers.shark = new SharkFin({ ...this.injectable, layers, actions });
    this.managers.timeMachine = new TimeMachine(this.injectable);
    /*************************************************************************************************/
    this.managers.mwsExec = new VirtualStack({
      ...{ preStack: [/* '__token', */ "__device"] },
      ...this.injectable,
    });
    this.managers.userApi = new ApiHandler({
      ...this.injectable,
      ...{ prop: "httpExposed" },
    });
    this.managers.userServer = new UserServer({
      config: this.config,
      managers: this.managers,
    });

    return this.managers;
  }
};
