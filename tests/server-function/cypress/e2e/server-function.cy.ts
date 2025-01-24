describe("server-function", () => {
  it("should isServer false on the client", () => {
    cy.visit("/");
    cy.get("#server-fn-test").contains('{"clientWithIsServer":false}');
  })
  it("should isServer true in the server function", () => {
    cy.visit("/is-server");
    cy.get("#server-fn-test").contains('{"serverFnWithIsServer":true}');
  })
  it("should externalize node builtin in server function", () => {
    cy.visit("/node-builtin");
    cy.get("#server-fn-test").contains('{"serverFnWithNodeBuiltin":"can/externalize"}');
  })
  it("should externalize npm module in server function", () => {
    cy.visit("npm-module");
    cy.get("#server-fn-test").contains('{"serverFnWithNpmModule":[2,4,6]}');
  })
});
