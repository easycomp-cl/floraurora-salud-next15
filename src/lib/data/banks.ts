/** Bancos chilenos para selector de información bancaria */
export const chileanBanks = [
  "Banco de Chile",
  "Banco Estado",
  "Banco Santander Chile",
  "Scotiabank Chile",
  "BCI",
  "Banco Itaú",
  "Banco Security",
  "Banco Falabella",
  "Banco Ripley",
  "Banco Consorcio",
  "Coopeuch",
  "Banco Penta",
].sort();

/** Tipos de cuenta bancaria en Chile */
export const accountTypes = [
  { value: "cuenta_corriente", label: "Cuenta Corriente" },
  { value: "cuenta_vista", label: "Cuenta Vista" },
  { value: "cuenta_ahorro", label: "Cuenta de Ahorro" },
  { value: "cuenta_rut", label: "Cuenta RUT" },
] as const;

export type AccountTypeValue = (typeof accountTypes)[number]["value"];
