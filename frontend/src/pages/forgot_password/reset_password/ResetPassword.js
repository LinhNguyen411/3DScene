import { Button, Container, Row, Col, Card, Form } from "react-bootstrap";
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { RouterPath } from "../../../assets/dictionary/RouterPath";
import DataService from "./ResetPasswordService";

export default function ResetPassword(props) {
  const [isValidationError, setisValidationError] = useState(false);
  const [isSendingRequest, setisSendingRequest] = useState(false);
  const [PasswordForm, setPasswordForm] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();

  let navigate = useNavigate();
  let token = searchParams.get("token");

  useEffect(() => {
    if (token == null) {
      navigate(RouterPath.LINK_NOT_VALID);
    }
  }, []);

  const handleClick = (e) => {
    setisSendingRequest(true);
    e.preventDefault();

    if (PasswordForm.length < 6) {
      setisValidationError(true);
      setisSendingRequest(false);
    } else {
      var data = {
        new_password: PasswordForm,
        token: token,
      };

      DataService.postResetPassword(data)
        .then((response) => {
          if (response.status === 200) {
            navigate(RouterPath.PASSWORD_CHANGED);
          } else {
            setisSendingRequest(false);
            setisValidationError(true);
          }
        })
        .catch((error) => {
          if (error.response.status === 400) {
            navigate(RouterPath.LINK_NOT_VALID);
          } else {
            setisSendingRequest(false);
            setisValidationError(true);
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
                <Card.Title>Reset password</Card.Title>
                <Form>
                  <Form.Group className="mb-3" controlId="formBasicEmail">
                    <Form.Label>
                      New password<span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      placeholder="Password"
                      type="password"
                      onChange={(event) => setPasswordForm(event.target.value)}
                      value={PasswordForm}
                    />
                    <Form.Text
                      className={isValidationError ? "text-danger" : ""}
                    >
                      Minimum 6 characters
                    </Form.Text>
                  </Form.Group>
                  <Button
                    variant="primary"
                    type="submit"
                    className="bg-info text-white border-0 w-100 py-3 rounded-pill"
                    onClick={(e) => handleClick(e)}
                    disabled={isSendingRequest}
                  >
                    Change
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
