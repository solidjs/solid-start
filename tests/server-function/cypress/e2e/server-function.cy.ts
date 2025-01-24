describe("server-function", () => {
  it("should isServer false on the client and true in the server function", () => {
    cy.visit("/");
    cy.get("#server-fn-test").contains(`{"clientWithIsServer":false,"serverFnWithIsServer":true,"serverFnWithNodeBuiltin":"can/externalize"}`);
  })
});
