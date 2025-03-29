import { Button, Container, Row, Col, Card, Form, Alert } from "react-bootstrap";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LinkContainer } from "react-router-bootstrap";
import { GoogleLogin } from '@react-oauth/google';

import DataService from "./LoginService";
import { RouterPath } from "../../assets/dictionary/RouterPath";


export default function HomePage(props) {
  const [isShowValidationError, setisShowValidationError] = useState(false);
  const [isSendingRequest, setisSendingRequest] = useState(false);
  const [isSendingRequestLoginGoogle, setisSendingRequestLoginGoogle] = useState(false);
  const [EmailForm, setEmailForm] = useState("");
  const [PasswordForm, setPasswordForm] = useState("");

  let navigate = useNavigate();


  const handleClick = (e) => {
    setisSendingRequest(true);
    e.preventDefault();
    if (
      !PasswordForm ||
      !String(EmailForm)
        .toLowerCase()
        .match(
          /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        )
    ) {
      setisShowValidationError(true);
      setisSendingRequest(false);
    } else {
      var bodyFormData = new FormData();
      bodyFormData.append("username", EmailForm.toLowerCase());
      bodyFormData.append("password", PasswordForm);
      DataService.postLogin(bodyFormData)
        .then((response) => {
          if (response.status === 200) {
            localStorage.setItem("token", response.data.access_token);
            navigate(RouterPath.LIST_TODOS);
          } else {
            setisSendingRequest(false);
            setisShowValidationError(true);
          }
        })
        .catch((error) => {
          setisSendingRequest(false);
          setisShowValidationError(true);
        });
    }
  };

  const handleSuccesGoogleLogin = (credentials) => {
    setisSendingRequestLoginGoogle(true);
    DataService.postLoginGoogle({
      "credentials": credentials
    })
      .then((response) => {
        if (response.status === 200) {
          localStorage.setItem("token", response.data.access_token);
          navigate(RouterPath.LIST_TODOS);
        } else {
          setisSendingRequestLoginGoogle(false);
        }
      })
      .catch((error) => {
        setisSendingRequestLoginGoogle(false);
      });
  }

  return (
    <>
      <Container>
        <Row className="justify-content-center pt-5 ">
          <Col xs={12} sm={10} md={8} lg={6} xl={4} >
            <Card>
              <Card.Body>
                <Card.Title>Login</Card.Title>
                <Form>
                  <Form.Group className="mb-3" controlId="formBasicEmail">
                    <Form.Label>
                      Email<span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="email"
                      placeholder="Enter email"
                      onChange={(event) => setEmailForm(event.target.value)}
                      value={EmailForm}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="formBasicPassword">
                    <Form.Label>
                      Password<span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Password"
                      onChange={(event) => setPasswordForm(event.target.value)}
                      value={PasswordForm}
                    />
                  </Form.Group>
                  <Button
                    variant="primary"
                    type="submit"
                    className="w-100 mb-2"
                    onClick={(e) => handleClick(e)}
                    disabled={isSendingRequest}
                  >
                    Login
                  </Button>
                  <Form.Text
                    className={
                      "text-danger " + (isShowValidationError ? "" : "d-none")
                    }
                  >
                    Email or password not valid
                  </Form.Text>
                </Form>

                <LinkContainer to={RouterPath.FORGOT_PASSWORD}>
                  <Card.Link>Forgot password?</Card.Link>
                </LinkContainer>
                <div className="pt-2 pb-2">
                  <GoogleLogin

                    onSuccess={credentialResponse => {
                      handleSuccesGoogleLogin(credentialResponse["credential"]);
                    }}
                    onError={() => {
                      console.log('Login Failed');
                    }}
                  />
                </div>
                <Alert variant="success" className="mt-2">
                  <p className="mb-0"><span className="fw-bold"><i class="bi bi-info-circle-fill"></i> Test account</span><br />
                    Login: test@test.com<br />
                    Password: 123123</p>
                </Alert>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
}
