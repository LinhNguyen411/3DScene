import axios from "axios";
import myAppConfig from "../../config";

const postLogin = async (send) => {
  localStorage.removeItem("token");
  return axios
    .post(myAppConfig.api.ENDPOINT + "/api/v1/login/get-access-token", send)
    .then((response) => {
      return response;
    });
};

const postLoginGoogle = async (send) => {
  localStorage.removeItem("token");
  return axios
    .post(myAppConfig.api.ENDPOINT + "/api/v1/login/google-auth", send)
    .then((response) => {
      return response;
    });
};

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
  postLogin,
  postLoginGoogle,
  getAuth
};

export default DataService;
