import { Link } from "react-router-dom";
import { RouterPath } from "../../../assets/dictionary/RouterPath";
import { Home } from "lucide-react";

export default function ConfirmationEmailSent(props) {
  return (
    <div className="bg-gray-100 flex flex-col min-h-screen">
      <div className="container mx-auto px-4">
        <div className="flex justify-center pt-10">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-2">Email has been sent!</h2>
              <p className="text-gray-600 mb-4">Check your email to confirm it.</p>
              <Link to={RouterPath.HOME}>
                <button className="w-full bg-sky-400 text-white py-3 px-4 rounded-full flex items-center justify-center hover:bg-sky-600 transition-colors">
                  <Home className="w-4 h-4 mr-2" />
                  Back to home page
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
