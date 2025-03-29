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
            <Navbar bg="dark" variant="dark"  expand="md">
              <Container className="pe-0">
                <Row className="w-100 justify-content-between">
                  <Col xs={8} md={9} className="d-flex">

                    <LinkContainer className="brand" to={RouterPath.HOME}>
                      <Navbar.Brand>EnvCap</Navbar.Brand>
                    </LinkContainer>
                  {isAuthenticated && (
                          <>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" className="me-3"/>
                    
                    <Navbar.Collapse id="basic-navbar-nav">
                    
                      <Nav className="me-auto" activeKey={location.pathname}>
                        
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
                    </>
                        )}
                  </Col>
                  <Col
                    xs={3}
                    className="align-items-end d-flex flex-row-reverse gap-2"
                  >
                    {!isAuthenticated && (
                      <>
                        <Link to={RouterPath.SIGNUP}>
                          <Button className="text-nowrap">Sign up</Button>
                        </Link>
                        <Link className="ml-1" to={RouterPath.LOGIN}>
                          <Button variant="success">Login</Button>
                        </Link>
                      </>
                    )}
                    {isAuthenticated && (
                      <>
                        <Button className="text-nowrap"
                          variant="info"
                          onClick={(e) => handleClickLogOut(e)}
                        >
                          Log out
                        </Button>
                      </>
                    )}
                  </Col>
                </Row>
              </Container>
            </Navbar>
          </Col>
        </Row>
      </Container>
    </>
  );
}
