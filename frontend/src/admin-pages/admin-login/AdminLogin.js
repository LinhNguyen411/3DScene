import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { RouterPath } from "../../assets/dictionary/RouterPath";
import DataService from "./AdminLoginService";

export default function AdminLogin(props) {
  const [isShowValidationError, setIsShowValidationError] = useState(false);
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [emailForm, setEmailForm] = useState("");
  const [passwordForm, setPasswordForm] = useState("");

  let navigate = useNavigate();

  const handleClick = (e) => {
    setIsSendingRequest(true);
    e.preventDefault();
    if (
      !passwordForm ||
      !String(emailForm)
        .toLowerCase()
        .match(
          /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        )
    ) {
      setIsShowValidationError(true);
      setIsSendingRequest(false);
    } else {
      var bodyFormData = new FormData();
      bodyFormData.append("username", emailForm.toLowerCase());
      bodyFormData.append("password", passwordForm);
      DataService.postLogin(bodyFormData)
        .then((response) => {
          if (response.status === 200) {
            localStorage.setItem("supertoken", response.data.access_token);
            navigate(RouterPath.ADMIN_DASHBOARD);
          } else {
            setIsSendingRequest(false);
            setIsShowValidationError(true);
          }
        })
        .catch((error) => {
          setIsSendingRequest(false);
          setIsShowValidationError(true);
        });
    }
  };


  return (
    <div className="flex items-center justify-center h-screen">
      <div className="bg-white p-8 rounded shadow-md w-96">
        <div className="flex justify-center mb-3">
            <div className="bg-teal-500 logo-icon w-[3em] h-[3em]">
                <div className="logo-bolt w-[2em] h-[1em]"></div>
              </div>
        </div>
        <div className="flex justify-center align-center mb-3">
                
              <h1 className="text-teal-500 brand-text text-[2em]">3DScene</h1>
              <h1 className="ml-2 text-gray-500 text-[2em]">Admin</h1>
        </div>
        <h1 className="text-2xl font-bold text-center mb-3 text-gray-500">Login</h1>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={emailForm}
            onChange={(e) => setEmailForm(e.target.value)}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
            required 
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={passwordForm}
            onChange={(e) => setPasswordForm(e.target.value)}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
            required
          />
        </div>
        {isShowValidationError && (
          <div className="mb-3 text-red-500 text-center">
            Email or password not valid
          </div>
        )}

        <button 
          onClick={(e) => handleClick(e)}
          disabled={isSendingRequest}
          className="w-full bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded">
            {isSendingRequest ? "Logging in..." : "Log In"}
        </button>
      </div>
    </div>
  );
}
