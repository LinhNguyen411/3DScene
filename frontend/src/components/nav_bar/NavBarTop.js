import { Button, Container, Row, Col, Navbar, Nav } from "react-bootstrap";
import { RouterPath } from "../../assets/dictionary/RouterPath";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { LinkContainer } from "react-router-bootstrap";

export default function NavBarTop(props) {
  const isAuthenticated = localStorage.getItem("token") ? true : false;
  let navigate = useNavigate();
  const location = useLocation();

  const handleClickLogOut = (e) => {
    e.preventDefault();
    localStorage.removeItem("token");
    navigate(RouterPath.HOME);
  };

  return (
    <>
      <Container fluid>
        <Row>
          <Col className="p-0">
            <Navbar bg="light" variant="light" expand="md" className="py-2">
              <Container>
                <LinkContainer to={RouterPath.HOME}>
                  <Navbar.Brand className="d-flex align-items-center">
                    <span className="fw-bold me-2">EnvCap</span>
                    <span className="text-white bg-info rounded px-2 py-1" style={{ fontSize: "0.8rem" }}>BETA</span>
                  </Navbar.Brand>
                </LinkContainer>
                
                <Nav className="mx-auto d-none d-md-flex">
                  <LinkContainer to={RouterPath.HOME}>
                    <Nav.Link>Community</Nav.Link>
                  </LinkContainer>
                  <LinkContainer to={RouterPath.HOME}>
                    <Nav.Link>Tutorial</Nav.Link>
                  </LinkContainer>
                  <LinkContainer to={RouterPath.HOME}>
                    <Nav.Link>EnvCap Pro</Nav.Link>
                  </LinkContainer>
                </Nav>

                <Nav className="ms-auto">
                  {!isAuthenticated && (
                    <>
                      <LinkContainer to={RouterPath.LOGIN}>
                        <Nav.Link>Log In</Nav.Link>
                      </LinkContainer>
                      <Link to={RouterPath.SIGNUP}>
                        <Button variant="info" className="text-white">Sign Up</Button>
                      </Link>
                    </>
                  )}
                  
                  {isAuthenticated && (
                    <>
                      <Navbar.Toggle aria-controls="basic-navbar-nav" className="me-3"/>
                      <Navbar.Collapse id="basic-navbar-nav">
                        <Nav activeKey={location.pathname}>
                          <LinkContainer to={RouterPath.LIST_TODOS}>
                            <Nav.Link>List To do</Nav.Link>
                          </LinkContainer>
                          <LinkContainer to={RouterPath.LIST_DONE}>
                            <Nav.Link>List done</Nav.Link>
                          </LinkContainer>
                          <LinkContainer to={RouterPath.MY_INFORMATION}>
                            <Nav.Link>My information</Nav.Link>
                          </LinkContainer>
                        </Nav>
                      </Navbar.Collapse>
                      <Button
                        variant="outline-info"
                        onClick={(e) => handleClickLogOut(e)}
                        className="ms-3"
                      >
                        Log out
                      </Button>
                    </>
                  )}
                </Nav>
              </Container>
            </Navbar>
          </Col>
        </Row>
      </Container>
    </>
  );
}
