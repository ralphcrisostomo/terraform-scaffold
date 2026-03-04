# dynamodb_table

## Usage

```hcl
module "dynamodb_table" {
  source = "../../modules/dynamodb_table"
  # ...
}
```

## Inputs

- `name`: (no description)
- `hash_key`: (no description)
- `range_key`: (no description)
- `attributes`: (no description)
- `global_secondary_indexes`: (no description)

## Outputs

- `table_name`: Name of the DynamoDB table
- `table_arn`: ARN of the DynamoDB table
- `index_arns`: ARNs of global secondary indexes
