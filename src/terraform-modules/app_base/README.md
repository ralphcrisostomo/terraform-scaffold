# app_base

## Usage

```hcl
module "app_base" {
  source = "../../modules/app_base"
  # ...
}
```

## Inputs

- `project_name`: Project identifier used in names and tags.
- `environment`: Environment name (for example staging or production).

## Outputs

- `namespace`: Normalized namespace for resources created by this module.
