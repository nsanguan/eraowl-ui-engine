import Ajv, { type ValidateFunction } from "ajv";

const themeSchema = {
  type: "object",
  required: ["name", "displayName", "baseStyle"],
  properties: {
    name: { type: "string", pattern: "^[a-z0-9-]+$" },
    displayName: { type: "string" },
    baseStyle: { type: "string" },
    overrides: { type: "object" },
    componentOverrides: {
      type: "object",
      additionalProperties: { type: "object" },
    },
  },
  additionalProperties: false,
} as const;

const ajv = new Ajv({ allErrors: true });
export const validateThemeStyle: ValidateFunction = ajv.compile(themeSchema);
