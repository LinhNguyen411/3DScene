import { Button, Container, Row, Col, Card, Form } from "react-bootstrap";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { RouterPath } from "../../../assets/dictionary/RouterPath";
import DataService from "./ForgotPasswordFormService";

export default function ForgotPasswordForm(props) {
  const [isEmailValidationError, setisEmailValidationError] = useState(false);
  const [isSendingRequest, setisSendingRequest] = useState(false);
  const [EmailForm, setEmailForm] = useState("");

  let navigate = useNavigate();

  const handleClick = (e) => {
    setisSendingRequest(true);
    e.preventDefault();

    if (
      !String(EmailForm)
        .toLowerCase()
        .match(
          /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        )
    ) {
      setisEmailValidationError(true);
      setisSendingRequest(false);
    } else {
      DataService.postSendEmailForgotPassword(EmailForm.toLowerCase())
        .then((response) => {
          if (response.status === 200 || response.status === 201) {
            navigate(RouterPath.FORGOT_PASSWORD_MAIL_SENT);
          } else {
            setisSendingRequest(false);
            setisEmailValidationError(true);
          }
        })
        .catch((error) => {
          setisSendingRequest(false);
          setisEmailValidationError(true);
        });
    }
  };

  return (
    <div className="bg-light d-flex flex-column">
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
                  <Card.Title className="fs-2 fw-bold mb-3">Forgot Password</Card.Title>
                </div>
                <Form>
                  <Form.Group className="mb-4" controlId="formBasicEmail">
                    <Form.Control
                      type="email"
                      placeholder="Email Address"
                      className="form-control-lg rounded-pill"
                      onChange={(event) => setEmailForm(event.target.value)}
                      value={EmailForm}
                    />
                    <Form.Text
                      className={
                        "text-danger " +
                        (isEmailValidationError ? "" : "d-none")
                      }
                    >
                      Enter valid email
                    </Form.Text>
                  </Form.Group>
                  <Button
                    variant="primary"
                    type="submit"
                    className="bg-info text-white border-0 w-100 py-3 rounded-pill"
                    onClick={(e) => handleClick(e)}
                    disabled={isSendingRequest}
                  >
                    Send reset link
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
