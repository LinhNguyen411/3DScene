import { Button, Container, Row, Col, Card } from "react-bootstrap";
import { Link } from "react-router-dom";
import { RouterPath } from "../../../assets/dictionary/RouterPath";

export default function PasswordChanged(props) {
  return (
    <>
      <Container>
        <Row className="justify-content-center pt-5 ">
          <Col xs={12} sm={10} md={8} lg={6} xl={4} >
            <Card>
              <Card.Body>
                <Card.Title>Password has been changed!</Card.Title>
                <Card.Text>Log in with your email and new password.</Card.Text>
                <Link to={RouterPath.HOME}>
                  <Button variant="primary" type="submit" className="w-100">
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
