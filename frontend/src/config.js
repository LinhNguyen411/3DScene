/** @see https://serverless-stack.com/chapters/environments-in-create-react-app.html */
/** React simple configuration registry with per-environment parameters */

/* Configuration is built based on the environment variables, they are available only if npm start / npm test is used */
const development = {
  api: {
    ENDPOINT: process.env.REACT_APP_DOMAIN + "/api/v1" || "http://localhost:8083",
  },
  frontend: {
    FRONTEND_DOMAIN: process.env.REACT_APP_DOMAIN || "http://localhost:8081",
  },
};

/* Configuration is hardcoded here and is used if npm build is used */
const production = {
  api: {
    ENDPOINT: process.env.REACT_APP_DOMAIN || "",
  },
  frontend: {
    FRONTEND_DOMAIN: process.env.REACT_APP_DOMAIN || "",
  }, 
};

/* REACT_APP_ENVIRONMENT has values:
 * - development for development environment
 * - production for production environment
 */

let config = development;

switch (process.env.REACT_APP_ENVIRONMENT) {
  case "development":
    config = development;
    break;
  case "production":
    config = production;
    break;
  default:
    config = development;
    break;
}

export default {
  ...config,
};