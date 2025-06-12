/** @see https://serverless-stack.com/chapters/environments-in-create-react-app.html */
/** React simple configuration registry with per-environment parameters */

/* Helper function to get current origin/base URL */
const getCurrentOrigin = () => {
  if (typeof window !== 'undefined') {
    console.log(window.location.origin)
    return window.location.origin;
  }
  // Fallback for server-side rendering or testing environments
  return 'http://localhost:8081';
};

/* Configuration is built based on the environment variables, they are available only if npm start / npm test is used */
const development = {
  api: {
    ENDPOINT: getCurrentOrigin() + "/api/v1" || "http://localhost:8083",
  },
  frontend: {
    FRONTEND_DOMAIN: getCurrentOrigin() || "http://localhost:8081",
  },
};

/* Configuration uses current origin for production to work with reverse proxy */
const production = {
  api: {
    ENDPOINT: getCurrentOrigin() + "/api/v1",
  },
  frontend: {
    FRONTEND_DOMAIN: getCurrentOrigin(),
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