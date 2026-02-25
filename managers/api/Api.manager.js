const getParamNames = require("./_common/getParamNames");

/**
 * API HANDLER MANAGER
 * ===================
 * This is the core routing engine for the REST API
 *
 * Key Responsibilities:
 * 1. Scans all managers for methods marked as HTTP exposed (httpExposed property)
 * 2. Builds a route matrix mapping HTTP methods to manager methods
 * 3. Automatically attaches middleware to routes based on method parameters
 * 4. Creates a single unified endpoint pattern: /api/:moduleName/:fnName
 *
 * Route Construction:
 * - Module 'user' with method 'registerUser' → POST /api/user/registerUser
 * - Module 'school' with 'get=getSchoolById' → GET /api/school/getSchoolById
 * - Default HTTP method is POST if not specified
 *
 * Middleware Integration:
 * - Method parameters starting with __ are middleware identifiers
 * - Example: registerUser(username, email, password) vs
 *            getSchoolById(id, __token) - the __token triggers token middleware
 * - Middleware is injected as a parameter into the manager method
 */

module.exports = class ApiHandler {
  /**
   * Constructor - Initialize API Handler
   *
   * @param {object} config - Configuration object
   * @param {object} cortex - Event emitter/messaging system
   * @param {object} cache - Redis cache instance
   * @param {object} managers - Collection of all loaded managers
   * @param {object} mwsRepo - Repository of all loaded middleware functions
   * @param {string} prop - Property name to scan for exposed methods (default: 'httpExposed')
   */
  constructor({ config, cortex, cache, managers, mwsRepo, prop }) {
    this.config = config;
    this.cache = cache;
    this.cortex = cortex;
    this.managers = managers;
    this.mwsRepo = mwsRepo; // Built-in middlewares (__token, __device, etc.)
    this.mwsExec = this.managers.mwsExec; // Middleware executor
    this.prop = prop; // Usually 'httpExposed'
    this.exposed = {}; // Final routes to expose
    this.methodMatrix = {}; // Mapping of modules → HTTP methods → functions
    this.auth = {}; // Auth info per route
    this.fileUpload = {}; // File upload info per route
    this.mwsStack = {}; // Middleware stack per route
    this.mw = this.mw.bind(this); // Bind middleware handler context

    // STEP 1: BUILD ROUTE MATRIX FROM ALL MANAGERS
    // =============================================
    // Scan every manager for httpExposed array to identify public routes
    Object.keys(this.managers).forEach((moduleName) => {
      // Only process managers that have exposed methods (e.g., User, School, Classroom)
      if (this.managers[moduleName][this.prop]) {
        this.methodMatrix[moduleName] = {};

        // Process each exposed method in this manager
        this.managers[moduleName][this.prop].forEach((methodDef) => {
          // Parse method definition which can be "methodName" or "httpMethod=methodName"
          // Examples:
          // - "registerUser" → POST /api/user/registerUser (default to POST)
          // - "get=getSchoolById" → GET /api/school/getSchoolById
          // - "post=createSchool" → POST /api/school/createSchool

          let httpMethod = "post"; // Default HTTP method
          let managerMethod = methodDef; // Method name in manager

          if (methodDef.includes("=")) {
            // Split "get=getSchoolById" into ["get", "getSchoolById"]
            const parts = methodDef.split("=");
            httpMethod = parts[0]; // "get"
            managerMethod = parts[1]; // "getSchoolById"
          }

          // Add this method to the route matrix for quick lookup
          if (!this.methodMatrix[moduleName][httpMethod]) {
            this.methodMatrix[moduleName][httpMethod] = [];
          }
          this.methodMatrix[moduleName][httpMethod].push(managerMethod);

          // STEP 2: EXTRACT PARAMETERS FROM MANAGER METHOD
          // ===============================================
          // Use reflection to get method parameters
          // This tells us which middlewares this method needs
          let params = getParamNames(
            this.managers[moduleName][managerMethod],
            managerMethod,
            moduleName,
          );

          // Clean up parameter names (remove whitespace, braces)
          params = params.split(",").map((param) => {
            param = param.trim();
            param = param.replace("{", "");
            param = param.replace("}", "");
            return param;
          });

          // STEP 3: BUILD MIDDLEWARE STACK FOR THIS ROUTE
          // =============================================
          // Scan method parameters for middleware identifiers (__token, __device, etc.)
          // These are injected automatically by the route handler
          params.forEach((param) => {
            // Initialize middleware stack for this route if not exists
            if (!this.mwsStack[`${moduleName}.${managerMethod}`]) {
              this.mwsStack[`${moduleName}.${managerMethod}`] = [];
            }

            // Check if this parameter is a middleware (starts with __)
            if (param.startsWith("__")) {
              // This is a middleware identifier like __token or __device

              // Verify middleware exists in repository
              if (!this.mwsRepo[param]) {
                throw Error(
                  `Unable to find middleware ${param} for ${moduleName}.${managerMethod}`,
                );
              }

              // Add to middleware stack - will be executed in order
              this.mwsStack[`${moduleName}.${managerMethod}`].push(param);
            }
          });
        });
      }
    });

    /** expose apis through cortex */
    Object.keys(this.managers).forEach((mk) => {
      if (this.managers[mk].interceptor) {
        this.exposed[mk] = this.managers[mk];
        // console.log(`## ${mk}`);
        if (this.exposed[mk].cortexExposed) {
          this.exposed[mk].cortexExposed.forEach((i) => {
            // console.log(`* ${i} :`,getParamNames(this.exposed[mk][i]));
          });
        }
      }
    });

    /** expose apis through cortex */
    this.cortex.sub("*", (d, meta, cb) => {
      let [moduleName, fnName] = meta.event.split(".");
      let targetModule = this.exposed[moduleName];
      if (!targetModule) return cb({ error: `module ${moduleName} not found` });
      try {
        targetModule.interceptor({ data: d, meta, cb, fnName });
      } catch (err) {
        cb({ error: `failed to execute ${fnName}` });
      }
    });
  }

  async _exec({ targetModule, fnName, cb, data }) {
    let result = {};

    try {
      result = await targetModule[`${fnName}`](data);
    } catch (err) {
      console.log(`error`, err);
      result.error = `${fnName} failed to execute`;
    }

    if (cb) cb(result);
    return result;
  }

  /** a middle for executing admin apis trough HTTP */
  async mw(req, res, next) {
    let method = req.method.toLowerCase();
    let moduleName = req.params.moduleName;
    let context = req.params.context;
    let fnName = req.params.fnName;
    let moduleMatrix = this.methodMatrix[moduleName];

    /** validate module */
    if (!moduleMatrix)
      return this.managers.responseDispatcher.dispatch(res, {
        ok: false,
        message: `module ${moduleName} not found`,
      });

    /** validate method */
    if (!moduleMatrix[method]) {
      return this.managers.responseDispatcher.dispatch(res, {
        ok: false,
        message: `unsupported method ${method} for ${moduleName}`,
      });
    }

    if (!moduleMatrix[method].includes(fnName)) {
      return this.managers.responseDispatcher.dispatch(res, {
        ok: false,
        message: `unable to find function ${fnName} with method ${method}`,
      });
    }

    // console.log(`${moduleName}.${fnName}`);

    let targetStack = this.mwsStack[`${moduleName}.${fnName}`];

    let hotBolt = this.mwsExec.createBolt({
      stack: targetStack,
      req,
      res,
      onDone: async ({ req, res, results }) => {
        /** executed after all middleware finished */

        let body = req.body || {};
        let result = await this._exec({
          targetModule: this.managers[moduleName],
          fnName,
          data: {
            ...body,
            ...results,
            res,
          },
        });
        if (!result) result = {};

        if (result.selfHandleResponse) {
          // do nothing if response handeled
        } else {
          if (result.errors) {
            return this.managers.responseDispatcher.dispatch(res, {
              ok: false,
              code: result.code,
              errors: result.errors,
            });
          } else if (result.error) {
            return this.managers.responseDispatcher.dispatch(res, {
              ok: false,
              code: result.code,
              message: result.error,
            });
          } else {
            return this.managers.responseDispatcher.dispatch(res, {
              ok: true,
              code: result.code,
              data: result,
            });
          }
        }
      },
    });
    hotBolt.run();
  }
};
