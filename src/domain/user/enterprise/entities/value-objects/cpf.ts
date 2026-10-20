export class CPF {
  /**
   * CPF value.
   */
  public readonly value: string;

  /**
   * Creates a new CPF instance.
   * @param value The value of the CPF.
   */
  constructor(value: string) {
    this.value = value;
  }

  /**
   * Creates a new CPF instance from a text value.
   *
   * @param cpf The value of the CPF.
   * @returns An instance of CPF.
   */
  static create(cpf: string): CPF {
    if (CPF.validate(cpf)) {
      return new CPF(cpf);
    } else {
      throw new Error("Invalid CPF");
    }
  }

  /**
   * Receives a CPF in string and validates
   *
   * @param cpf The CPF to be validated.
   */
  static validate(cpf: string): boolean {
    // Remove non-numeric characters
    const cleanedCPF = cpf.replace(/\D/g, "");

    // Check if the CPF has 11 digits
    if (cleanedCPF.length !== 11) {
      return false;
    }

    // Check if all digits are equal
    if (/^(\d)\1{10}$/.test(cleanedCPF)) {
      return false;
    }

    // Calculate the first check digit
    let sum = 0;
    for (let i = 1; i <= 9; i++) {
      sum += parseInt(cleanedCPF[i - 1]) * (11 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) {
      remainder = 0;
    }
    if (remainder !== parseInt(cleanedCPF[9])) {
      return false;
    }

    // Calculate the second check digit
    sum = 0;
    for (let i = 1; i <= 10; i++) {
      sum += parseInt(cleanedCPF[i - 1]) * (12 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) {
      remainder = 0;
    }
    if (remainder !== parseInt(cleanedCPF[10])) {
      return false;
    }

    return true;
  }

  /**
   * Generate a random valide brazilian cpf
   *
   * @returns A CPF instance containing a new generated valid CPF.
   */
  static generate(): CPF {
    let cpf = "";
    for (let i = 0; i < 9; i++) {
      cpf += Math.floor(Math.random() * 10).toString();
    }
    cpf += CPF.calculateDigit(cpf);
    cpf += CPF.calculateDigit(cpf);
    return new CPF(cpf);
  }

  /**
   * Calculates a CPF check digit.
   *
   * @param cpf The CPF to be used in the calculation.
   * @returns The calculated check digit.
   */
  private static calculateDigit(cpf: string): number {
    let sum = 0;
    let weight = cpf.length + 1;
    for (const digit of cpf) {
      sum += parseInt(digit) * weight--;
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) {
      remainder = 0;
    }
    return remainder;
  }
}
