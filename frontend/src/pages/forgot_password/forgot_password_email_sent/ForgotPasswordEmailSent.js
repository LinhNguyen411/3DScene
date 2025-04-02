import { Button, Container, Row, Col, Card } from "react-bootstrap";
import { Link } from "react-router-dom";
import { RouterPath } from "../../../assets/dictionary/RouterPath";


export default function ForgotPasswordEmailSent(props) {
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
                  <Card.Title className="fs-2 fw-bold mb-3">Email has been sent !</Card.Title>
                  <Card.Text className="text-secondary mb-4">Check your email to reset the password.</Card.Text>
                </div>
                <Link to={RouterPath.HOME}>
                  <Button variant="primary" type="submit" className="bg-info text-white border-0 w-100 py-3 rounded-pill">
                    Back to home page
                  </Button>
                </Link>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
