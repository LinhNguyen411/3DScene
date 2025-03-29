import axios from "axios";
import myAppConfig from "../../../config";

const postSendEmailForgotPassword = (email) => {
  return axios
    .post(myAppConfig.api.ENDPOINT + "/api/v1/login/password-recovery/" + email)
    .then((response) => {
      return response;
    });
};

const DataService = {
  postSendEmailForgotPassword,
};

export default DataService;
