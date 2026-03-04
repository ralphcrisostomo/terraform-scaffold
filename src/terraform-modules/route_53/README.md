# route_53

## Usage

```hcl
module "route_53" {
  source = "../../modules/route_53"
  # ...
}
```

## Inputs

- `zone_name`: Route 53 hosted zone name (for example example.com).
- `record_name`: DNS record name to create.
- `target_domain_name`: Target domain name for the alias record.
- `target_hosted_zone_id`: Hosted zone ID for the alias target.

## Outputs

- None
