import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { RouterPath } from "../../../assets/dictionary/RouterPath";
import DataService from "./ForgotPasswordFormService";

export default function ForgotPasswordForm(props) {
  const [isEmailValidationError, setisEmailValidationError] = useState(false);
  const [isSendingRequest, setisSendingRequest] = useState(false);
  const [EmailForm, setEmailForm] = useState("");

  let navigate = useNavigate();

  const handleClick = (e) => {
    setisSendingRequest(true);
    e.preventDefault();

    if (
      !String(EmailForm)
        .toLowerCase()
        .match(
          /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        )
    ) {
      setisEmailValidationError(true);
      setisSendingRequest(false);
    } else {
      DataService.postSendEmailForgotPassword(EmailForm.toLowerCase())
        .then((response) => {
          if (response.status === 200 || response.status === 201) {
            navigate(RouterPath.FORGOT_PASSWORD_MAIL_SENT);
          } else {
            setisSendingRequest(false);
            setisEmailValidationError(true);
          }
        })
        .catch((error) => {
          setisSendingRequest(false);
          setisEmailValidationError(true);
        });
    }
  };

  return (
    <div className="bg-gray-100 flex flex-col min-h-screen">
      <div className="flex items-center justify-center">
        <div className="w-full my-4 px-4 flex justify-center">
          <div className="w-full sm:w-4/5 md:w-2/3 lg:w-1/2 xl:w-2/5">
            <div className="flex items-center mb-2">
              <button 
                className="text-gray-500 p-0"
                onClick={() => navigate(-1)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
            </div>
            <div className="bg-white rounded-lg shadow-sm border-0">
              <div className="p-4 md:p-10">
                <div className="text-center mb-4">
                  <h2 className="text-2xl font-bold mb-3">Forgot Password</h2>
                </div>
                <form>
                  <div className="mb-4">
                    <input
                      type="email"
                      placeholder="Email Address"
                      className="w-full px-4 py-3 text-lg rounded-full border focus:outline-none focus:ring-2 focus:ring-sky-400"
                      onChange={(event) => setEmailForm(event.target.value)}
                      value={EmailForm}
                    />
                    <p className={`text-red-500 mt-1 text-sm ${isEmailValidationError ? "" : "hidden"}`}>
                      Enter valid email
                    </p>
                  </div>
                  <button
                    type="submit"
                    className="bg-sky-400 hover:bg-sky-500 text-white border-0 w-full py-3 rounded-full disabled:opacity-70 disabled:cursor-not-allowed"
                    onClick={(e) => handleClick(e)}
                    disabled={isSendingRequest}
                  >
                    Send reset link
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
