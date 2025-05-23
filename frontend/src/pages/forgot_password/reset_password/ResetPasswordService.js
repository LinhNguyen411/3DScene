import axios from "axios";
import myAppConfig from "../../../config";

const postResetPassword = (send) => {
  return axios
    .post(myAppConfig.api.ENDPOINT + "/login/reset-password", send)
    .then((response) => {
      return response;
    });
};

const DataService = {
  postResetPassword,
};

export default DataService;
