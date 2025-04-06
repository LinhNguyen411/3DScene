import { Link } from "react-router-dom";
import { RouterPath } from "../../../assets/dictionary/RouterPath";

export default function PasswordChanged(props) {
  return (
    <>
      <div className="container mx-auto px-4">
        <div className="flex justify-center pt-5">
          <div className="w-full sm:w-4/5 md:w-2/3 lg:w-1/2 xl:w-1/3">
            <div className="bg-white rounded shadow p-6">
              <h2 className="text-xl font-semibold mb-2">Password has been changed!</h2>
              <p className="text-gray-600 mb-4">Log in with your email and new password.</p>
              <Link to={RouterPath.HOME}>
                <button 
                  type="submit" 
                  className="bg-sky-400 hover:bg-sky-500- text-white border-0 w-full py-3 rounded-full"
                >
                  Back to home page
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
