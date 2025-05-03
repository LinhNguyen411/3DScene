import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
// import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";
// import 'bootstrap-icons/font/bootstrap-icons.css';

import { RouterPath } from "./assets/dictionary/RouterPath";
import { PrivateRoute } from "./components/auth/PrivateRoute";
import { AdminPrivateRoute } from "./components/admin_auth/AdminPrivateRoute";

import App from "./App";
import HomePage from "./pages/home_page/HomePage";
import Login from "./pages/login/Login";
import SignUpForm from "./pages/sign_up/sign_up_form/SignUpForm";
import ConfirmationEmailSent from "./pages/sign_up/confirmation_email_sent/ConfirmationEmailSent";
import ForgotPasswordForm from "./pages/forgot_password/forgot_password_form/ForgotPasswordForm";
import ForgotPasswordEmailSent from "./pages/forgot_password/forgot_password_email_sent/ForgotPasswordEmailSent";
import ResetPasswordForm from "./pages/forgot_password/reset_password/ResetPassword";
import PasswordChanged from "./pages/forgot_password/password_changed/PasswordChanged";
import LinkNotValid from "./pages/link_not_valid/LinkNotValid";
import ConfirmEmail from "./pages/sign_up/confirm_email/ConfirmEmail";
import Feedback from "./pages/dashboard/feedback/Feedback";

import Admin from "./Admin"
import AdminLogin from "./admin-pages/admin-login/AdminLogin"
import AdminDashboard from "./admin-pages/admin-dashboard/AdminDashboard";
import AdminSetting from "./admin-pages/admin-setting/AdminSetting";
import AdminSplat from "./admin-pages/admin-splat/AdminSplat";
import AdminUser from "./admin-pages/admin-user/AdminUser";
import DashboardLayout from "./pages/dashboard/DashboardLayout";
import Upload from "./pages/dashboard/upload/Upload";
import MyModel from './pages/dashboard/my_model/MyModel';
import ReactDOM from 'react-dom/client';
import { Navigate } from 'react-router-dom';
import Subscription from "./pages/subscription/Subscription";
import SubscriptionSuccess from "./pages/subscription/SubscriptionSuccess";
import SubscriptionCancel from "./pages/subscription/SubscriptionCancel";
import ModelView from "./pages/model_view/ModelView";
import AdminPayment from "./admin-pages/admin-payment/AdminPayment";

import {SnackbarProvider} from './provider/SnackbarProvider';
import {LoaderProvider} from './provider/LoaderProvider';
import Explore from "./pages/dashboard/explore/Explore";
import SetPassword from "./pages/sign_up/set_password/SetPassword";
import Billing from "./pages/dashboard/billing/Billing";
import Profile from "./pages/dashboard/profile/Profile";
import Terms from "./pages/privacy/Terms";
import Privacy from "./pages/privacy/Privacy";

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <LoaderProvider>
    <SnackbarProvider>
      <BrowserRouter>
        <Routes>
          <Route
              path={RouterPath.MODEL_VIEW}
              element={<ModelView />}
            />
          <Route path={RouterPath.HOME} element={<App />}>
            <Route index element={<HomePage />} />
            <Route path={RouterPath.TERMS} element={<Terms />} />
            <Route path={RouterPath.PRIVACY} element={<Privacy />} />
            
            <Route path={RouterPath.LOGIN} element={<Login />} />
            <Route path={RouterPath.SIGNUP} element={<SignUpForm />} />
            <Route
              path={RouterPath.SIGNUP_MAIL_SENT}
              element={<ConfirmationEmailSent />}
            />
            <Route
              path={RouterPath.SIGNUP_CONFIRM_EMAIL}
              element={<ConfirmEmail />}
            />
            <Route
              path={RouterPath.FORGOT_PASSWORD}
              element={<ForgotPasswordForm />}
            />
            <Route
              path={RouterPath.FORGOT_PASSWORD_MAIL_SENT}
              element={<ForgotPasswordEmailSent />}
            />
            <Route
              path={RouterPath.RESET_PASSWORD}
              element={<ResetPasswordForm />}
            />
            <Route
              path={RouterPath.PASSWORD_CHANGED}
              element={<PasswordChanged />}
            />

            <Route
              path={RouterPath.SIGNUP_SET_PASSWORD}
              element={
                <PrivateRoute>
                  <SetPassword />
                </PrivateRoute>
              }
            />


            <Route path={RouterPath.LINK_NOT_VALID} element={<LinkNotValid />} />
            <Route
              path={RouterPath.DASHBOARD}
              element={
                <PrivateRoute>
                  <DashboardLayout />
                </PrivateRoute>
              }
            >
              <Route index element={<Navigate to={RouterPath.DASHBOARD_UPLOAD} replace />} />
              <Route path={RouterPath.DASHBOARD_UPLOAD} element={<Upload />} />
              <Route path={RouterPath.DASHBOARD_MY_MODEL} element={<MyModel />} />
              <Route path={RouterPath.DASHBOARD_EXPLORE} element={<Explore />} />
              <Route path={RouterPath.DASHBOARD_FEEDBACK} element={<Feedback />} />
              <Route path={RouterPath.DASHBOARD_BILLING} element={<Billing />} />
              <Route path={RouterPath.DASHBOARD_PROFILE} element={<Profile />} />

            </Route>
            <Route
              path={RouterPath.SUBSCRIPTION}
              element={
                <PrivateRoute>
                  <Subscription />
                </PrivateRoute>
              }
            />
            <Route
              path={RouterPath.SUCCESS}
              element={
                <PrivateRoute>
                  <SubscriptionSuccess />
                </PrivateRoute>
              }
            />
            <Route
              path={RouterPath.CANCEL}
              element={
                <PrivateRoute>
                  <SubscriptionCancel />
                </PrivateRoute>
              }
            />
            <Route path="*" element={<LinkNotValid />} />
          </Route>

          <Route
            path={RouterPath.ADMIN_LOGIN}
            element={<AdminLogin />}
          />
          <Route
            path={RouterPath.ADMIN}
            element={
              <AdminPrivateRoute>
                <Admin />
              </AdminPrivateRoute>
            }
          >
            <Route index element={<Navigate to={RouterPath.ADMIN_DASHBOARD} replace />} />
            <Route path={RouterPath.ADMIN_DASHBOARD} element={<AdminDashboard />} />
            <Route path={RouterPath.ADMIN_SETTINGS} element={<AdminSetting />} />
            <Route path={RouterPath.ADMIN_SPLAT} element={<AdminSplat />} />
            <Route path={RouterPath.ADMIN_USER} element={<AdminUser />} />
            <Route path={RouterPath.ADMIN_PAYMENT} element={<AdminPayment />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </SnackbarProvider>
  </LoaderProvider>
);
