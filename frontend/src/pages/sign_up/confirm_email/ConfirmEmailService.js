import axios from "axios";
import myAppConfig from "../../../config";

const postConfirmEmail = (token) => {
  return axios
    .post(myAppConfig.api.ENDPOINT + "/users/confirm-email" + token)
    .then((response) => {
      return response;
    });
};

const DataService = {
  postConfirmEmail,
};

export default DataService;
