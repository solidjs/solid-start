describe("route-groups", () => {
  it("should resolve `/routes/nested/(ignored)route0.tsx` to `nested/route0`", () => {
    cy.visit("/nested/route0");
    cy.contains("nested route 0")
  });
  it("should resolve `/routes/nested/(level1)/(ignored)route1.tsx` to `nested/route1`", () => {
    cy.visit("/nested/route1");
    cy.contains("nested route 1")
  });
  it("should resolve `/routes/nested/(level1)/(level2)/(ignored)route2.tsx` to `nested/route2`", () => {
    cy.visit("/nested/route2");
    cy.contains("nested route 2")
  });
  it("should resolve `/routes/nested/(level1)/(level2)/route3.tsx` to `nested/route3`", () => {
    cy.visit("/nested/route3");
    cy.contains("nested route 3")
  });
});
