import { Button, Container, Row, Col, Card } from "react-bootstrap";
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";

import { RouterPath } from "../../../assets/dictionary/RouterPath";
import DataService from "./ConfirmEmailService";

export default function ConfirmEmail(props) {
  const [isSendingRequest, setisSendingRequest] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  let navigate = useNavigate();
  let token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      navigate(RouterPath.LINK_NOT_VALID);
    }

    DataService.postConfirmEmail(token)
      .then((response) => {
        if (response.status !== 200) {
          navigate(RouterPath.LINK_NOT_VALID);
        }
        setisSendingRequest(false);
      })
      .catch((error) => {
        navigate(RouterPath.LINK_NOT_VALID);
      });
  }, []);

  return (
    <>
      <Container className={isSendingRequest ? "d-none" : ""}>
        <Row className="justify-content-center pt-5 ">
          <Col xs={12} sm={10} md={8} lg={6} xl={4} >
            <Card>
              <Card.Body>
                <Card.Title>Email was confirmed !</Card.Title>
                <Card.Text>
                  Log in with your email and password on the home page.
                </Card.Text>
                <Link to={RouterPath.HOME}>
                  <Button variant="primary" type="submit" className="w-100 text-white bg-info border-0 rounded-pill py-3">
                    Back to home page
                  </Button>
                </Link>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
}
