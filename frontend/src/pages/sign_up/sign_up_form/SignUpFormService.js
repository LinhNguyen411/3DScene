import axios from "axios";
import myAppConfig from "../../../config";

const postSignUp = (send) => {
  return axios
    .post(myAppConfig.api.ENDPOINT + "/users/signup", send)
    .then((response) => {
      return response;
    });
};


const postLoginGoogle = (send) => {
  return axios
    .post(myAppConfig.api.ENDPOINT + "/login/google-auth", send)
    .then((response) => {
      return response;
    });
};

const DataService = {
  postSignUp,
  postLoginGoogle,
};

export default DataService;
