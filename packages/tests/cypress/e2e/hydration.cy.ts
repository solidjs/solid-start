describe("hydration", () => {
    it("should have interactivity", () => {
        cy.visit("/");
        cy.get("#counter-button").trigger("click")
        cy.get("#counter-output").contains("1");
    });

    it("should have isServer false in the client", () => {
        cy.visit("/client-only");
        cy.get("#server-fn-test").contains('{"clientWithIsServer":false}');
    });
});