#!/bin/bash
# 首页性能测量脚本
# 用法: ./scripts/measure-performance.sh [port]

PORT=${1:-3001}
URL="http://localhost:$PORT"
OUTPUT_DIR="docs/performance"
TIMESTAMP=$(date +%Y-%m-%d-%H%M%S)
OUTPUT_FILE="$OUTPUT_DIR/lighthouse-$TIMESTAMP.json"

echo "=== 首页性能测量 ==="
echo "URL: $URL"
echo "时间: $(date)"
echo ""

# 检查服务器是否运行
if ! curl -s -o /dev/null -w "%{http_code}" "$URL" | grep -q "200"; then
  echo "错误: 服务器未运行在 $URL"
  echo "请先运行: pnpm build && PORT=$PORT pnpm start"
  exit 1
fi

# 确保输出目录存在
mkdir -p "$OUTPUT_DIR"

# 运行 Lighthouse
echo "运行 Lighthouse 测试..."
lighthouse "$URL" \
  --only-categories=performance \
  --output=json \
  --output-path="$OUTPUT_FILE" \
  --chrome-flags="--headless --no-sandbox" \
  --quiet

# 解析并显示结果
echo ""
echo "=== 测量结果 ==="
node -e "
const report = require('./$OUTPUT_FILE');
const perf = report.categories.performance;
const audits = report.audits;

console.log('');
console.log('Performance Score:', Math.round(perf.score * 100));
console.log('');
console.log('Core Web Vitals:');
console.log('  FCP:', audits['first-contentful-paint'].displayValue);
console.log('  LCP:', audits['largest-contentful-paint'].displayValue);
console.log('  TBT:', audits['total-blocking-time'].displayValue);
console.log('  CLS:', audits['cumulative-layout-shift'].displayValue);
console.log('');
console.log('Server:');
console.log('  Response Time:', audits['server-response-time'].displayValue);
console.log('');
console.log('Size:');
console.log('  Total:', audits['total-byte-weight'].displayValue);

const jsSize = audits['network-requests'].details?.items
  ?.filter(i => i.resourceType === 'Script')
  .reduce((sum, i) => sum + i.transferSize, 0) / 1024;
console.log('  JS:', jsSize.toFixed(1), 'KB');
"

echo ""
echo "完整报告: $OUTPUT_FILE"
echo ""
echo "提示: 使用 'lighthouse-viewer' 打开 JSON 查看详细报告"
