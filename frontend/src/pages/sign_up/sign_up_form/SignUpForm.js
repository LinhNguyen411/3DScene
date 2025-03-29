import { Button, Container, Row, Col, Card, Form } from "react-bootstrap";
import { useState } from "react";
import DataService from "./SignUpFormService";
import { useNavigate } from "react-router-dom";
import { RouterPath } from "../../../assets/dictionary/RouterPath";

export default function SignUpForm(props) {
  const [isShowValidationError, setisShowValidationError] = useState(false);
  const [isShowUserExistsError, setisShowUserExistsError] = useState(false);
  const [isSendingRequest, setisSendingRequest] = useState(false);

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

  return (
    <>
      <Container>
        <Row className="justify-content-center pt-5 ">
          <Col xs={12} sm={10} md={8} lg={6} xl={4} >
            <Card>
              <Card.Body>
                <Card.Title>Sign up</Card.Title>
                <Form>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      First name<span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      placeholder="First name"
                      onChange={(event) => setFirstNameForm(event.target.value)}
                      value={FirstNameForm}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      Last name<span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      placeholder="Last name"
                      onChange={(event) => setLastNameForm(event.target.value)}
                      value={LastNameForm}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      Email<span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="email"
                      placeholder="Email"
                      onChange={(event) => setEmailForm(event.target.value)}
                      value={EmailForm}
                    />
                    <Form.Text
                      className={
                        "text-danger " + (isShowUserExistsError ? "" : "d-none")
                      }
                    >
                      User with this email exists already
                    </Form.Text>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>
                      Password<span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Password"
                      onChange={(event) => setPasswordForm(event.target.value)}
                      value={PasswordForm}
                    />
                    <Form.Text className="text-muted">
                      Minimum 6 characters
                    </Form.Text>
                  </Form.Group>
                </Form>
                <Button
                  variant="primary"
                  className="w-100"
                  onClick={(e) => handleClick(e)}
                  disabled={isSendingRequest}
                >
                  Sign up
                </Button>
                <Card.Text
                  className={
                    "pt-2 text-danger " +
                    (isShowValidationError ? "" : "d-none")
                  }
                >
                  *All fields are required
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
}
