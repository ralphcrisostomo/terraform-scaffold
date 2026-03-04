import { defineConfig } from "terraform-scaffold";

export default defineConfig({
  functionPrefix: "{{FUNCTION_PREFIX}}",
  environments: ["staging", "production"],
  paths: {
    servicesDir: "services",
    utilsDir: "utils",
  },
});
