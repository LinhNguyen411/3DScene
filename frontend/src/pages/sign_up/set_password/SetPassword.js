import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { RouterPath } from "../../../assets/dictionary/RouterPath";
import DataService from "./SetPasswordServices";
import { useSnackbar } from "../../../provider/SnackbarProvider";

export default function SetPassword(props) {
  const [isValidationError, setisValidationError] = useState(false);
  const [isSendingRequest, setisSendingRequest] = useState(false);
  const [PasswordForm, setPasswordForm] = useState("");
  const [ConfirmPasswordForm, setConfirmPasswordForm] = useState("");
  const { showSnackbar } = useSnackbar();
  

  let navigate = useNavigate();
  let token = localStorage.getItem("token");

  useEffect(() => {
    if (token == null) {
      navigate(RouterPath.LINK_NOT_VALID);
    }
  }, []);

  const handleClick = (e) => {
    setisSendingRequest(true);
    e.preventDefault();

    if (PasswordForm.length < 6) {
      setisValidationError(true);
      setisSendingRequest(false);
    } 
    else if(PasswordForm !== ConfirmPasswordForm){
        setisSendingRequest(false)
    }
    else {

      DataService.postSetPassword(PasswordForm)
        .then((response) => {
          if (response.status === 200) {
            showSnackbar('Your account setup successfully!', 'success');
            navigate(RouterPath.DASHBOARD);
          } else {
            setisSendingRequest(false);
            setisValidationError(true);
            showSnackbar('Failed to set your password', 'error');
          }
        })
        .catch((error) => {
          if (error.response.status === 400) {
            navigate(RouterPath.LINK_NOT_VALID);
          } else {
            setisSendingRequest(false);
            setisValidationError(true);
            showSnackbar('Failed to set your password', 'error');
          }
        });
    }
  };

  return (
    <>
      <div className="container mx-auto px-4">
        <div className="flex justify-center pt-5">
          <div className="w-full sm:w-4/5 md:w-2/3 lg:w-1/2 xl:w-1/3">
            <div className="bg-white rounded shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Set Your Password</h2>
              <form>
                <div className="mb-3">
                  <label className="block mb-1">
                    Password<span className="text-red-500">*</span>
                  </label>
                  <input
                    placeholder="Password"
                    type="password"
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-sky-400"
                    onChange={(event) => setPasswordForm(event.target.value)}
                    value={PasswordForm}
                  />
                  <p className={`text-sm mt-1 ${isValidationError ? "text-red-500" : "text-gray-500"}`}>
                    Minimum 6 characters
                  </p>
                </div>
                <div className="mb-3">
                  <label className="block mb-1">
                    Confirm password<span className="text-red-500">*</span>
                  </label>
                  <input
                    placeholder="Confirm password"
                    type="password"
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-sky-400"
                    onChange={(event) => setConfirmPasswordForm(event.target.value)}
                    value={ConfirmPasswordForm}
                  />
                  {PasswordForm !== ConfirmPasswordForm && (<p className="text-sm mt-1 text-red-500">
                    Not match password
                  </p>)}
                </div>
                <button
                  type="submit"
                  className="bg-sky-400 hover:bg-sky-500 text-white border-0 w-full py-3 rounded-full disabled:opacity-70 disabled:cursor-not-allowed"
                  onClick={(e) => handleClick(e)}
                  disabled={isSendingRequest}
                >
                  Confirm
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
