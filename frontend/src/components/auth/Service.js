import axios from "axios";
import myAppConfig from "../../config";

const getAuth = async () => {
  try {
    const response = await axios.post(
      myAppConfig.api.ENDPOINT + "/api/v1/login/verify-token",
      {},
      {
        headers: {
          Authorization: "Bearer " + localStorage.getItem("token"),
        },
      }
    );
    return response.data;
  } catch (error) {
    throw new Error();
  }
};

const DataService = {
  getAuth,
};

export default DataService;
