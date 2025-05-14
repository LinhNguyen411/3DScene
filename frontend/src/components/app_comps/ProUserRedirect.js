import { Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import DataService from "./SubscriptionServices";
import { RouterPath } from "../../assets/dictionary/RouterPath";

export const ProUserRedirect = ({ children }) => {
  const [isProUser, setIsProUser] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Assuming your DataService has a method to get user info
    // You can adjust this based on your actual API/service structure
    DataService.getUserInfo()
      .then((response) => {
        setIsLoaded(true);
        // Check if user is pro and set state accordingly
        setIsProUser(response.user && response.user.is_pro);
      })
      .catch((error) => {
        setIsLoaded(true);
        setIsProUser(false);
      });
  }, []);

  // If loading is complete
  if (isLoaded) {
    // If user is a pro member, redirect to dashboard
    if (isProUser) {
      return <Navigate to={RouterPath.DASHBOARD} />;
    } else {
      // Not a pro user, show subscription page
      return children;
    }
  } else {
    // Still loading, return nothing or a loading spinner
    return null;
  }
};

export default ProUserRedirect;