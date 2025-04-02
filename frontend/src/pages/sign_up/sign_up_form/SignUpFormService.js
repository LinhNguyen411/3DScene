import axios from "axios";
import myAppConfig from "../../../config";

const postSignUp = (send) => {
  return axios
    .post(myAppConfig.api.ENDPOINT + "/api/v1/users/signup", send)
    .then((response) => {
      return response;
    });
};


const postLoginGoogle = (send) => {
  return axios
    .post(myAppConfig.api.ENDPOINT + "/api/v1/login/google-auth", send)
    .then((response) => {
      return response;
    });
};

const DataService = {
  postSignUp,
  postLoginGoogle,
};

export default DataService;
