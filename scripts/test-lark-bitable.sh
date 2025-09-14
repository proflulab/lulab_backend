#!/bin/bash

# 飞书多维表格集成测试脚本
# 用法: ./test-lark-bitable.sh [--watch]

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🧪 飞书多维表格集成测试${NC}"
echo ""

# 检查.env.test文件
if [ ! -f ".env.test" ]; then
    echo -e "${RED}❌ 错误: .env.test 文件不存在${NC}"
    echo "请复制 .env.test.example 为 .env.test 并配置相关参数"
    exit 1
fi

# 检查必要的环境变量
required_vars=("LARK_APP_ID" "LARK_APP_SECRET" "LARK_TEST_APP_TOKEN" "LARK_TEST_TABLE_ID")
missing_vars=()

for var in "${required_vars[@]}"; do
    if ! grep -q "^$var=" .env.test; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    echo -e "${RED}❌ 错误: 缺少必要的环境变量${NC}"
    echo -e "${YELLOW}请在 .env.test 中添加以下变量:${NC}"
    for var in "${missing_vars[@]}"; do
        echo "  - $var"
    done
    exit 1
fi

echo -e "${GREEN}✅ 配置检查完成${NC}"

# 运行测试
if [ "$1" = "--watch" ]; then
    echo -e "${YELLOW}👀 启动监视模式...${NC}"
    pnpm test:integration:watch -- bitable.service.int-spec.ts
else
    echo -e "${YELLOW}🚀 运行测试...${NC}"
    pnpm test:integration -- bitable.service.int-spec.ts
fi