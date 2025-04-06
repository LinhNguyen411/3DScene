import { Button, Container, Row, Col, Card, Form } from "react-bootstrap";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { GoogleLogin } from '@react-oauth/google';
import { RouterPath } from "../../assets/dictionary/RouterPath";
import DataService from "./AdminLoginService";

export default function AdminLogin(props) {
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
            navigate(RouterPath.ADMIN_DASHBOARD);
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
          navigate(RouterPath.ADMIN_DASHBOARD);
        } else {
          setIsSendingRequestLoginGoogle(false);
        }
      })
      .catch((error) => {
        setIsSendingRequestLoginGoogle(false);
      });
  }

  return (
    <div className="admin-login-page">
      <Container className="d-flex justify-content-center align-items-center vh-100">
        <Card className="admin-login-card">
          <Card.Body className="p-4">
            <div className="text-center mb-4">
              <div className="d-flex justify-content-center align-items-center">
                <div className="logo-icon">
                  <div className="logo-bolt"></div>
                </div>
                <h2 className="brand-text">3DScene</h2>
              </div>
            </div>
            
            <Form>
              <Form.Group className="mb-3">
                <Form.Control
                  type="email"
                  placeholder="Email"
                  value={emailForm}
                  className="form-control-lg admin-form"
                  onChange={(event) => setEmailForm(event.target.value)}
                  required
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Control
                  type="password"
                  placeholder="Password"
                  className="form-control-lg admin-form"
                  value={passwordForm}
                  onChange={(e) => setPasswordForm(e.target.value)}
                  required
                />
              </Form.Group>
              
              {isShowValidationError && (
                <div className="mb-3 text-danger text-center">
                  Email or password not valid
                </div>
              )}

              <Button 
                variant="primary" 
                type="submit" 
                className="w-100 admin-login-button"
                onClick={(e) => handleClick(e)}
                disabled={isSendingRequest}
              >
                {isSendingRequest ? "Logging in..." : "Log In"}
              </Button>
            </Form>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
}
