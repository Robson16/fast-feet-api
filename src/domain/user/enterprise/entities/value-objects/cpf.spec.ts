import { CPF } from "./cpf";

describe("CPF", () => {
  it("should be able to create a valid CPF from text", () => {
    const cpf = CPF.create("267.859.975-26");

    expect(cpf.value).toEqual("267.859.975-26");
  });

  it("should not be able to create an invalid CPF", () => {
    expect(() => {
      CPF.create("invalid-cpf-number");
    }).toThrow(Error);
  });
});
