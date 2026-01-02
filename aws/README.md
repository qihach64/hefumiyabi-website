# AWS 图片系统部署指南

本目录包含 Kimono One 平台 AWS 图片系统的部署配置。

## 架构概览

```
客户端 → Presigned URL → S3 (originals/)
                              ↓
                         Lambda 处理
                              ↓
                         S3 (processed/) → CloudFront → 用户
```

## 部署步骤

### 1. 创建 S3 Bucket

```bash
# 创建 bucket (东京区域)
aws s3 mb s3://kimono-one-images --region ap-northeast-1

# 启用版本控制 (可选，用于恢复误删)
aws s3api put-bucket-versioning \
  --bucket kimono-one-images \
  --versioning-configuration Status=Enabled

# 设置 CORS (允许前端直接上传)
aws s3api put-bucket-cors \
  --bucket kimono-one-images \
  --cors-configuration '{
    "CORSRules": [{
      "AllowedOrigins": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3000
    }]
  }'

# 设置生命周期规则 (temp 目录 24 小时后自动清理)
aws s3api put-bucket-lifecycle-configuration \
  --bucket kimono-one-images \
  --lifecycle-configuration '{
    "Rules": [{
      "ID": "CleanupTempFiles",
      "Status": "Enabled",
      "Filter": {"Prefix": "temp/"},
      "Expiration": {"Days": 1}
    }]
  }'
```

### 2. 创建 IAM 用户和策略

```bash
# 创建 IAM 策略
aws iam create-policy \
  --policy-name KimonoOneS3Policy \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject"
        ],
        "Resource": "arn:aws:s3:::kimono-one-images/*"
      }
    ]
  }'

# 创建 IAM 用户
aws iam create-user --user-name kimono-one-uploader

# 附加策略
aws iam attach-user-policy \
  --user-name kimono-one-uploader \
  --policy-arn arn:aws:iam::YOUR_ACCOUNT_ID:policy/KimonoOneS3Policy

# 创建访问密钥
aws iam create-access-key --user-name kimono-one-uploader
```

保存输出的 `AccessKeyId` 和 `SecretAccessKey`，添加到 `.env.local`:

```bash
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_REGION=ap-northeast-1
AWS_S3_BUCKET=kimono-one-images
```

### 3. 部署 Lambda 函数

```bash
cd aws/lambda/image-processor

# 安装依赖
npm install

# 打包 (注意: sharp 需要 Linux 版本)
# 方法 A: 使用 Docker
docker run --rm -v "$PWD":/var/task -w /var/task node:20 npm install

# 打包
zip -r function.zip .

# 创建 Lambda 函数
aws lambda create-function \
  --function-name kimono-one-image-processor \
  --runtime nodejs20.x \
  --handler index.handler \
  --role arn:aws:iam::YOUR_ACCOUNT_ID:role/LambdaS3Role \
  --zip-file fileb://function.zip \
  --timeout 60 \
  --memory-size 1024 \
  --region ap-northeast-1

# 添加 S3 触发器权限
aws lambda add-permission \
  --function-name kimono-one-image-processor \
  --statement-id S3Trigger \
  --action lambda:InvokeFunction \
  --principal s3.amazonaws.com \
  --source-arn arn:aws:s3:::kimono-one-images

# 配置 S3 事件通知
aws s3api put-bucket-notification-configuration \
  --bucket kimono-one-images \
  --notification-configuration '{
    "LambdaFunctionConfigurations": [{
      "LambdaFunctionArn": "arn:aws:lambda:ap-northeast-1:YOUR_ACCOUNT_ID:function:kimono-one-image-processor",
      "Events": ["s3:ObjectCreated:*"],
      "Filter": {
        "Key": {
          "FilterRules": [
            {"Name": "prefix", "Value": "originals/"}
          ]
        }
      }
    }]
  }'
```

### 4. 创建 CloudFront 分发

```bash
# 创建 Origin Access Control
aws cloudfront create-origin-access-control \
  --origin-access-control-config '{
    "Name": "KimonoOneS3OAC",
    "SigningProtocol": "sigv4",
    "SigningBehavior": "always",
    "OriginAccessControlOriginType": "s3"
  }'

# 创建分发 (保存返回的 Distribution ID)
aws cloudfront create-distribution \
  --distribution-config file://cloudfront-config.json
```

创建 `cloudfront-config.json`:

```json
{
  "CallerReference": "kimono-one-images-2026",
  "Comment": "Kimono One Images CDN",
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-kimono-one-images",
    "ViewerProtocolPolicy": "redirect-to-https",
    "CachePolicyId": "658327ea-f89d-4fab-a63d-7e88639e58f6",
    "Compress": true
  },
  "Origins": {
    "Quantity": 1,
    "Items": [{
      "Id": "S3-kimono-one-images",
      "DomainName": "kimono-one-images.s3.ap-northeast-1.amazonaws.com",
      "S3OriginConfig": {
        "OriginAccessIdentity": ""
      },
      "OriginAccessControlId": "YOUR_OAC_ID"
    }]
  },
  "Enabled": true,
  "PriceClass": "PriceClass_All"
}
```

### 5. 配置 S3 Bucket 策略 (允许 CloudFront 访问)

```bash
aws s3api put-bucket-policy \
  --bucket kimono-one-images \
  --policy '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "cloudfront.amazonaws.com"},
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::kimono-one-images/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::YOUR_ACCOUNT_ID:distribution/YOUR_DISTRIBUTION_ID"
        }
      }
    }]
  }'
```

### 6. 更新环境变量

```bash
# .env.local
CLOUDFRONT_DOMAIN=d1234567890.cloudfront.net
CLOUDFRONT_DISTRIBUTION_ID=E1234567890
```

## 目录结构

```
aws/
├── README.md                 # 本文件
├── lambda/
│   └── image-processor/      # Lambda 函数
│       ├── index.mjs         # 处理逻辑
│       └── package.json      # 依赖
└── cloudfront-config.json    # CloudFront 配置模板 (需创建)
```

## 成本估算

| 服务 | 月用量 | 月成本 |
|------|--------|--------|
| S3 存储 | 50GB | ~$1.15 |
| S3 请求 | 100K PUT + 1M GET | ~$5.00 |
| CloudFront | 100GB + 2M 请求 | ~$12.00 |
| Lambda | 10K × 5s × 1024MB | ~$1.00 |
| **总计** | | **~$19/月** |

## 故障排查

### Lambda 无法处理图片

1. 检查 CloudWatch 日志: `aws logs tail /aws/lambda/kimono-one-image-processor`
2. 确认 sharp 是 Linux 版本 (需在 Docker 中安装)
3. 检查内存是否足够 (建议 1024MB)

### 上传成功但 CDN 404

1. 确认 CloudFront OAC 配置正确
2. 检查 S3 Bucket 策略
3. 等待 CloudFront 传播 (~15 分钟)

### 预签名 URL 失败

1. 确认 IAM 凭证配置
2. 检查 CORS 设置
3. 确认 bucket 名称正确
