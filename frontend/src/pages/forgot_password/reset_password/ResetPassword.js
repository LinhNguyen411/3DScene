import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { RouterPath } from "../../../assets/dictionary/RouterPath";
import DataService from "./ResetPasswordService";

export default function ResetPassword(props) {
  const [isValidationError, setisValidationError] = useState(false);
  const [isSendingRequest, setisSendingRequest] = useState(false);
  const [PasswordForm, setPasswordForm] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();

  let navigate = useNavigate();
  let token = searchParams.get("token");

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
    } else {
      var data = {
        new_password: PasswordForm,
        token: token,
      };

      DataService.postResetPassword(data)
        .then((response) => {
          if (response.status === 200) {
            navigate(RouterPath.PASSWORD_CHANGED);
          } else {
            setisSendingRequest(false);
            setisValidationError(true);
          }
        })
        .catch((error) => {
          if (error.response.status === 400) {
            navigate(RouterPath.LINK_NOT_VALID);
          } else {
            setisSendingRequest(false);
            setisValidationError(true);
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
              <h2 className="text-xl font-semibold mb-4">Reset password</h2>
              <form>
                <div className="mb-3">
                  <label className="block mb-1">
                    New password<span className="text-red-500">*</span>
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
                <button
                  type="submit"
                  className="bg-sky-400 hover:bg-sky-500 text-white border-0 w-full py-3 rounded-full disabled:opacity-70 disabled:cursor-not-allowed"
                  onClick={(e) => handleClick(e)}
                  disabled={isSendingRequest}
                >
                  Change
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
