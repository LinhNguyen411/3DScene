import { Button, Container, Row, Col, Card } from "react-bootstrap";
import { Link } from "react-router-dom";
import { RouterPath } from "../../assets/dictionary/RouterPath";

export default function LinkNotValid(props) {
  return (
    <>
      <Container>
        <Row className="justify-content-center pt-5 ">
          <Col xs={12} sm={10} md={8} lg={6} xl={4} >
            <Card>
              <Card.Body>
                <Card.Title>Link is not valid :(</Card.Title>
                <Card.Text>
                  Sorry, but the link you used is not valid.
                </Card.Text>
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
