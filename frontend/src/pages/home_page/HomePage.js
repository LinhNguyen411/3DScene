import { Container, Row, Col, Card, Accordion } from "react-bootstrap";
import { RouterPath } from "../../assets/dictionary/RouterPath"
import myAppConfig from "../../config";

export default function HomePage(props) {
  return (
    <>
      <Container>
        <Row className="justify-content-center pt-5 ">
          <Col xs={12} sm={12} md={10} lg={8} xl={6} >
            <Card>
            <Card.Header as="h5">Welcome to EnvCap!</Card.Header>
              <Card.Body>
                <Card.Title as="h6" className="mb-3">Tech stack </Card.Title>
                <Accordion alwaysOpen>
                <Accordion.Item eventKey="0">
                    <Accordion.Header>FastAPI (Python)</Accordion.Header>
                    <Accordion.Body>
                    <span className="fw-bold">FastAPI</span> is a Web framework for developing RESTful APIs in Python.
                    <ul className="mt-2">
                      <li>FastAPI v0.73</li>
                      <li>SQLAlchemy (SQL toolkit and Object Relational Mapper)</li>
                      <li>Pydantic (Python data validation)</li>
                      <li>REST API</li>
                      <li>Swagger (API documentation)</li>
                      <li>Uvicorn (ASGI server)</li>
                      <li>Bcrypt</li>
                      <li>Alembic</li>
                      <li>Pytest</li>
                      <li>Logger</li>
                      </ul>
                    </Accordion.Body>
                  </Accordion.Item>
                  <Accordion.Item eventKey="1">
                    <Accordion.Header>Celery, Redis and Flower</Accordion.Header>
                    <Accordion.Body>
                    <p><span className="fw-bold">Celery</span> is a task queue with focus on real-time processing, while also supporting task scheduling.</p>
                    <p><span className="fw-bold">Redis</span> is a performant, in memory, key-value data store used to store messages produced by the application code describing the work to be done in the Celery task queue.</p>
                    <p><span className="fw-bold">Flower</span> is a web based tool for monitoring and administrating Celery clusters.</p>
                    <a href={myAppConfig.frontend.FRONTEND_DOMAIN + RouterPath.FLOWER} target="_blank" rel="noreferrer" className="mt-2">Click here to open Flower!</a>
                    </Accordion.Body>
                  </Accordion.Item>
                  <Accordion.Item eventKey="2">
                    <Accordion.Header>ReactJS (JavaScript)</Accordion.Header>
                    <Accordion.Body>
                    <span className="fw-bold">React</span> (also known as React.js or ReactJS) is a free and open-source front-end JavaScript library.
                      <ul className="mt-2">
                      <li>React v17 (using Reactjs hooks)</li>
                      <li>React-router-dom v6 (dynamic routing)</li>
                      <li>Axios</li>
                      <li>React-bootstrap v2 (Bootstrap v5)</li>
                      <li>React-bootstrap-table-next</li>
                      <li>React-paginate</li>
                      </ul>
                    </Accordion.Body>
                  </Accordion.Item>
                  <Accordion.Item eventKey="3">
                    <Accordion.Header>Figma (UI/UX design)</Accordion.Header>
                    <Accordion.Body>
                    <span className="fw-bold">Figma</span> is a vector graphics editor and web applications prototyping tool. The Figma allow viewing and interacting with Figma prototypes in real-time. The feature set of Figma focuses on use in user interface and user experience design, with an emphasis on real-time collaboration.
                    <ul className="mt-2">
                    <li>Bootstrap components and grid</li>
                    <li>Auto-layout components</li>
                    </ul>
                    <a href="https://www.figma.com/file/dDITdZCtk8jSuA27AkuwPj/Awesome-Todo?node-id=1%3A3" target="_blank" rel="noreferrer" className="mt-2">Click here to see the app prototype!</a>
                    </Accordion.Body>
                  </Accordion.Item>
                  <Accordion.Item eventKey="4">
                    <Accordion.Header>PostgreSQL and PGAdmin</Accordion.Header>
                    <Accordion.Body>
                    <p><span className="fw-bold">PostgreSQL</span> is a free and open-source relational database management system.</p>
                    <p><span className="fw-bold">PGAdmin</span> is a web-based Graphical User Interface (GUI) management application used to communicate with Postgres and derivative relational databases.</p>
                    </Accordion.Body>
                  </Accordion.Item>
                  <Accordion.Item eventKey="5">
                    <Accordion.Header>Docker and Docker-compose</Accordion.Header>
                    <Accordion.Body>
                    <span className="fw-bold">Docker</span> is an open platform for developing, shipping, and running applications. Docker let to separate applications from infrastructure for quick software delivery software. 
                    Docker’s methodologies for shipping, testing, and deploying code quickly allow significantly reduce the delay between writing code and running it in production.
                    <br/><br/>
                    <span className="fw-bold">Docker Compose</span> is a tool that was developed to help define and share multi-container applications. With Compose, we can create a YAML file to define the services and with a single command, can spin everything up or tear it all down.

                    </Accordion.Body>
                  </Accordion.Item>
                  <Accordion.Item eventKey="6">
                    <Accordion.Header>GitLab</Accordion.Header>
                    <Accordion.Body>
                    <span className="fw-bold">GitLab</span> is a web-based Git repository that provides free open and private repositories, issue-following capabilities, and wikis. 

                    </Accordion.Body>
                  </Accordion.Item>
                  <Accordion.Item eventKey="7">
                    <Accordion.Header>Nginx</Accordion.Header>
                    <Accordion.Body>
                    <span className="fw-bold">NGINX</span> is open source software for web serving, reverse proxying, caching, load balancing, media streaming, and more. 
                    </Accordion.Body>
                  </Accordion.Item>
                  <Accordion.Item eventKey="8">
                    <Accordion.Header>MailHog</Accordion.Header>
                    <Accordion.Body>
                    <p><span className="fw-bold">MailHog</span> is an email-testing tool with a fake SMTP server underneath.</p>
                    <a href={myAppConfig.frontend.FRONTEND_DOMAIN + RouterPath.MAILHOG} target="_blank" rel="noreferrer" className="mt-2">Click here to open MailHog!</a>
                    </Accordion.Body>
                  </Accordion.Item>

                </Accordion>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
}
