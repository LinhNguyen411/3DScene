import { Link, useNavigate } from "react-router-dom";
import { RouterPath } from "../../../assets/dictionary/RouterPath";

export default function ForgotPasswordEmailSent(props) {
  let navigate = useNavigate();
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
                  <h1 className="text-2xl font-bold mb-3">Email has been sent!</h1>
                  <p className="text-gray-500 mb-4">Check your email to reset the password.</p>
                </div>
                <Link to={RouterPath.HOME}>
                  <button 
                    type="submit" 
                    className="bg-sky-400 hover:bg-sky-500 text-white border-0 w-full py-3 rounded-full"
                  >
                    Back to home page
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
