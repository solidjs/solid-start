describe("server-function", () => {
  it("should have isServer false in the client", () => {
    cy.visit("/");
    cy.get("#server-fn-test").contains('{"clientWithIsServer":false}');
  });
  it("should have isServer true in the server function - nested", () => {
    cy.visit("/is-server-nested");
    cy.get("#server-fn-test").contains('{"serverFnWithIsServer":true}');
  });
  it("should have an id of type string in the server function meta - nested", () => {
    cy.visit("/server-function-meta-nested");
    cy.get("#server-fn-test").contains('{"serverFnWithMeta":"string"}');
  });
  it("should externalize node builtin in server function - nested", () => {
    cy.visit("/node-builtin-nested");
    cy.get("#server-fn-test").contains('{"serverFnWithNodeBuiltin":"can/externalize"}');
  });
  it("should externalize npm module in server function - nested", () => {
    cy.visit("npm-module-nested");
    cy.get("#server-fn-test").contains('{"serverFnWithNpmModule":[2,4,6]}');
  });

  it("should have isServer true in the server function - toplevel", () => {
    cy.visit("/is-server-toplevel");
    cy.get("#server-fn-test").contains('{"serverFnWithIsServer":true}');
  });
  it("should have an id of type string in the server function meta - toplevel", () => {
    cy.visit("/server-function-meta");
    cy.get("#server-fn-test").contains('{"serverFnWithMeta":"string"}');
  });
  it("should externalize node builtin in server function - toplevel", () => {
    cy.visit("/node-builtin-toplevel");
    cy.get("#server-fn-test").contains('{"serverFnWithNodeBuiltin":"can/externalize"}');
  });
  it("should externalize npm module in server function - toplevel", () => {
    cy.visit("npm-module-toplevel");
    cy.get("#server-fn-test").contains('{"serverFnWithNpmModule":[2,4,6]}');
  });
  it("should throw a 404 if function is not found", () => {
    cy.request({
      url: "/_server/?name='not-found-function'",
      failOnStatusCode: false
    })
      .its("status")
      .should("eq", 404);
  });
});
