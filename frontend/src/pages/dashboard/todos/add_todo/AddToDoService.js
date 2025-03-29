import axios from "axios";
import myAppConfig from "../../../../config";

const addDoneToDo = async (data) => {
    try {
      const response = await axios.post(
      myAppConfig.api.ENDPOINT + "/api/v1/todos/create-todo",
      data,
      {
        headers: {
          Authorization: "Bearer " + localStorage.getItem("token"),
        },
      })
      
    //   console.log(response.data);
      return response;
      
    } catch(error) {
      throw new Error(`Bad request`);
    };
  }

const DataService = {
  addDoneToDo
};

export default DataService;