// import { Button, Container, Row, Col, Card, Form} from "react-bootstrap";
import DataService from "./ProfilService"
import {useState, useEffect} from "react"

export default function Profil(props) {
  const [FirstName, setFirstName] = useState("");
  const [LastName, setLastName] = useState("");
  const [Email, setEmail] = useState("");


  useEffect(() => {
    DataService.getMyInfo()
    .then(
      response => {
      setFirstName(response.data.first_name)
      setLastName(response.data.last_name)
      setEmail(response.data.email)
    }
    )
    .catch((error) => {
      // console.log("error")
    });
  }, []);

  return (
    <>
      {/* <Container>
        <Row className="justify-content-center pt-5 ">
          <Col xs={12} sm={10} md={8} lg={6} xl={4} >
            <Card>
              <Card.Body>
                <Card.Title>Profil</Card.Title>
                <Form>
                  <Form.Group  className="mb-3">
                    <Form.Label>First name</Form.Label>
                    <Form.Control value={FirstName} disabled/>
                  </Form.Group>
                  <Form.Group  className="mb-3">
                    <Form.Label>Last name</Form.Label>
                    <Form.Control value={LastName} disabled/>
                  </Form.Group>
                  <Form.Group  className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <Form.Control value={Email} disabled/>
                  </Form.Group>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container> */}
    </>
  );
}
