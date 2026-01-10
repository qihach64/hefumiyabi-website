#!/usr/bin/env python3
"""
Gate 6 验收脚本
Phase 6: 部署与文档

验收标准:
1. Dockerfile 配置正确
2. docker-compose.yml 配置正确
3. 环境变量模板完整
4. 部署脚本可用
5. 项目文档完整
6. 所有测试通过
"""

import os
import sys
import subprocess
from pathlib import Path

# 添加项目根目录到路径
PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT / "src"))


class Gate6Verifier:
    """Gate 6 验收器"""

    def __init__(self):
        self.results = []
        self.project_root = PROJECT_ROOT

    def add_result(self, name: str, passed: bool, message: str = ""):
        """添加验收结果"""
        self.results.append({
            "name": name,
            "passed": passed,
            "message": message
        })
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status}: {name}")
        if message:
            print(f"       {message}")

    def verify_dockerfile(self) -> bool:
        """验证 Dockerfile"""
        print("\n📦 验证 Dockerfile...")

        dockerfile_path = self.project_root / "Dockerfile"

        if not dockerfile_path.exists():
            self.add_result("Dockerfile 存在", False, "Dockerfile 不存在")
            return False

        content = dockerfile_path.read_text()

        # 检查必要的指令
        checks = [
            ("FROM python", "基础镜像"),
            ("WORKDIR", "工作目录"),
            ("COPY requirements.txt", "复制依赖文件"),
            ("pip install", "安装依赖"),
            ("COPY src/", "复制源代码"),
            ("EXPOSE 8000", "暴露端口"),
            ("CMD", "启动命令"),
            ("HEALTHCHECK", "健康检查"),
        ]

        all_passed = True
        for check, desc in checks:
            if check in content:
                self.add_result(f"Dockerfile: {desc}", True)
            else:
                self.add_result(f"Dockerfile: {desc}", False, f"缺少 {check}")
                all_passed = False

        return all_passed

    def verify_docker_compose(self) -> bool:
        """验证 docker-compose.yml"""
        print("\n🐳 验证 docker-compose.yml...")

        compose_path = self.project_root / "docker-compose.yml"

        if not compose_path.exists():
            self.add_result("docker-compose.yml 存在", False, "文件不存在")
            return False

        content = compose_path.read_text()

        # 检查必要的配置
        checks = [
            ("services:", "服务定义"),
            ("build:", "构建配置"),
            ("ports:", "端口映射"),
            ("env_file:", "环境变量文件"),
            ("healthcheck:", "健康检查"),
            ("networks:", "网络配置"),
        ]

        all_passed = True
        for check, desc in checks:
            if check in content:
                self.add_result(f"docker-compose: {desc}", True)
            else:
                self.add_result(f"docker-compose: {desc}", False, f"缺少 {check}")
                all_passed = False

        return all_passed

    def verify_env_example(self) -> bool:
        """验证 .env.example"""
        print("\n⚙️ 验证 .env.example...")

        env_path = self.project_root / ".env.example"

        if not env_path.exists():
            self.add_result(".env.example 存在", False, "文件不存在")
            return False

        content = env_path.read_text()

        # 检查必要的环境变量
        required_vars = [
            "DASHSCOPE_API_KEY",
            "PINECONE_API_KEY",
            "PINECONE_INDEX",
            "DEBUG",
            "LOG_LEVEL",
            "PORT",
        ]

        all_passed = True
        for var in required_vars:
            if var in content:
                self.add_result(f"环境变量: {var}", True)
            else:
                self.add_result(f"环境变量: {var}", False, f"缺少 {var}")
                all_passed = False

        return all_passed

    def verify_deploy_script(self) -> bool:
        """验证部署脚本"""
        print("\n📜 验证 deploy.sh...")

        script_path = self.project_root / "scripts" / "deploy.sh"

        if not script_path.exists():
            self.add_result("deploy.sh 存在", False, "文件不存在")
            return False

        content = script_path.read_text()

        # 检查必要的命令
        commands = [
            ("check_env", "环境检查"),
            ("install_deps", "安装依赖"),
            ("run_tests", "运行测试"),
            ("start_local", "本地启动"),
            ("start_prod", "生产启动"),
            ("docker_build", "Docker 构建"),
            ("docker_start", "Docker 启动"),
            ("docker_stop", "Docker 停止"),
        ]

        all_passed = True
        for cmd, desc in commands:
            if cmd in content:
                self.add_result(f"部署脚本: {desc}", True)
            else:
                self.add_result(f"部署脚本: {desc}", False, f"缺少 {cmd}")
                all_passed = False

        return all_passed

    def verify_readme(self) -> bool:
        """验证 README.md"""
        print("\n📖 验证 README.md...")

        readme_path = self.project_root / "README.md"

        if not readme_path.exists():
            self.add_result("README.md 存在", False, "文件不存在")
            return False

        content = readme_path.read_text()

        # 检查必要的章节
        sections = [
            ("# Kimono AI Customer Service", "标题"),
            ("## 功能特性", "功能特性"),
            ("## 快速开始", "快速开始"),
            ("## API 文档", "API 文档"),
            ("## 项目结构", "项目结构"),
            ("## 配置说明", "配置说明"),
            ("## 技术栈", "技术栈"),
        ]

        all_passed = True
        for section, desc in sections:
            if section in content:
                self.add_result(f"README: {desc}", True)
            else:
                self.add_result(f"README: {desc}", False, f"缺少 {section}")
                all_passed = False

        return all_passed

    def verify_tests_pass(self) -> bool:
        """验证所有测试通过"""
        print("\n🧪 验证测试...")

        try:
            # 运行 pytest
            result = subprocess.run(
                [sys.executable, "-m", "pytest", "tests/", "-v", "--tb=short", "-q"],
                cwd=str(self.project_root),
                capture_output=True,
                text=True,
                timeout=120
            )

            # 解析结果
            output = result.stdout + result.stderr

            if result.returncode == 0:
                # 提取通过的测试数
                import re
                match = re.search(r"(\d+) passed", output)
                passed_count = match.group(1) if match else "?"
                self.add_result("所有测试通过", True, f"{passed_count} 个测试通过")
                return True
            else:
                # 提取失败信息
                self.add_result("所有测试通过", False, "部分测试失败")
                print(f"       输出: {output[:500]}")
                return False

        except subprocess.TimeoutExpired:
            self.add_result("所有测试通过", False, "测试超时")
            return False
        except Exception as e:
            self.add_result("所有测试通过", False, f"运行测试出错: {e}")
            return False

    def run(self) -> bool:
        """运行所有验收"""
        print("=" * 60)
        print("Gate 6 验收 - Phase 6: 部署与文档")
        print("=" * 60)

        # 执行各项验证
        checks = [
            self.verify_dockerfile,
            self.verify_docker_compose,
            self.verify_env_example,
            self.verify_deploy_script,
            self.verify_readme,
            self.verify_tests_pass,
        ]

        all_passed = True
        for check in checks:
            try:
                if not check():
                    all_passed = False
            except Exception as e:
                self.add_result(check.__name__, False, f"异常: {e}")
                all_passed = False

        # 打印总结
        print("\n" + "=" * 60)
        print("验收总结")
        print("=" * 60)

        passed = sum(1 for r in self.results if r["passed"])
        total = len(self.results)

        print(f"\n通过: {passed}/{total}")

        if all_passed:
            print("\n✅ Gate 6 验收通过!")
            print("\n🎉 恭喜! 所有 Phase 开发完成!")
            print("\n下一步:")
            print("  1. 配置生产环境的 .env 文件")
            print("  2. 运行 ./scripts/deploy.sh build 构建镜像")
            print("  3. 运行 ./scripts/deploy.sh up 启动服务")
            print("  4. 访问 http://localhost:8000/docs 查看 API 文档")
        else:
            print("\n❌ Gate 6 验收未通过")
            print("\n请修复以下问题:")
            for r in self.results:
                if not r["passed"]:
                    print(f"  - {r['name']}: {r['message']}")

        return all_passed


if __name__ == "__main__":
    verifier = Gate6Verifier()
    success = verifier.run()
    sys.exit(0 if success else 1)
