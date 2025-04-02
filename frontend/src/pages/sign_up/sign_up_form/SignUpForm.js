import { Button, Container, Row, Col, Card, Form } from "react-bootstrap";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { GoogleLogin } from '@react-oauth/google';
import DataService from "./SignUpFormService";
import { RouterPath } from "../../../assets/dictionary/RouterPath";

export default function SignUpForm(props) {
  const [isShowValidationError, setisShowValidationError] = useState(false);
  const [isShowUserExistsError, setisShowUserExistsError] = useState(false);
  const [isSendingRequest, setisSendingRequest] = useState(false);

  const [isSendingRequestLoginGoogle, setIsSendingRequestLoginGoogle] = useState(false);
  const [FirstNameForm, setFirstNameForm] = useState("");
  const [LastNameForm, setLastNameForm] = useState("");
  const [EmailForm, setEmailForm] = useState("");
  const [PasswordForm, setPasswordForm] = useState("");

  let navigate = useNavigate();

  const handleClick = (e) => {
    setisShowUserExistsError(false);
    setisSendingRequest(true);

    e.preventDefault();

    if (
      !FirstNameForm ||
      !LastNameForm ||
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
      var data = {
        first_name: FirstNameForm,
        last_name: LastNameForm,
        email: EmailForm.toLowerCase(),
        password: PasswordForm,
      };

      DataService.postSignUp(data)
        .then((response) => {
          if (response.status === 200) {
            navigate(RouterPath.SIGNUP_MAIL_SENT);
          } else {
            setisSendingRequest(false);
            setisShowValidationError(true);
          }
        })
        .catch((error) => {
          setisSendingRequest(false);
          if (error.response.status === 400) {
            setisShowUserExistsError(true);
          } else {
            setisShowValidationError(true);
          }
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
      <Container className="flex-grow-1 d-flex align-items-center justify-content-center">
        <Row className="justify-content-center my-4 w-100">
          <Col xs={12} sm={10} md={8} lg={6} xl={5} >
            <div className="d-flex align-items-center mb-2">
              <Button variant="link" className="text-secondary p-0" onClick={() => navigate(-1)}>
                <i className="bi bi-arrow-left"></i>
              </Button>
            </div>
            <Card className="border-0 shadow-sm">
              <Card.Body className="p-4 p-md-5">
                <div className="text-center mb-4">
                  <Card.Title className="fs-2 fw-bold mb-3">Sign Up</Card.Title>
                  <Card.Text className="text-secondary mb-4">
                    Welcome! 
                  </Card.Text>
                </div>

                <Form>
                  <Form.Group className="mb-4">
                    <Form.Control
                      type="text"
                      placeholder="First Name"
                      className="form-control-lg rounded-pill"
                      onChange={(event) => setFirstNameForm(event.target.value)}
                      value={FirstNameForm}
                    />
                  </Form.Group>
                  <Form.Group className="mb-4">
                    <Form.Control
                      type="text"
                      placeholder="Last Name"
                      className="form-control-lg rounded-pill"
                      onChange={(event) => setLastNameForm(event.target.value)}
                      value={LastNameForm}
                    />
                  </Form.Group>
                  <Form.Group className="mb-4">
                    <Form.Control
                      type="email"
                      placeholder="Email"
                      className="form-control-lg rounded-pill"
                      onChange={(event) => setEmailForm(event.target.value)}
                      value={EmailForm}
                    />
                    <Form.Text
                      className={
                        "mb-3 text-danger " + (isShowUserExistsError ? "" : "d-none")
                      }
                    >
                      User with this email exists already
                    </Form.Text>
                  </Form.Group>
                  <Form.Group className="mb-4">
                    <Form.Control
                      type="password"
                      placeholder="Password"
                      className="form-control-lg rounded-pill"
                      onChange={(event) => setPasswordForm(event.target.value)}
                      value={PasswordForm}
                    />
                  </Form.Group>


                  <Button
                    variant="primary"
                    type="submit"
                    className="bg-info text-white border-0 w-100 py-3 rounded-pill"
                    onClick={(e) => handleClick(e)}
                    disabled={isSendingRequest}
                  >
                    {isSendingRequest ? "Signing Up..." : "Sign Up"}
                  </Button>
                  <Card.Text
                    className={
                      "pt-2 text-danger " +
                      (isShowValidationError ? "" : "d-none")
                    }
                  >
                    *All fields are required
                  </Card.Text>
                </Form>

                <div className="d-flex justify-content-between my-4">
                      <Link to={RouterPath.LOGIN} className="text-info">
                        Log In 
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
                      console.log('Sign Up Failed');
                    }}
                  />
                </div>

                
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
