bucket         = "{{STATE_BUCKET}}"
key            = "{{PROJECT_KEBAB}}-staging.tfstate"
region         = "{{AWS_REGION}}"
dynamodb_table = "{{LOCK_TABLE}}"
encrypt        = true
