import Ajv, { type ValidateFunction } from "ajv";

const layoutSchema = {
  type: "object",
  required: ["id", "name", "version", "components"],
  properties: {
    id: { type: "string" },
    name: { type: "string" },
    version: { type: "integer", minimum: 1 },
    components: {
      type: "array",
      items: { $ref: "#/$defs/LayoutComponent" },
    },
    metadata: { type: "object" },
  },
  additionalProperties: false,
  $defs: {
    LayoutComponent: {
      type: "object",
      required: ["id", "type"],
      properties: {
        id: { type: "string" },
        type: { type: "string" },
        styleRef: { type: "string" },
        templateOptions: { type: "object" },
        dependsOn: { type: "array", items: { type: "string" } },
        children: { type: "array", items: { $ref: "#/$defs/LayoutComponent" } },
      },
      additionalProperties: true,
    },
  },
} as const;

const ajv = new Ajv({ allErrors: true });
export const validateLayout: ValidateFunction = ajv.compile(layoutSchema);
