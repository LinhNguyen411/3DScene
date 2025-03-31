import { Container, Row, Col, Card, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import { RouterPath } from "../../assets/dictionary/RouterPath";
import myAppConfig from "../../config";

export default function HomePage(props) {
  const isAuthenticated = localStorage.getItem("token") ? true : false;
  
  return (
    <>
      {/* Hero Section */}
      <div 
        className="position-relative" 
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1513002749550-c59d786b8e6c?q=80&w=1374&auto=format&fit=crop')", 
          backgroundSize: "cover",
          backgroundPosition: "center",
          height: "500px",
          color: "white"
        }}
      >
        <div className="position-absolute w-100 h-100" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}></div>
        <Container className="position-relative h-100">
          <Row className="h-100 align-items-center text-center">
            <Col xs={12} md={8} lg={6} className="mx-auto">
              <h1 className="mb-2">EnvCap <span className="bg-info rounded px-2 py-1" style={{ fontSize: "1rem" }}>BETA</span></h1>
              <p className="mb-4">3D Scan Online</p>
              
              {!isAuthenticated ? (
                <>
                  <Link to={RouterPath.SIGNUP}>
                    <Button variant="info" size="lg" className="text-white px-4 mb-2">Join Now</Button>
                  </Link>
                  <div className="mt-2">
                    Already have an account? <Link to={RouterPath.LOGIN} className="text-info">Log in</Link>
                  </div>
                </>
              ) : (
                <Link to={RouterPath.LIST_TODOS}>
                  <Button variant="info" size="lg" className="text-white px-4">My Tasks</Button>
                </Link>
              )}
            </Col>
          </Row>
        </Container>
      </div>

      {/* What's EnvCap Section */}
      <Container className="py-5">
        <Card className="border-0 mb-5">
          <Card.Body className="text-center p-4">
            <h2 className="text-info mb-4">What's EnvCap?</h2>
            <Row className="justify-content-center">
              <Col md={10} lg={8}>
                <p>EnvCap is a central platform of task lightweight management where you can upload tasks quickly and easily.</p>
                <p>We use state-of-art productivity algorithms on the cloud to deliver professional task management to users</p>
              </Col>
            </Row>
          </Card.Body>
        </Card>
        
        {/* How to get started */}
        <Card className="border-0 mb-5">
          <Card.Body className="text-center p-4">
            <h2 className="text-info mb-4">How to get started with EnvCap</h2>
            <Row className="justify-content-center gx-5 gy-4 mt-3">
              <Col xs={12} md={4}>
                <Card className="h-100 shadow-sm">
                  <Card.Body>
                    <h5>Create Account</h5>
                    <p>Sign up and set up your personal or team profile</p>
                  </Card.Body>
                </Card>
              </Col>
              <Col xs={12} md={4}>
                <Card className="h-100 shadow-sm">
                  <Card.Body>
                    <h5>Add Tasks</h5>
                    <p>Create and organize your tasks with priorities</p>
                  </Card.Body>
                </Card>
              </Col>
              <Col xs={12} md={4}>
                <Card className="h-100 shadow-sm">
                  <Card.Body>
                    <h5>Track Progress</h5>
                    <p>Monitor completion and get insights on productivity</p>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Card.Body>
        </Card>
        
        {/* Tech Stack Section (Preserved from original) */}
        <Card>
          <Card.Header as="h5">Tech stack</Card.Header>
          <Card.Body>
            <Row className="g-4">
              <Col md={4}>
                <Card className="h-100">
                  <Card.Body>
                    <h5>FastAPI (Python)</h5>
                    <p>Web framework for developing RESTful APIs in Python</p>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4}>
                <Card className="h-100">
                  <Card.Body>
                    <h5>ReactJS</h5>
                    <p>Free and open-source front-end JavaScript library</p>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4}>
                <Card className="h-100">
                  <Card.Body>
                    <h5>Docker</h5>
                    <p>Open platform for developing, shipping, and running applications</p>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
            <div className="text-center mt-4">
              <Link to={RouterPath.HOME}>
                <Button variant="outline-secondary">Learn More</Button>
              </Link>
            </div>
          </Card.Body>
        </Card>
      </Container>
    </>
  );
}
