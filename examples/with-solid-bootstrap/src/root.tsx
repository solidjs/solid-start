// @refresh reload
import 'bootstrap/scss/bootstrap.scss';
import { Container, Nav, Navbar, NavDropdown } from 'solid-bootstrap';
import { Suspense } from "solid-js";
import {
  Body,
  ErrorBoundary,
  FileRoutes,
  Head,
  Html,
  Meta,
  Routes,
  Scripts,
  Title
} from "solid-start";

export default function Root() {
  return (
    <Html lang="en">
      <Head>
        <Title>SolidStart - Bare</Title>
        <Meta charset="utf-8" />
        <Meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Body>
        <Suspense>
          <ErrorBoundary>
            <Navbar variant="dark" bg="dark" expand="lg" class="mb-4">
              <Container fluid>
                <Navbar.Brand href="#home">Solid-Bootstrap</Navbar.Brand>
                <Navbar.Toggle aria-controls="navbar-dark-example" />
                <Navbar.Collapse id="navbar-dark-example">
                  <Nav>
                    <Nav.Item>
                      <Nav.Link href="/">Index</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link href="/about">About</Nav.Link>
                    </Nav.Item>
                    <NavDropdown
                      id="nav-dropdown-dark-example"
                      title="Dropdown"
                      menuVariant="dark"
                    >
                      <NavDropdown.Item href="#action/3.1">Action</NavDropdown.Item>
                      <NavDropdown.Item href="#action/3.2">Another action</NavDropdown.Item>
                      <NavDropdown.Item href="#action/3.3">Something</NavDropdown.Item>
                      <NavDropdown.Divider />
                      <NavDropdown.Item href="#action/3.4">Separated link</NavDropdown.Item>
                    </NavDropdown>
                  </Nav>
                </Navbar.Collapse>
              </Container>
            </Navbar>

            <Routes>
              <FileRoutes />
            </Routes>
          </ErrorBoundary>
        </Suspense>
        <Scripts />
      </Body>
    </Html>
  );
}
