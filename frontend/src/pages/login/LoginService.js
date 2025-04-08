import axios from "axios";
import myAppConfig from "../../config";

const postLogin = (send) => {
  localStorage.removeItem("token");
  return axios
    .post(myAppConfig.api.ENDPOINT + "/api/v1/login/get-access-token", send)
    .then((response) => {
      return response;
    });
};



const postLoginGoogle = (send) => {
  localStorage.removeItem("token");
  return axios
    .post(myAppConfig.api.ENDPOINT + "/api/v1/login/google-auth", send)
    .then((response) => {
      return response;
    });
};


const DataService = {
  postLogin,
  postLoginGoogle
};

export default DataService;
