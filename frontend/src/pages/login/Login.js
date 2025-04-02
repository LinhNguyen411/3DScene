import { Button, Container, Row, Col, Card, Form } from "react-bootstrap";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { GoogleLogin } from '@react-oauth/google';
import { RouterPath } from "../../assets/dictionary/RouterPath";
import DataService from "./LoginService";

export default function Login(props) {
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
            navigate(RouterPath.LIST_TODOS);
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
          navigate(RouterPath.LIST_TODOS);
        } else {
          setIsSendingRequestLoginGoogle(false);
        }
      })
      .catch((error) => {
        setIsSendingRequestLoginGoogle(false);
      });
  }

  return (
    <div className="bg-light  d-flex flex-column">
      {/* Header */}

      {/* Main Content */}
      <Container className="flex-grow-1 d-flex align-items-center justify-content-center">
        <Row className="justify-content-center my-4 w-100">
          <Col xs={12} sm={10} md={8} lg={6} xl={5}>
            <div className="d-flex align-items-center mb-2">
              <Button variant="link" className="text-secondary p-0" onClick={() => navigate(-1)}>
                <i className="bi bi-arrow-left"></i>
              </Button>
            </div>
            
            <Card className="border-0 shadow-sm">
              <Card.Body className="p-4 p-md-5">
                <div className="text-center mb-4">
                  <Card.Title className="fs-2 fw-bold mb-3">Log In</Card.Title>
                  <Card.Text className="text-secondary mb-4">
                    Welcome back! 
                  </Card.Text>
                </div>

                <Form>
                  <Form.Group className="mb-4">
                    <Form.Control
                      type="email"
                      placeholder="Email Address"
                      className="form-control-lg rounded-pill"
                      onChange={(event) => setEmailForm(event.target.value)}
                      value={emailForm}
                    />
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Control
                      type="password"
                      placeholder="Password"
                      className="form-control-lg rounded-pill"
                      onChange={(event) => setPasswordForm(event.target.value)}
                      value={passwordForm}
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
                    className="bg-info text-white border-0 w-100 py-3 rounded-pill"
                    onClick={(e) => handleClick(e)}
                    disabled={isSendingRequest}
                  >
                    {isSendingRequest ? "Logging in..." : "Log In"}
                  </Button>
                </Form>

                <div className="d-flex justify-content-between my-4">
                  <Link to={RouterPath.SIGNUP} className="text-info">
                    Sign Up
                  </Link>
                  <Link to={RouterPath.FORGOT_PASSWORD} className="text-info">
                    Forgot Password?
                  </Link>
                </div>

                <div className="position-relative text-center my-4">
                  <hr />
                  <div className="divider-text bg-white px-3 text-secondary">or</div>
                </div>

                <div className="d-flex justify-content-center my-4">
                  <GoogleLogin
                    onSuccess={credentialResponse => {
                      handleSuccessGoogleLogin(credentialResponse["credential"]);
                    }}
                    onError={() => {
                      console.log('Login Failed');
                    }}
                  />
                </div>

                <div className="mt-4 p-3 bg-light rounded border">
                  <p className="mb-0 small">
                    <span className="fw-bold"><i className="bi bi-info-circle-fill me-1"></i>Test account</span><br />
                    Login: test@test.com<br />
                    Password: 123123
                  </p>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
