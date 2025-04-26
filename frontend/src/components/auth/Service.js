import axios from "axios";
import myAppConfig from "../../config";

const getAuth = async () => {
  try { 
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

const getEnv = async () => {
  try{
    const response = await axios.get(
      myAppConfig.api.ENDPOINT + "/api/v1/public/env",
      {},
      );
      console.log(response); 
      return response.data;
    } catch (error) {
      throw new Error();
  }
}

const DataService = {
  getAuth,
  getEnv,

};

export default DataService;
