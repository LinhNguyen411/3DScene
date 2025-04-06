import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { GoogleLogin } from '@react-oauth/google';
import { RouterPath } from "../../assets/dictionary/RouterPath";
import DataService from "./LoginService";

export default function Login(props) {
  const [isShowValidationError, setIsShowValidationError] = useState(false);
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [isSendingRequestLoginGoogle, setIsSendingRequestLoginGoogle] = useState(false);
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
            localStorage.setItem("token", response.data.access_token);
            navigate(RouterPath.LIST_TODOS);
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

  const handleSuccessGoogleLogin = (credentials) => {
    setIsSendingRequestLoginGoogle(true);
    DataService.postLoginGoogle({
      "credentials": credentials
    })
      .then((response) => {
        if (response.status === 200) {
          localStorage.setItem("token", response.data.access_token);
          navigate(RouterPath.LIST_TODOS);
        } else {
          setIsSendingRequestLoginGoogle(false);
        }
      })
      .catch((error) => {
        setIsSendingRequestLoginGoogle(false);
      });
  }

  return (
    <div className="bg-gray-100 flex flex-col min-h-screen">
      {/* Main Content */}
      <div className="flex items-center justify-center">
        <div className="w-full my-4 px-4 flex justify-center">
          <div className="w-full sm:w-4/5 md:w-2/3 lg:w-1/2 xl:w-5/12">
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
                  <h2 className="text-2xl font-bold mb-3">Log In</h2>
                  <p className="text-gray-500 mb-4">
                    Welcome back! 
                  </p>
                </div>

                <form>
                  <div className="mb-4">
                    <input
                      type="email"
                      placeholder="Email Address"
                      className="w-full px-4 py-3 text-lg rounded-full border focus:outline-none focus:ring-2 focus:ring-sky-400"
                      onChange={(event) => setEmailForm(event.target.value)}
                      value={emailForm}
                    />
                  </div>

                  <div className="mb-4">
                    <input
                      type="password"
                      placeholder="Password"
                      className="w-full px-4 py-3 text-lg rounded-full border focus:outline-none focus:ring-2 focus:ring-sky-400"
                      onChange={(event) => setPasswordForm(event.target.value)}
                      value={passwordForm}
                    />
                  </div>

                  {isShowValidationError && (
                    <div className="mb-3 text-red-500 text-center">
                      Email or password not valid
                    </div>
                  )}

                  <button
                    type="submit"
                    className="bg-sky-400 hover:bg-sky-500 text-white border-0 w-full py-3 rounded-full disabled:opacity-70 disabled:cursor-not-allowed"
                    onClick={(e) => handleClick(e)}
                    disabled={isSendingRequest}
                  >
                    {isSendingRequest ? "Logging in..." : "Log In"}
                  </button>
                </form>

                <div className="flex justify-between my-4">
                  <Link to={RouterPath.SIGNUP} className="text-sky-400">
                    Sign Up
                  </Link>
                  <Link to={RouterPath.FORGOT_PASSWORD} className="text-sky-400">
                    Forgot Password?
                  </Link>
                </div>

                <div className="relative text-center my-4">
                  <hr />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="bg-white px-3 text-gray-500">or</span>
                  </div>
                </div>

                <div className="flex justify-center my-4">
                  <GoogleLogin
                    onSuccess={credentialResponse => {
                      handleSuccessGoogleLogin(credentialResponse["credential"]);
                    }}
                    onError={() => {
                      console.log('Login Failed');
                    }}
                  />
                </div>

                <div className="mt-4 p-3 bg-gray-100 rounded border">
                  <p className="mb-0 text-sm">
                    <span className="font-bold">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Test account
                    </span><br />
                    Login: test@test.com<br />
                    Password: 123123
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
