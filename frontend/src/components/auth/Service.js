import axios from "axios";
import myAppConfig from "../../config";

const getAuth = async () => {
  try { 
    console.log(localStorage.getItem("token"),)
    const response = await axios.post(
      myAppConfig.api.ENDPOINT + "/api/v1/login/get-my-info",
      {},
      {
        headers: {
          Authorization: "Bearer " + localStorage.getItem("token"),
        },
      }
    );
    console.log(response); 
    return response.data;
  } catch (error) {
    throw new Error();
  }
};

const DataService = {
  getAuth,
};

export default DataService;
