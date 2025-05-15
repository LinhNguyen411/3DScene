import axios from "axios";
import myAppConfig from "../../config";

const getAuth = async () => {
  try {
    const response = await axios.post(
      myAppConfig.api.ENDPOINT + "/login/verify-supertoken",
      {},
      {
        headers: {
          Authorization: "Bearer " + localStorage.getItem("supertoken"),
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
