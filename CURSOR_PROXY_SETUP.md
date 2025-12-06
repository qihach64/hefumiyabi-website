# Cursor IDE Proxy Configuration Guide

This guide explains how to configure proxy settings for Cursor IDE to make AI model calls through your proxy server.

## Quick Setup

### Option 1: Use the Proxy Script (Recommended for Development)

1. **Source the proxy script**:
   ```bash
   source set-proxy.sh
   ```

2. **Launch Cursor from the same terminal**:
   ```bash
   cursor .
   ```

   This ensures Cursor inherits the proxy environment variables.

### Option 2: Permanent Setup (Add to Shell Profile)

Add the proxy settings to your `~/.zshrc` (or `~/.bashrc` on Linux):

```bash
# Proxy settings for Cursor IDE
export https_proxy=http://127.0.0.1:7897
export http_proxy=http://127.0.0.1:7897
export all_proxy=socks5://127.0.0.1:7897
```

Then reload your shell:
```bash
source ~/.zshrc
```

### Option 3: Configure in Cursor Settings UI

1. Open Cursor Settings:
   - Press `Cmd + ,` (macOS) or `Ctrl + ,` (Windows/Linux)
   - Or go to `File > Preferences > Settings`

2. Navigate to **Models** section

3. If using OpenAI API:
   - Enable "Override OpenAI Base URL"
   - Set the base URL to your proxy endpoint

4. For other model providers, check their respective settings sections

## Verify Proxy Settings

To verify that the proxy is working:

1. Open a terminal in Cursor (`` Ctrl + ` ``)
2. Check environment variables:
   ```bash
   echo $https_proxy
   echo $http_proxy
   echo $all_proxy
   ```

3. Test the proxy connection:
   ```bash
   curl -I https://api.openai.com --proxy http://127.0.0.1:7897
   ```

## Troubleshooting

- **Cursor not using proxy**: Make sure to launch Cursor from a terminal where you've sourced the proxy script, or add the exports to your shell profile
- **Connection errors**: Verify your proxy server is running on port 7897
- **Different proxy ports**: Update the port numbers in `set-proxy.sh` or your shell profile

## Current Proxy Configuration

- **HTTP Proxy**: `http://127.0.0.1:7897`
- **HTTPS Proxy**: `http://127.0.0.1:7897`
- **SOCKS5 Proxy**: `socks5://127.0.0.1:7897`
