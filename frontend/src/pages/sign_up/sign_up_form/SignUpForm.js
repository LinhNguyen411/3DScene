import { useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Link } from "react-router-dom";
import { GoogleLogin } from '@react-oauth/google';
import { ArrowLeft } from "lucide-react";
import DataService from "./SignUpFormService";
import { RouterPath } from "../../../assets/dictionary/RouterPath";

export default function SignUpForm(props) {
  const {fetchAuthData} = useOutletContext();
  const [isShowValidationError, setIsShowValidationError] = useState(false);
  const [isShowUserExistsError, setIsShowUserExistsError] = useState(false);
  const [isSendingRequest, setIsSendingRequest] = useState(false);

  const [isSendingRequestLoginGoogle, setIsSendingRequestLoginGoogle] = useState(false);
  const [FirstNameForm, setFirstNameForm] = useState("");
  const [LastNameForm, setLastNameForm] = useState("");
  const [EmailForm, setEmailForm] = useState("");
  const [PasswordForm, setPasswordForm] = useState("");

  let navigate = useNavigate();

  const handleClick = (e) => {
    setIsShowUserExistsError(false);
    setIsSendingRequest(true);

    e.preventDefault();

    if (
      !FirstNameForm ||
      !LastNameForm ||
      !PasswordForm ||
      !String(EmailForm)
        .toLowerCase()
        .match(
          /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        )
    ) {
      setIsShowValidationError(true);
      setIsSendingRequest(false);
    } else {
      var data = {
        first_name: FirstNameForm,
        last_name: LastNameForm,
        email: EmailForm.toLowerCase(),
        password: PasswordForm,
      };

      DataService.postSignUp(data)
        .then((response) => {
          if (response.status === 200) {
            navigate(RouterPath.SIGNUP_MAIL_SENT);
          } else {
            setIsSendingRequest(false);
            setIsShowValidationError(true);
          }
        })
        .catch((error) => {
          setIsSendingRequest(false);
          if (error.response?.status === 400) {
            setIsShowUserExistsError(true);
          } else {
            setIsShowValidationError(true);
          }
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
          fetchAuthData();
          navigate(response.data.redirect_path);
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
      <div className="container mx-auto flex items-center justify-center px-4">
        <div className="w-full max-w-md my-4">
          <div className="flex items-center mb-2">
            <button 
              className="text-gray-500 hover:text-gray-700 p-0 flex items-center"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>
          
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 md:p-8">
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold mb-3">Sign Up</h1>
                <p className="text-gray-500 mb-6">Welcome!</p>
              </div>

              <form>
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="First Name"
                    className="w-full px-4 py-3 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-400"
                    onChange={(event) => setFirstNameForm(event.target.value)}
                    value={FirstNameForm}
                  />
                </div>
                
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Last Name"
                    className="w-full px-4 py-3 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-400"
                    onChange={(event) => setLastNameForm(event.target.value)}
                    value={LastNameForm}
                  />
                </div>
                
                <div className="mb-4">
                  <input
                    type="email"
                    placeholder="Email"
                    className="w-full px-4 py-3 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-400"
                    onChange={(event) => setEmailForm(event.target.value)}
                    value={EmailForm}
                  />
                  {isShowUserExistsError && (
                    <p className="mt-1 text-red-500 text-sm">
                      User with this email exists already
                    </p>
                  )}
                </div>
                
                <div className="mb-6">
                  <input
                    type="password"
                    placeholder="Password"
                    className="w-full px-4 py-3 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-400"
                    onChange={(event) => setPasswordForm(event.target.value)}
                    value={PasswordForm}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-sky-400 text-white py-3 px-4 rounded-full hover:bg-sky-500 transition-colors disabled:bg-sky-300"
                  onClick={(e) => handleClick(e)}
                  disabled={isSendingRequest}
                >
                  {isSendingRequest ? "Signing Up..." : "Sign Up"}
                </button>
                
                {isShowValidationError && (
                  <p className="mt-2 text-red-500 text-sm">
                    *All fields are required
                  </p>
                )}
              </form>

              <div className="flex justify-between my-6">
                <Link to={RouterPath.LOGIN} className="text-sky-400 hover:text-sky-500">
                  Log In
                </Link>
              </div>

              <div className="relative text-center my-6">
                <div className="border-t border-gray-300"></div>
                <span className="bg-white px-3 text-gray-500 text-sm relative -top-3">or</span>
              </div>

              <div className="flex justify-center my-6">
                <GoogleLogin
                  onSuccess={credentialResponse => {
                    handleSuccessGoogleLogin(credentialResponse["credential"]);
                  }}
                  onError={() => {
                    console.log('Sign Up Failed');
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
