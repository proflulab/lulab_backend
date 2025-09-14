#!/bin/bash

# LULAB 后端测试运行脚本
# 提供全面的测试执行和报告功能

set -e

echo "🚀 LULAB Backend Testing Suite"
echo "================================"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 帮助信息
show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo "Options:"
    echo "  -u, --unit        Run unit tests only"
    echo "  -i, --integration Run integration tests only"
    echo "  -e, --e2e         Run end-to-end tests only"
    echo "  -s, --system      Run system tests only"
    echo "  -w, --watch       Run in watch mode"
    echo "  -c, --coverage    Generate coverage report"
    echo "  -h, --help        Show this help"
}

# 检查环境
setup_environment() {
    echo -e "${BLUE}🔍 Checking environment...${NC}"
    
    # 检查 .env.test 文件
    if [ ! -f .env.test ]; then
        echo -e "${YELLOW}⚠️  .env.test not found, creating from .env.test.example${NC}"
        cp .env.test.example .env.test
    fi

    # 检查依赖
    if [ ! -d node_modules ]; then
        echo -e "${BLUE}📦 Installing dependencies...${NC}"
        pnpm install
    fi

    # 检查数据库连接
    echo -e "${BLUE}🗄️  Testing database connection...${NC}"
    npx prisma migrate status --schema=./prisma/schema.prisma || {
        echo -e "${YELLOW}🔄 Setting up test database...${NC}"
        npm run db:test:reset
    }
}

# 运行测试
run_tests() {
    local test_type=$1
    local jest_args=""

    case $test_type in
        "unit")
            echo -e "${GREEN}🧪 Running unit tests...${NC}"
            jest_args="--selectProjects unit"
            ;;
        "integration")
            echo -e "${GREEN}🔗 Running integration tests...${NC}"
            jest_args="--selectProjects integration"
            ;;
        "e2e")
            echo -e "${GREEN}🌐 Running end-to-end tests...${NC}"
            jest_args="--selectProjects e2e"
            ;;
        "system")
            echo -e "${GREEN}🏗️  Running system tests...${NC}"
            jest_args="--selectProjects system"
            ;;
        "all")
            echo -e "${GREEN}🎯 Running all tests...${NC}"
            jest_args=""
            ;;
    esac

    if [ "$COVERAGE" = true ]; then
        jest_args="$jest_args --coverage"
    fi

    if [ "$WATCH" = true ]; then
        jest_args="$jest_args --watch"
    fi

    # 运行测试
    npx jest $jest_args --config=jest.config.ts
}

# 生成报告
generate_report() {
    if [ "$COVERAGE" = true ]; then
        echo -e "${BLUE}📊 Generating coverage report...${NC}"
        
        # 合并覆盖率报告
        npx nyc merge coverage coverage/combined
        
        # 生成HTML报告
        npx nyc report --reporter=html --report-dir=coverage/html
        
        echo -e "${GREEN}✅ Coverage report generated: coverage/html/index.html${NC}"
    fi
}

# 清理测试环境
cleanup() {
    echo -e "${BLUE}🧹 Cleaning up test environment...${NC}"
    
    # 清理测试文件
    rm -rf test-reports/
    rm -rf coverage/
    
    # 清理测试数据库
    npm run db:test:clean
    
    echo -e "${GREEN}✅ Cleanup completed${NC}"
}

# 主函数
main() {
    local test_type="all"
    local COVERAGE=false
    local WATCH=false

    # 解析参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            -u|--unit)
                test_type="unit"
                shift
                ;;
            -i|--integration)
                test_type="integration"
                shift
                ;;
            -e|--e2e)
                test_type="e2e"
                shift
                ;;
            -s|--system)
                test_type="system"
                shift
                ;;
            -w|--watch)
                WATCH=true
                shift
                ;;
            -c|--coverage)
                COVERAGE=true
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            --cleanup)
                cleanup
                exit 0
                ;;
            *)
                echo -e "${RED}❌ Unknown option: $1${NC}"
                show_help
                exit 1
                ;;
        esac
    done

    # 设置环境
    setup_environment

    # 运行测试
    run_tests $test_type

    # 生成报告
    generate_report

    echo -e "${GREEN}🎉 All tests completed!${NC}"
}

# 执行主函数
main "$@"