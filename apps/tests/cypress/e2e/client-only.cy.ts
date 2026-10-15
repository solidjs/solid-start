describe("clientOnly", () => {
  it("renders a named export when the loader resolves to the component", () => {
    cy.request("/client-only/named").then(response => {
      expect(response.body).to.contain("CLIENT_ONLY_FALLBACK");
      expect(response.body).not.to.contain("CLIENT_ONLY_NAMED_EXPORT_RENDERED");
    });

    cy.visit("/client-only/named");
    cy.get("#client-only-named").contains("CLIENT_ONLY_NAMED_EXPORT_RENDERED");
    cy.get("#client-only-fallback").should("not.exist");
  });
});
