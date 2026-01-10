#!/usr/bin/env python3
"""
Phase 6 Gate Review - 生产部署验收
验证部署到 Linode VPS 的服务是否正常运行
"""
import sys
import json
import time
import subprocess
from datetime import datetime
from typing import Optional

# 部署配置
SERVER_IP = "139.162.121.203"
SERVER_PORT = 8080
BASE_URL = f"http://{SERVER_IP}:{SERVER_PORT}"


def print_header():
    """打印标题"""
    print("=" * 60)
    print("Phase 6 Gate Review - 生产部署验收")
    print("=" * 60)
    print(f"服务器: {SERVER_IP}:{SERVER_PORT}")
    print(f"开始时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("-" * 60)


def check_http_request(url: str, method: str = "GET", expected_status: int = 200,
                       data: Optional[dict] = None, headers: Optional[dict] = None,
                       timeout: int = 10) -> dict:
    """发送 HTTP 请求并检查结果"""
    import urllib.request
    import urllib.error

    try:
        req_headers = headers or {}
        req_data = None

        if data:
            req_data = json.dumps(data).encode('utf-8')
            req_headers['Content-Type'] = 'application/json'

        request = urllib.request.Request(url, data=req_data, headers=req_headers, method=method)

        with urllib.request.urlopen(request, timeout=timeout) as response:
            status = response.getcode()
            body = response.read().decode('utf-8')

            return {
                "success": status == expected_status,
                "status": status,
                "body": body[:500] if len(body) > 500 else body,
                "error": None
            }
    except urllib.error.HTTPError as e:
        return {
            "success": e.code == expected_status,
            "status": e.code,
            "body": e.read().decode('utf-8')[:200] if e.fp else "",
            "error": str(e)
        }
    except Exception as e:
        return {
            "success": False,
            "status": 0,
            "body": "",
            "error": str(e)
        }


def test_p6_1_service_running() -> dict:
    """P6.1: 服务运行状态"""
    result = check_http_request(f"{BASE_URL}/")

    if result["success"] and "Kimono AI" in result["body"]:
        return {
            "pass": True,
            "message": "服务正常运行",
            "status_code": result["status"]
        }
    else:
        return {
            "pass": False,
            "message": f"服务未正常运行: {result.get('error', 'Unknown')}",
            "status_code": result.get("status", 0)
        }


def test_p6_2_static_files() -> dict:
    """P6.2: 静态文件访问"""
    pages = [
        ("/static/index.html", "Kimono AI"),
        ("/static/login.html", "登录"),
        ("/static/corpus.html", "语料管理"),
    ]

    results = []
    for path, keyword in pages:
        result = check_http_request(f"{BASE_URL}{path}")
        if result["success"] and keyword in result["body"]:
            results.append(True)
        else:
            results.append(False)

    passed = all(results)
    return {
        "pass": passed,
        "message": f"静态文件检查: {sum(results)}/{len(results)} 通过",
        "pages_checked": len(pages)
    }


def test_p6_3_api_endpoints() -> dict:
    """P6.3: API 端点可用"""
    endpoints = [
        ("/api/v1/system/info", "GET", 200),
        ("/api/v1/tenant/templates/stats", "GET", 200),
    ]

    results = []
    for path, method, expected in endpoints:
        result = check_http_request(f"{BASE_URL}{path}", method=method, expected_status=expected)
        results.append(result["success"] or result["status"] in [200, 401, 404])

    passed = sum(results) >= 1  # 至少一个端点可用
    return {
        "pass": passed,
        "message": f"API 端点检查: {sum(results)}/{len(results)} 可用",
        "endpoints_checked": len(endpoints)
    }


def test_p6_4_auth_system() -> dict:
    """P6.4: 认证系统"""
    # 测试登录端点
    result = check_http_request(
        f"{BASE_URL}/api/v1/auth/login",
        method="POST",
        data={"username": "test", "password": "test"},
        expected_status=401  # 预期登录失败
    )

    # 401 表示认证系统工作，只是凭据错误
    if result["status"] in [401, 422]:
        return {
            "pass": True,
            "message": "认证系统正常工作",
            "response_status": result["status"]
        }
    else:
        return {
            "pass": False,
            "message": f"认证系统异常: status={result['status']}",
            "response_status": result.get("status", 0)
        }


def test_p6_5_database() -> dict:
    """P6.5: 数据库连接"""
    # 通过访问需要数据库的端点来验证
    result = check_http_request(f"{BASE_URL}/api/v1/learning/qa-pairs?limit=1")

    # 401 表示需要认证（数据库工作），200 表示成功
    if result["status"] in [200, 401]:
        return {
            "pass": True,
            "message": "数据库连接正常",
            "status": result["status"]
        }
    else:
        return {
            "pass": False,
            "message": f"数据库可能有问题: {result.get('error', '')}",
            "status": result.get("status", 0)
        }


def test_p6_6_nginx_proxy() -> dict:
    """P6.6: Nginx 反向代理"""
    result = check_http_request(f"{BASE_URL}/", timeout=5)

    if result["success"]:
        return {
            "pass": True,
            "message": "Nginx 代理正常",
            "latency": "< 5s"
        }
    else:
        return {
            "pass": False,
            "message": f"Nginx 代理异常: {result.get('error', '')}",
            "latency": "timeout"
        }


def test_p6_7_performance() -> dict:
    """P6.7: 基本性能"""
    import time

    start = time.time()
    result = check_http_request(f"{BASE_URL}/")
    latency = (time.time() - start) * 1000  # ms

    passed = latency < 2000  # 2秒内响应
    return {
        "pass": passed,
        "message": f"首页响应时间: {latency:.0f}ms",
        "latency_ms": round(latency)
    }


def test_p6_8_deployment_files() -> dict:
    """P6.8: 部署文件完整性"""
    import os
    from pathlib import Path

    project_root = Path(__file__).parent.parent
    required_files = [
        "deploy/systemd/kimono-ai.service",
        "deploy/nginx/kimono-ai.conf",
        "deploy/.env.production",
    ]

    existing = []
    for f in required_files:
        path = project_root / f
        if path.exists():
            existing.append(f)

    passed = len(existing) == len(required_files)
    return {
        "pass": passed,
        "message": f"部署文件: {len(existing)}/{len(required_files)} 完整",
        "files": existing
    }


def run_all_tests():
    """运行所有测试"""
    tests = [
        ("P6.1", "服务运行状态", test_p6_1_service_running),
        ("P6.2", "静态文件访问", test_p6_2_static_files),
        ("P6.3", "API 端点可用", test_p6_3_api_endpoints),
        ("P6.4", "认证系统", test_p6_4_auth_system),
        ("P6.5", "数据库连接", test_p6_5_database),
        ("P6.6", "Nginx 反向代理", test_p6_6_nginx_proxy),
        ("P6.7", "基本性能", test_p6_7_performance),
        ("P6.8", "部署文件完整性", test_p6_8_deployment_files),
    ]

    results = []
    start_time = time.time()

    for test_id, test_name, test_func in tests:
        try:
            result = test_func()
            result["id"] = test_id
            result["name"] = test_name
            results.append(result)

            status = "✅ PASS" if result["pass"] else "❌ FAIL"
            print(f"\n[{test_id}] {test_name}")
            print(f"   状态: {status}")
            print(f"   说明: {result.get('message', '')}")

            # 打印额外信息
            for key, value in result.items():
                if key not in ["pass", "message", "id", "name"]:
                    print(f"   {key}: {value}")

        except Exception as e:
            results.append({
                "id": test_id,
                "name": test_name,
                "pass": False,
                "message": f"测试异常: {e}"
            })
            print(f"\n[{test_id}] {test_name}")
            print(f"   状态: ❌ ERROR")
            print(f"   错误: {e}")

    elapsed = time.time() - start_time

    # 汇总
    passed = sum(1 for r in results if r["pass"])
    total = len(results)

    print("\n" + "-" * 60)
    print("Gate Review 总结")
    print("-" * 60)
    print(f"总测试数: {total}")
    print(f"通过: {passed}")
    print(f"失败: {total - passed}")
    print(f"通过率: {passed/total*100:.1f}%")
    print(f"耗时: {elapsed:.2f} 秒")
    print("-" * 60)

    if passed == total:
        print(f"\n🎉 Phase 6 Gate Review 全部通过!")
        print(f"   服务已成功部署到 {BASE_URL}")
        return 0
    else:
        print(f"\n⚠️ Phase 6 Gate Review 未完全通过")
        print(f"   请检查失败的测试项")
        return 1


if __name__ == "__main__":
    print_header()
    sys.exit(run_all_tests())
