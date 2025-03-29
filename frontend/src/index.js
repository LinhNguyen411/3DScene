import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { render } from "react-dom";

import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";
import 'bootstrap-icons/font/bootstrap-icons.css';

import { RouterPath } from "./assets/dictionary/RouterPath";
import { PrivateRoute } from "./components/auth/PrivateRoute";

import App from "./App";
import HomePage from "./pages/home_page/HomePage";
import Login from "./pages/login/Login";
import SignUpForm from "./pages/sign_up/sign_up_form/SignUpForm";
import ConfirmationEmailSent from "./pages/sign_up/confirmation_email_sent/ConfirmationEmailSent";
import ToDo from "./pages/dashboard/todos/ToDo";
import Profil from "./pages/dashboard/profil/Profil";
import ToDoDone from "./pages/dashboard/todos_done/ToDoDone";
import ForgotPasswordForm from "./pages/forgot_password/forgot_password_form/ForgotPasswordForm";
import ForgotPasswordEmailSent from "./pages/forgot_password/forgot_password_email_sent/ForgotPasswordEmailSent";
import ResetPasswordForm from "./pages/forgot_password/reset_password/ResetPassword";
import PasswordChanged from "./pages/forgot_password/password_changed/PasswordChanged";
import LinkNotValid from "./pages/link_not_valid/LinkNotValid";
import ConfirmEmail from "./pages/sign_up/confirm_email/ConfirmEmail";

const rootElement = document.getElementById("root");
render(
  <BrowserRouter>
    <Routes>
      <Route path={RouterPath.HOME} element={<App />}>
        <Route exact path={RouterPath.HOME} element={<HomePage />}></Route>
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

        <Route path={RouterPath.LINK_NOT_VALID} element={<LinkNotValid />} />

        <Route
          path={RouterPath.LIST_TODOS}
          element={
            <PrivateRoute>
              <ToDo />
            </PrivateRoute>
          }
        />
        <Route
          path={RouterPath.LIST_DONE}
          element={
            <PrivateRoute>
              <ToDoDone />
            </PrivateRoute>
          }
        />
        <Route
          path={RouterPath.MY_INFORMATION}
          element={
            <PrivateRoute>
              <Profil />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<LinkNotValid />} />
      </Route>
    </Routes>
  </BrowserRouter>,
  rootElement
);

