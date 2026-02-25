// Optional: useragent removed due to security vulnerabilities
// If needed for production, install with: npm install useragent
let useragent;
try {
  useragent = require("useragent");
} catch (err) {
  useragent = null;
  console.log(
    "⚠  useragent module not installed (security: removed due to vulnerabilities)",
  );
}

const requestIp = require("request-ip");

module.exports = ({ meta, config, managers }) => {
  return ({ req, res, next }) => {
    let ip = "N/A";
    let agent = "N/A";
    ip = requestIp.getClientIp(req) || ip;

    // Only parse agent if useragent is available
    if (useragent && req.headers["user-agent"]) {
      agent = useragent.lookup(req.headers["user-agent"]) || agent;
    }

    const device = {
      ip,
      agent,
    };
    next(device);
  };
};
