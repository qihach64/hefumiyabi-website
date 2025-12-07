#!/bin/bash
# Proxy configuration for Cursor IDE and development environment
# Usage: source set-proxy.sh

export https_proxy=http://127.0.0.1:7897
export http_proxy=http://127.0.0.1:7897
export all_proxy=socks5://127.0.0.1:7897

echo "✓ Proxy settings configured:"
echo "  https_proxy=$https_proxy"
echo "  http_proxy=$http_proxy"
echo "  all_proxy=$all_proxy"
echo ""
echo "To use with Cursor:"
echo "  1. Source this file: source set-proxy.sh"
echo "  2. Launch Cursor from this terminal: cursor ."
echo "  OR add these exports to your ~/.zshrc for permanent setup"











