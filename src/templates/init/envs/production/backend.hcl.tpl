bucket         = "{{STATE_BUCKET}}"
key            = "{{PROJECT_KEBAB}}-production.tfstate"
region         = "{{AWS_REGION}}"
dynamodb_table = "{{LOCK_TABLE}}"
encrypt        = true
