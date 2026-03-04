# acm_certificates

## Usage

```hcl
module "acm_certificates" {
  source = "../../modules/acm_certificates"
  # ...
}
```

## Inputs

- `region`: Region label used for naming and tags.
- `domain`: Base domain for the certificate.
- `prefixes`: List of SAN prefixes (e.g., [\
- `validation_method`: (no description)
- `tags`: (no description)

## Outputs

- `certificate_arn`: (no description)
- `domain_name`: (no description)
- `subject_alternative_names`: (no description)
- `domain_validation_options`: Contains CNAME records needed for DNS validation.
