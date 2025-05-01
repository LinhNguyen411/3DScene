/** @see https://serverless-stack.com/chapters/environments-in-create-react-app.html */
/** React simple configuration registry with per-environment parameters */

/* Configuration is built based on the environment variables, they are available only if npm start / npm test is used */
const development = {
  api: {
    ENDPOINT: "http://localhost:8083",
  },
  frontend: {
    FRONTEND_DOMAIN: "http://localhost:8081",
  },
};

/* Configuration is hardcoded here and is used if npm build is used */
const production = {
  api: {
    ENDPOINT: "http://localhost:8083",
  },
  frontend: {
    FRONTEND_DOMAIN: "http://todo.gnetkov.com",
  }, 
};

/* REACT_APP_ENVIRONMENT has only four values:
 * - development for npm start
 * - test for npm test
 * - production for npm build
 */
// const config =
//   process.env.REACT_APP_STAGE === "production" ? production : development;

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
