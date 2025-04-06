import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Home } from "lucide-react";

import { RouterPath } from "../../../assets/dictionary/RouterPath";
import DataService from "./ConfirmEmailService";

export default function ConfirmEmail(props) {
  const [isSendingRequest, setIsSendingRequest] = useState(true);
  const [searchParams] = useSearchParams();

  let navigate = useNavigate();
  let token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      navigate(RouterPath.LINK_NOT_VALID);
    }

    DataService.postConfirmEmail(token)
      .then((response) => {
        if (response.status !== 200) {
          navigate(RouterPath.LINK_NOT_VALID);
        }
        setIsSendingRequest(false);
      })
      .catch((error) => {
        navigate(RouterPath.LINK_NOT_VALID);
      });
  }, [navigate, token]);

  return (
    <div className="bg-gray-100 flex flex-col min-h-screen">
      <div className={`container mx-auto px-4 ${isSendingRequest ? 'hidden' : ''}`}>
        <div className="flex justify-center pt-10">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-2">Email was confirmed!</h2>
              <p className="text-gray-600 mb-4">
                Log in with your email and password on the home page.
              </p>
              <Link to={RouterPath.HOME}>
                <button className="w-full bg-sky-400 text-white py-3 px-4 rounded-full flex items-center justify-center hover:bg-sky-500 transition-colors">
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
