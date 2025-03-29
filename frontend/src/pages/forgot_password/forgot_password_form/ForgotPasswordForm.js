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
    <>
      <Container>
        <Row className="justify-content-center pt-5 ">
          <Col xs={12} sm={10} md={8} lg={6} xl={4} >
            <Card>
              <Card.Body>
                <Card.Title>Forgot password?</Card.Title>
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
                    className="w-100"
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
    </>
  );
}
