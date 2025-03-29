import axios from "axios";
import myAppConfig from "../../../config";

const getMyInfo =  () => {
  try {
    const response = axios.get(
    myAppConfig.api.ENDPOINT + "/api/v1/users/get-my-info",
    {headers: {
        Authorization: "Bearer " + localStorage.getItem("token"),
      }})
    return response;
  } catch(error) {
    throw new Error(`Bad request`);
  };
}

const DataService = {
    getMyInfo
};
export default DataService;