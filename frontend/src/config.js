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
  oauth2: {
    GOOGLE_AUTH_CLIENT_ID: process.env.REACT_APP_GOOGLE_AUTH_CLIENT_ID,
  },
  stripe:{
    STRIPE_PUBLIC_KEY: "pk_test_51NtuEzIpv2OeX57hklUATynFfAdbebbii7Zkb5yPMtWi3T9eBNKJCH5wNAS4Atj11YOLb2MeX4hZtt95MwJWavoP00juELMfQz",
  }
};

/* Configuration is hardcoded here and is used if npm build is used */
const production = {
  api: {
    ENDPOINT: "",
  },
  frontend: {
    FRONTEND_DOMAIN: "http://todo.gnetkov.com",
  },
  oauth2: {
    GOOGLE_AUTH_CLIENT_ID: process.env.REACT_APP_GOOGLE_AUTH_CLIENT_ID
  }
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
