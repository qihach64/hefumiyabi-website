#!/bin/bash
# =============================================================================
# Kimono AI - VPS 数据库定期同步脚本
# =============================================================================
# 功能：
#   1. 从 VPS 下载数据库到本地备份目录
#   2. 同步到项目数据目录
#   3. 保留最近 7 天的备份，自动清理旧文件
#   4. 记录同步日志
#
# 使用方式：
#   手动执行: bash <项目目录>/scripts/sync_vps_data.sh
#   定时任务: 0 */6 * * * /bin/bash "<项目目录>/scripts/sync_vps_data.sh"
# =============================================================================

# 获取脚本所在目录，自动定位项目根目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# VPS 配置
VPS_HOST="139.162.121.203"
VPS_USER="root"
VPS_PASS="d6457db8bc8646fc"
VPS_DB_PATH="/opt/kimono-ai/data/kimono_ai.db"

# 本地路径（相对于项目目录）
LOCAL_BACKUP_DIR="$PROJECT_DIR/backups/vps_sync"
LOCAL_DATA_DIR="$PROJECT_DIR/data"
LOG_FILE="$PROJECT_DIR/backups/sync.log"

KEEP_DAYS=7  # 保留最近 7 天的备份

# 时间戳
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DATE_HUMAN=$(date "+%Y-%m-%d %H:%M:%S")

# 日志函数
log() {
    echo "[$DATE_HUMAN] $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo "[$DATE_HUMAN] ERROR: $1" | tee -a "$LOG_FILE" >&2
}

# 确保备份目录存在
mkdir -p "$LOCAL_BACKUP_DIR"

log "========== 开始同步 VPS 数据库 =========="
log "项目目录: $PROJECT_DIR"

# 下载数据库
BACKUP_FILE="$LOCAL_BACKUP_DIR/kimono_ai_${TIMESTAMP}.db"
log "正在从 VPS 下载数据库..."

if sshpass -p "$VPS_PASS" scp -o StrictHostKeyChecking=no \
    "${VPS_USER}@${VPS_HOST}:${VPS_DB_PATH}" "$BACKUP_FILE" 2>/dev/null; then

    FILE_SIZE=$(ls -lh "$BACKUP_FILE" | awk '{print $5}')
    log "✓ 下载成功: $BACKUP_FILE ($FILE_SIZE)"

    # 验证数据库完整性
    if sqlite3 "$BACKUP_FILE" "SELECT COUNT(*) FROM qa_pairs" >/dev/null 2>&1; then
        QA_COUNT=$(sqlite3 "$BACKUP_FILE" "SELECT COUNT(*) FROM qa_pairs")
        TENANT_COUNT=$(sqlite3 "$BACKUP_FILE" "SELECT COUNT(*) FROM tenants")
        USER_COUNT=$(sqlite3 "$BACKUP_FILE" "SELECT COUNT(*) FROM users")
        FEEDBACK_COUNT=$(sqlite3 "$BACKUP_FILE" "SELECT COUNT(*) FROM feedbacks")

        log "✓ 数据库验证通过:"
        log "  - 商家: $TENANT_COUNT"
        log "  - 用户: $USER_COUNT"
        log "  - 语料: $QA_COUNT"
        log "  - 反馈: $FEEDBACK_COUNT"

        # 同步到项目数据目录
        if cp "$BACKUP_FILE" "$LOCAL_DATA_DIR/kimono_ai.db"; then
            log "✓ 已同步到项目数据目录: $LOCAL_DATA_DIR/kimono_ai.db"
        else
            log_error "同步到项目数据目录失败"
        fi
    else
        log_error "数据库验证失败，文件可能损坏"
        rm -f "$BACKUP_FILE"
    fi
else
    log_error "从 VPS 下载数据库失败"
fi

# 清理旧备份
log "正在清理 $KEEP_DAYS 天前的旧备份..."
DELETED_COUNT=$(find "$LOCAL_BACKUP_DIR" -name "kimono_ai_*.db" -mtime +$KEEP_DAYS -delete -print | wc -l)
if [ "$DELETED_COUNT" -gt 0 ]; then
    log "✓ 已删除 $DELETED_COUNT 个旧备份文件"
else
    log "- 没有需要清理的旧备份"
fi

# 统计当前备份
BACKUP_COUNT=$(ls -1 "$LOCAL_BACKUP_DIR"/kimono_ai_*.db 2>/dev/null | wc -l)
TOTAL_SIZE=$(du -sh "$LOCAL_BACKUP_DIR" 2>/dev/null | cut -f1)
log "当前备份: $BACKUP_COUNT 个文件, 总大小: $TOTAL_SIZE"

log "========== 同步完成 =========="
echo ""
