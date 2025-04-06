import { Link } from "react-router-dom";
import { RouterPath } from "../../assets/dictionary/RouterPath";

export default function LinkNotValid(props) {
  return (
    <>
      <div className="container mx-auto px-4">
        <div className="flex justify-center pt-5">
          <div className="w-full sm:w-4/5 md:w-2/3 lg:w-1/2 xl:w-1/3">
            <div className="bg-white rounded shadow p-6">
              <h2 className="text-xl font-semibold mb-2">Link is not valid :(</h2>
              <p className="text-gray-600 mb-4">
                Sorry, but the link you used is not valid.
              </p>
              <Link to={RouterPath.HOME}>
                <button type="submit" className="bg-sky-400 hover:bg-sky-500 text-white w-full py-2 px-4 rounded">
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
