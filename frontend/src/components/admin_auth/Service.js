import axios from "axios";
import myAppConfig from "../../config";

const getAuth = async () => {
  try {
    const response = await axios.post(
      myAppConfig.api.ENDPOINT + "/api/v1/login/verify-supertoken",
      {},
      {
        headers: {
          Authorization: "Bearer " + localStorage.getItem("supertoken"),
        },
      }
    );
    console.log(response)
    return response.data;
  } catch (error) {
    throw new Error();
  }
};

const DataService = {
  getAuth,
};

export default DataService;
