/**
 * Kimono AI 运维中心 - 通用功能
 */

// ========== 安全函数 ==========

/**
 * HTML 转义函数 - 防止 XSS 攻击
 */
function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}

// ========== 工具函数 ==========

/**
 * 格式化数字（添加千位分隔符）
 */
function formatNumber(num) {
    if (num === null || num === undefined) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * 格式化时间
 */
function formatTime(seconds) {
    if (seconds < 60) {
        return `${seconds}秒`;
    } else if (seconds < 3600) {
        return `${Math.floor(seconds / 60)}分钟`;
    } else if (seconds < 86400) {
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        return `${hours}小时${mins}分钟`;
    } else {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        return `${days}天${hours}小时`;
    }
}

/**
 * 格式化相对时间
 */
function formatRelativeTime(dateString) {
    if (!dateString) return '-';

    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) {
        return '刚刚';
    } else if (diff < 3600) {
        return `${Math.floor(diff / 60)}分钟前`;
    } else if (diff < 86400) {
        return `${Math.floor(diff / 3600)}小时前`;
    } else {
        return `${Math.floor(diff / 86400)}天前`;
    }
}

/**
 * 格式化日期时间字符串为易读格式
 */
function formatDateTime(dateString) {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    } catch (e) {
        return dateString;
    }
}

/**
 * 显示 Toast 消息
 */
function showToast(message, type = 'info') {
    // 创建 toast 元素
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg text-white z-50 transform transition-all duration-300 translate-y-full opacity-0`;

    // 根据类型设置颜色
    const colors = {
        info: 'bg-blue-500',
        success: 'bg-green-500',
        warning: 'bg-yellow-500',
        error: 'bg-red-500',
    };
    toast.classList.add(colors[type] || colors.info);

    toast.textContent = message;
    document.body.appendChild(toast);

    // 动画显示
    requestAnimationFrame(() => {
        toast.classList.remove('translate-y-full', 'opacity-0');
    });

    // 3秒后隐藏
    setTimeout(() => {
        toast.classList.add('translate-y-full', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ========== 仪表盘加载 ==========

/**
 * 加载仪表盘
 */
async function loadDashboard() {
    const content = document.getElementById('page-content');

    // 显示仪表盘骨架
    content.innerHTML = getDashboardTemplate();

    try {
        // 并行加载数据
        const [overview, trends, topTenants, status] = await Promise.all([
            OpsAPI.getDashboardOverview(),
            OpsAPI.getDashboardTrends(7),
            OpsAPI.getTopActiveTenants(5),
            OpsAPI.getSystemStatus(),
        ]);

        // 更新统计卡片
        updateStatCards(overview);

        // 更新组件状态
        updateComponentStatus(status.components);

        // 更新活跃商家列表
        updateTopTenants(topTenants);

        // 渲染趋势图
        if (trends && trends.length > 0) {
            OpsCharts.renderConversationTrend('trend-chart', trends);
        }

    } catch (error) {
        console.error('加载仪表盘失败:', error);
        showToast('加载仪表盘失败: ' + error.message, 'error');
    }
}

/**
 * 获取仪表盘 HTML 模板
 */
function getDashboardTemplate() {
    return `
        <div class="mb-6 flex items-center justify-between">
            <h1 class="text-2xl font-bold text-gray-800">系统概览</h1>
            <button class="refresh-btn" onclick="loadDashboard()">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
                刷新
            </button>
        </div>

        <!-- 统计卡片 -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div class="stat-card">
                <div class="stat-value" id="stat-tenants">-</div>
                <div class="stat-label">商家总数</div>
                <div class="stat-change" id="stat-tenants-active"></div>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="stat-conversations">-</div>
                <div class="stat-label">今日对话</div>
                <div class="stat-change" id="stat-conversations-week"></div>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="stat-qa">-</div>
                <div class="stat-label">知识库 QA</div>
                <div class="stat-change" id="stat-qa-unsynced"></div>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="stat-feedbacks">-</div>
                <div class="stat-label">待处理反馈</div>
                <div class="stat-change" id="stat-feedbacks-total"></div>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="stat-uptime">-</div>
                <div class="stat-label">运行时间</div>
                <div class="stat-change text-green-500">系统稳定运行</div>
            </div>
        </div>

        <!-- 图表和列表区域 -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- 趋势图 -->
            <div class="lg:col-span-2 panel">
                <div class="panel-header">
                    <span class="panel-title">对话趋势（7天）</span>
                </div>
                <div class="panel-body">
                    <div id="trend-chart" class="chart-container"></div>
                </div>
            </div>

            <!-- 组件状态 -->
            <div class="panel">
                <div class="panel-header">
                    <span class="panel-title">组件状态</span>
                </div>
                <div class="panel-body" id="component-status-list">
                    <div class="text-center py-8 text-gray-400">加载中...</div>
                </div>
            </div>
        </div>

        <!-- 活跃商家 -->
        <div class="mt-6 panel">
            <div class="panel-header">
                <span class="panel-title">今日活跃商家 TOP 5</span>
            </div>
            <div class="panel-body" id="top-tenants-list">
                <div class="text-center py-8 text-gray-400">加载中...</div>
            </div>
        </div>
    `;
}

/**
 * 更新统计卡片
 */
function updateStatCards(overview) {
    // 商家数
    document.getElementById('stat-tenants').textContent = formatNumber(overview.total_tenants);
    document.getElementById('stat-tenants-active').innerHTML = `
        <span class="text-green-500">${overview.active_tenants} 活跃</span> /
        <span class="text-yellow-500">${overview.suspended_tenants} 暂停</span>
    `;

    // 对话数
    document.getElementById('stat-conversations').textContent = formatNumber(overview.conversations_today);
    document.getElementById('stat-conversations-week').innerHTML = `
        本周 ${formatNumber(overview.conversations_week)} 次
    `;

    // 知识库
    document.getElementById('stat-qa').textContent = formatNumber(overview.total_qa_pairs);
    const unsyncedClass = overview.unsynced_qa_pairs > 50 ? 'text-yellow-500' : 'text-gray-500';
    document.getElementById('stat-qa-unsynced').innerHTML = `
        <span class="${unsyncedClass}">${overview.unsynced_qa_pairs} 待同步</span>
    `;

    // 反馈
    document.getElementById('stat-feedbacks').textContent = formatNumber(overview.pending_feedbacks);
    document.getElementById('stat-feedbacks-total').innerHTML = `
        总计 ${formatNumber(overview.total_feedbacks)} 条
    `;

    // 运行时间
    document.getElementById('stat-uptime').textContent = formatTime(overview.uptime_seconds);
}

/**
 * 更新组件状态
 */
function updateComponentStatus(components) {
    const container = document.getElementById('component-status-list');

    if (!components || components.length === 0) {
        container.innerHTML = '<div class="text-center py-8 text-gray-400">无组件数据</div>';
        return;
    }

    const statusIcons = {
        healthy: `<svg class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
        </svg>`,
        degraded: `<svg class="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
        </svg>`,
        unhealthy: `<svg class="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
        </svg>`,
    };

    const componentNames = {
        database: '数据库',
        pinecone: 'Pinecone',
        dashscope: 'DashScope',
        scheduler: '调度器',
    };

    container.innerHTML = components.map(comp => `
        <div class="component-status">
            <div class="name">
                ${statusIcons[comp.status] || statusIcons.unhealthy}
                <span>${escapeHtml(componentNames[comp.name] || comp.name)}</span>
            </div>
            <div class="latency">
                ${escapeHtml(comp.message) || (comp.latency_ms > 0 ? `${Math.round(comp.latency_ms)}ms` : '-')}
            </div>
        </div>
    `).join('');
}

/**
 * 更新活跃商家列表
 */
function updateTopTenants(tenants) {
    const container = document.getElementById('top-tenants-list');

    if (!tenants || tenants.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                </svg>
                <p>今日暂无活跃商家</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            ${tenants.map((tenant, index) => `
                <div class="tenant-activity-item bg-gray-50 rounded-lg p-4">
                    <div class="flex items-center mb-2">
                        <span class="rank ${index < 3 ? 'top-3' : ''}">${index + 1}</span>
                        <span class="name truncate">${escapeHtml(tenant.tenant_name)}</span>
                    </div>
                    <div class="text-2xl font-bold text-gray-800">${formatNumber(tenant.conversations_count)}</div>
                    <div class="text-xs text-gray-500">次对话</div>
                </div>
            `).join('')}
        </div>
    `;
}

// ========== 商家管理页面 ==========

// 商家管理状态
const tenantsState = {
    page: 1,
    pageSize: 20,
    status: '',
    keyword: '',
    total: 0,
};

/**
 * 加载商家管理页面
 */
async function loadTenantsPage() {
    const content = document.getElementById('page-content');
    content.innerHTML = getTenantsTemplate();

    // 绑定事件
    document.getElementById('tenant-status-filter').addEventListener('change', (e) => {
        tenantsState.status = e.target.value;
        tenantsState.page = 1;
        loadTenantsList();
    });

    document.getElementById('tenant-search-btn').addEventListener('click', () => {
        tenantsState.keyword = document.getElementById('tenant-search-input').value;
        tenantsState.page = 1;
        loadTenantsList();
    });

    document.getElementById('tenant-search-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            tenantsState.keyword = e.target.value;
            tenantsState.page = 1;
            loadTenantsList();
        }
    });

    // 加载数据
    await loadTenantsList();
}

/**
 * 获取商家管理页面模板
 */
function getTenantsTemplate() {
    return `
        <div class="mb-6 flex items-center justify-between">
            <h1 class="text-2xl font-bold text-gray-800">商家管理</h1>
            <button class="refresh-btn" onclick="loadTenantsList()">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
                刷新
            </button>
        </div>

        <!-- 筛选栏 -->
        <div class="panel mb-6">
            <div class="panel-body">
                <div class="flex flex-wrap gap-4 items-center">
                    <div class="flex items-center gap-2">
                        <label class="text-sm text-gray-600">状态:</label>
                        <select id="tenant-status-filter" class="px-3 py-2 border rounded-lg text-sm">
                            <option value="">全部</option>
                            <option value="active">活跃</option>
                            <option value="suspended">已暂停</option>
                        </select>
                    </div>
                    <div class="flex items-center gap-2 flex-1">
                        <input type="text" id="tenant-search-input" placeholder="搜索商家名称或ID..."
                            class="flex-1 px-3 py-2 border rounded-lg text-sm max-w-xs">
                        <button id="tenant-search-btn" class="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600">
                            搜索
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- 商家列表 -->
        <div class="panel">
            <div class="panel-body p-0">
                <div id="tenants-table-container">
                    <div class="text-center py-8 text-gray-400">加载中...</div>
                </div>
            </div>
        </div>

        <!-- 分页 -->
        <div id="tenants-pagination" class="mt-4 flex justify-center"></div>

        <!-- 商家详情模态框 -->
        <div id="tenant-detail-modal" class="fixed inset-0 bg-black bg-opacity-50 hidden z-50 flex items-center justify-center">
            <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div id="tenant-detail-content"></div>
            </div>
        </div>

        <!-- 删除商家确认模态框 -->
        <div id="tenant-delete-modal" class="fixed inset-0 bg-black bg-opacity-50 hidden z-50 flex items-center justify-center">
            <div class="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
                <div class="p-6">
                    <div class="flex items-center mb-4">
                        <div class="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mr-4">
                            <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                            </svg>
                        </div>
                        <div>
                            <h3 class="text-lg font-semibold text-gray-900">删除商家</h3>
                            <p class="text-sm text-gray-500">此操作不可恢复</p>
                        </div>
                    </div>

                    <!-- 删除统计信息 -->
                    <div id="delete-stats-container" class="mb-4 p-4 bg-gray-50 rounded-lg">
                        <div class="text-center text-gray-400">加载中...</div>
                    </div>

                    <!-- 确认输入 -->
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            请输入商家名称 "<span id="confirm-tenant-name" class="text-red-600 font-bold"></span>" 确认删除:
                        </label>
                        <input type="text" id="delete-confirm-input"
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                            placeholder="输入商家名称确认删除">
                    </div>

                    <!-- 按钮 -->
                    <div class="flex justify-end gap-3">
                        <button onclick="closeDeleteTenantModal()"
                            class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                            取消
                        </button>
                        <button id="confirm-delete-btn" onclick="confirmDeleteTenant()"
                            class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled>
                            确认删除
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * 加载商家列表
 */
async function loadTenantsList() {
    const container = document.getElementById('tenants-table-container');
    container.innerHTML = '<div class="text-center py-8 text-gray-400">加载中...</div>';

    try {
        const result = await OpsAPI.getTenants({
            status: tenantsState.status,
            keyword: tenantsState.keyword,
            page: tenantsState.page,
            page_size: tenantsState.pageSize,
        });

        tenantsState.total = result.total;

        if (result.items.length === 0) {
            container.innerHTML = `
                <div class="empty-state py-12">
                    <svg class="w-16 h-16 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                    </svg>
                    <p class="mt-4 text-gray-500">暂无商家数据</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>商家名称</th>
                        <th>命名空间</th>
                        <th>状态</th>
                        <th>用户数</th>
                        <th>QA数量</th>
                        <th>今日对话</th>
                        <th>最后活跃</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    ${result.items.map(tenant => `
                        <tr>
                            <td>
                                <div class="font-medium">${escapeHtml(tenant.name)}</div>
                                <div class="text-xs text-gray-400">${escapeHtml(tenant.id)}</div>
                            </td>
                            <td><code class="text-xs bg-gray-100 px-1 rounded">${escapeHtml(tenant.namespace)}</code></td>
                            <td>
                                <span class="status-badge ${tenant.status === 'active' ? 'status-active' : 'status-suspended'}">
                                    ${tenant.status === 'active' ? '活跃' : '已暂停'}
                                </span>
                            </td>
                            <td>${formatNumber(tenant.user_count)}</td>
                            <td>${formatNumber(tenant.qa_pair_count)}</td>
                            <td>${formatNumber(tenant.conversations_today)}</td>
                            <td>${formatRelativeTime(tenant.last_active_at)}</td>
                            <td>
                                <div class="flex gap-2">
                                    <button onclick="viewTenantDetail('${escapeHtml(tenant.id)}')" class="text-blue-500 hover:text-blue-700 text-sm">
                                        详情
                                    </button>
                                    ${tenant.status === 'active'
                                        ? `<button onclick="suspendTenant('${escapeHtml(tenant.id)}')" class="text-yellow-500 hover:text-yellow-700 text-sm">暂停</button>`
                                        : `<button onclick="activateTenant('${escapeHtml(tenant.id)}')" class="text-green-500 hover:text-green-700 text-sm">激活</button>`
                                    }
                                    <button onclick="showDeleteTenantModal('${escapeHtml(tenant.id)}', '${escapeHtml(tenant.name)}')" class="text-red-500 hover:text-red-700 text-sm">
                                        删除
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        // 更新分页
        updateTenantsPagination(result.total, result.page, result.page_size, result.total_pages);

    } catch (error) {
        console.error('加载商家列表失败:', error);
        container.innerHTML = `<div class="text-center py-8 text-red-500">加载失败: ${escapeHtml(error.message)}</div>`;
    }
}

/**
 * 更新商家分页
 */
function updateTenantsPagination(total, page, pageSize, totalPages) {
    const container = document.getElementById('tenants-pagination');
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    let html = '<div class="flex items-center gap-2">';

    // 上一页
    html += `<button onclick="goToTenantsPage(${page - 1})"
        class="px-3 py-1 rounded border ${page === 1 ? 'text-gray-400 cursor-not-allowed' : 'hover:bg-gray-100'}"
        ${page === 1 ? 'disabled' : ''}>上一页</button>`;

    // 页码
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= page - 2 && i <= page + 2)) {
            html += `<button onclick="goToTenantsPage(${i})"
                class="px-3 py-1 rounded ${i === page ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}">${i}</button>`;
        } else if (i === page - 3 || i === page + 3) {
            html += '<span class="px-2">...</span>';
        }
    }

    // 下一页
    html += `<button onclick="goToTenantsPage(${page + 1})"
        class="px-3 py-1 rounded border ${page === totalPages ? 'text-gray-400 cursor-not-allowed' : 'hover:bg-gray-100'}"
        ${page === totalPages ? 'disabled' : ''}>下一页</button>`;

    html += `<span class="text-sm text-gray-500 ml-4">共 ${total} 条</span>`;
    html += '</div>';

    container.innerHTML = html;
}

/**
 * 跳转到指定页
 */
function goToTenantsPage(page) {
    if (page < 1) return;
    tenantsState.page = page;
    loadTenantsList();
}

/**
 * 查看商家详情
 */
async function viewTenantDetail(tenantId) {
    const modal = document.getElementById('tenant-detail-modal');
    const content = document.getElementById('tenant-detail-content');

    content.innerHTML = '<div class="p-8 text-center text-gray-400">加载中...</div>';
    modal.classList.remove('hidden');

    try {
        const detail = await OpsAPI.getTenantDetail(tenantId);

        content.innerHTML = `
            <div class="p-6">
                <div class="flex justify-between items-start mb-6">
                    <div>
                        <h2 class="text-xl font-bold">${escapeHtml(detail.name)}</h2>
                        <p class="text-sm text-gray-500">${escapeHtml(detail.id)}</p>
                    </div>
                    <button onclick="closeTenantModal()" class="text-gray-400 hover:text-gray-600">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>

                <div class="grid grid-cols-2 gap-4 mb-6">
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <div class="text-sm text-gray-500">命名空间</div>
                        <div class="font-mono">${escapeHtml(detail.namespace)}</div>
                    </div>
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <div class="text-sm text-gray-500">状态</div>
                        <div>
                            <span class="status-badge ${detail.status === 'active' ? 'status-active' : 'status-suspended'}">
                                ${detail.status === 'active' ? '活跃' : '已暂停'}
                            </span>
                        </div>
                    </div>
                </div>

                ${detail.stats ? `
                <div class="mb-6">
                    <h3 class="font-semibold mb-3">统计数据</h3>
                    <div class="grid grid-cols-3 gap-3">
                        <div class="text-center p-3 bg-blue-50 rounded">
                            <div class="text-2xl font-bold text-blue-600">${formatNumber(detail.stats.total_users)}</div>
                            <div class="text-xs text-gray-500">用户数</div>
                        </div>
                        <div class="text-center p-3 bg-green-50 rounded">
                            <div class="text-2xl font-bold text-green-600">${formatNumber(detail.stats.total_qa_pairs)}</div>
                            <div class="text-xs text-gray-500">QA数量</div>
                        </div>
                        <div class="text-center p-3 bg-purple-50 rounded">
                            <div class="text-2xl font-bold text-purple-600">${formatNumber(detail.stats.conversations_today)}</div>
                            <div class="text-xs text-gray-500">今日对话</div>
                        </div>
                        <div class="text-center p-3 bg-yellow-50 rounded">
                            <div class="text-2xl font-bold text-yellow-600">${formatNumber(detail.stats.pending_feedbacks)}</div>
                            <div class="text-xs text-gray-500">待处理反馈</div>
                        </div>
                        <div class="text-center p-3 bg-gray-50 rounded">
                            <div class="text-2xl font-bold text-gray-600">${formatNumber(detail.stats.synced_qa_pairs)}</div>
                            <div class="text-xs text-gray-500">已同步QA</div>
                        </div>
                        <div class="text-center p-3 bg-red-50 rounded">
                            <div class="text-2xl font-bold text-red-600">${formatNumber(detail.stats.unsynced_qa_pairs)}</div>
                            <div class="text-xs text-gray-500">待同步QA</div>
                        </div>
                    </div>
                </div>
                ` : ''}

                <div class="text-sm text-gray-500">
                    <div>创建时间: ${detail.created_at || '-'}</div>
                    <div>更新时间: ${detail.updated_at || '-'}</div>
                </div>
            </div>
        `;
    } catch (error) {
        content.innerHTML = `<div class="p-8 text-center text-red-500">加载失败: ${escapeHtml(error.message)}</div>`;
    }
}

/**
 * 关闭商家详情模态框
 */
function closeTenantModal() {
    document.getElementById('tenant-detail-modal').classList.add('hidden');
}

/**
 * 暂停商家
 */
async function suspendTenant(tenantId) {
    if (!confirm('确定要暂停该商家吗？')) return;

    try {
        await OpsAPI.suspendTenant(tenantId);
        showToast('商家已暂停', 'success');
        loadTenantsList();
    } catch (error) {
        showToast('暂停失败: ' + error.message, 'error');
    }
}

/**
 * 激活商家
 */
async function activateTenant(tenantId) {
    if (!confirm('确定要激活该商家吗？')) return;

    try {
        await OpsAPI.activateTenant(tenantId);
        showToast('商家已激活', 'success');
        loadTenantsList();
    } catch (error) {
        showToast('激活失败: ' + error.message, 'error');
    }
}


// 删除商家相关状态
let deleteTargetTenantId = null;
let deleteTargetTenantName = null;

/**
 * 显示删除商家模态框
 */
async function showDeleteTenantModal(tenantId, tenantName) {
    deleteTargetTenantId = tenantId;
    deleteTargetTenantName = tenantName;

    // 显示模态框
    const modal = document.getElementById('tenant-delete-modal');
    modal.classList.remove('hidden');

    // 设置商家名称
    document.getElementById('confirm-tenant-name').textContent = tenantName;

    // 清空输入框并重置按钮状态
    const input = document.getElementById('delete-confirm-input');
    input.value = '';
    document.getElementById('confirm-delete-btn').disabled = true;

    // 监听输入框变化
    input.oninput = function() {
        const confirmBtn = document.getElementById('confirm-delete-btn');
        confirmBtn.disabled = input.value !== deleteTargetTenantName;
    };

    // 加载删除统计信息
    const statsContainer = document.getElementById('delete-stats-container');
    statsContainer.innerHTML = '<div class="text-center text-gray-400">加载中...</div>';

    try {
        const stats = await OpsAPI.getTenantDeletePreview(tenantId);
        statsContainer.innerHTML = `
            <div class="text-sm text-gray-600 mb-2">即将删除以下数据:</div>
            <div class="grid grid-cols-2 gap-2 text-sm">
                <div class="flex justify-between p-2 bg-white rounded">
                    <span class="text-gray-500">用户账号</span>
                    <span class="font-medium text-red-600">${stats.user_count} 个</span>
                </div>
                <div class="flex justify-between p-2 bg-white rounded">
                    <span class="text-gray-500">QA 语料</span>
                    <span class="font-medium text-red-600">${stats.qa_pair_count} 条</span>
                </div>
                <div class="flex justify-between p-2 bg-white rounded">
                    <span class="text-gray-500">对话记录</span>
                    <span class="font-medium text-red-600">${stats.conversation_count} 条</span>
                </div>
                <div class="flex justify-between p-2 bg-white rounded">
                    <span class="text-gray-500">反馈记录</span>
                    <span class="font-medium text-red-600">${stats.feedback_count} 条</span>
                </div>
                <div class="flex justify-between p-2 bg-white rounded col-span-2">
                    <span class="text-gray-500">向量数据 (Pinecone: ${escapeHtml(stats.namespace)})</span>
                    <span class="font-medium text-red-600">${stats.vector_count} 条</span>
                </div>
            </div>
        `;
    } catch (error) {
        statsContainer.innerHTML = `<div class="text-center text-red-500">加载统计信息失败: ${escapeHtml(error.message)}</div>`;
    }
}

/**
 * 关闭删除商家模态框
 */
function closeDeleteTenantModal() {
    const modal = document.getElementById('tenant-delete-modal');
    modal.classList.add('hidden');
    deleteTargetTenantId = null;
    deleteTargetTenantName = null;
}

/**
 * 确认删除商家
 */
async function confirmDeleteTenant() {
    if (!deleteTargetTenantId || !deleteTargetTenantName) return;

    const input = document.getElementById('delete-confirm-input');
    if (input.value !== deleteTargetTenantName) {
        showToast('商家名称不匹配', 'error');
        return;
    }

    const confirmBtn = document.getElementById('confirm-delete-btn');
    confirmBtn.disabled = true;
    confirmBtn.textContent = '删除中...';

    try {
        const result = await OpsAPI.deleteTenant(deleteTargetTenantId, deleteTargetTenantName);

        closeDeleteTenantModal();

        // 显示删除结果
        showToast(`删除成功: 用户 ${result.deleted_users} 个, 语料 ${result.deleted_qa_pairs} 条, 向量 ${result.deleted_vectors} 条`, 'success');

        // 刷新列表
        loadTenantsList();
    } catch (error) {
        showToast('删除失败: ' + error.message, 'error');
        confirmBtn.disabled = false;
        confirmBtn.textContent = '确认删除';
    }
}


// ========== 模板管理页面 ==========

// 模板管理状态
const templatesState = {
    page: 1,
    pageSize: 20,
    category: '',
    keyword: '',
    total: 0,
    editingId: null,
};

/**
 * 加载模板管理页面
 */
async function loadTemplatesPage() {
    const content = document.getElementById('page-content');
    content.innerHTML = getTemplatesTemplate();

    // 加载分类
    await loadTemplateCategories();

    // 绑定事件
    document.getElementById('template-category-filter').addEventListener('change', (e) => {
        templatesState.category = e.target.value;
        templatesState.page = 1;
        loadTemplatesList();
    });

    document.getElementById('template-search-btn').addEventListener('click', () => {
        templatesState.keyword = document.getElementById('template-search-input').value;
        templatesState.page = 1;
        loadTemplatesList();
    });

    document.getElementById('template-search-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            templatesState.keyword = e.target.value;
            templatesState.page = 1;
            loadTemplatesList();
        }
    });

    // 加载数据
    await loadTemplatesList();
}

/**
 * 获取模板管理页面模板
 */
function getTemplatesTemplate() {
    return `
        <div class="mb-6 flex items-center justify-between">
            <h1 class="text-2xl font-bold text-gray-800">通用模板</h1>
            <div class="flex gap-2">
                <button onclick="openTemplateEditor()" class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
                    + 新建模板
                </button>
                <button class="refresh-btn" onclick="loadTemplatesList()">
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                    </svg>
                    刷新
                </button>
            </div>
        </div>

        <!-- 筛选栏 -->
        <div class="panel mb-6">
            <div class="panel-body">
                <div class="flex flex-wrap gap-4 items-center">
                    <div class="flex items-center gap-2">
                        <label class="text-sm text-gray-600">分类:</label>
                        <select id="template-category-filter" class="px-3 py-2 border rounded-lg text-sm">
                            <option value="">全部</option>
                        </select>
                    </div>
                    <div class="flex items-center gap-2 flex-1">
                        <input type="text" id="template-search-input" placeholder="搜索问题或答案..."
                            class="flex-1 px-3 py-2 border rounded-lg text-sm max-w-xs">
                        <button id="template-search-btn" class="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600">
                            搜索
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- 模板列表 -->
        <div class="panel">
            <div class="panel-body p-0">
                <div id="templates-table-container">
                    <div class="text-center py-8 text-gray-400">加载中...</div>
                </div>
            </div>
        </div>

        <!-- 分页 -->
        <div id="templates-pagination" class="mt-4 flex justify-center"></div>

        <!-- 模板编辑器模态框 -->
        <div id="template-editor-modal" class="fixed inset-0 bg-black bg-opacity-50 hidden z-50 flex items-center justify-center">
            <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div id="template-editor-content"></div>
            </div>
        </div>

        <!-- 分发模态框 -->
        <div id="distribute-modal" class="fixed inset-0 bg-black bg-opacity-50 hidden z-50 flex items-center justify-center">
            <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                <div id="distribute-content"></div>
            </div>
        </div>
    `;
}

/**
 * 加载模板分类
 */
async function loadTemplateCategories() {
    try {
        const categories = await OpsAPI.get('/templates/categories');
        const select = document.getElementById('template-category-filter');
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('加载分类失败:', error);
    }
}

/**
 * 加载模板列表
 */
async function loadTemplatesList() {
    const container = document.getElementById('templates-table-container');
    container.innerHTML = '<div class="text-center py-8 text-gray-400">加载中...</div>';

    try {
        const result = await OpsAPI.getTemplates({
            category: templatesState.category,
            keyword: templatesState.keyword,
            page: templatesState.page,
            page_size: templatesState.pageSize,
        });

        templatesState.total = result.total;

        if (result.items.length === 0) {
            container.innerHTML = `
                <div class="empty-state py-12">
                    <svg class="w-16 h-16 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                    <p class="mt-4 text-gray-500">暂无模板数据</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>问题</th>
                        <th>分类</th>
                        <th>优先级</th>
                        <th>同步状态</th>
                        <th>更新时间</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    ${result.items.map(tpl => `
                        <tr>
                            <td>
                                <div class="max-w-md">
                                    <div class="font-medium truncate">${escapeHtml(tpl.question)}</div>
                                    <div class="text-xs text-gray-400 truncate">${escapeHtml(tpl.answer.substring(0, 100))}...</div>
                                </div>
                            </td>
                            <td><span class="text-xs bg-gray-100 px-2 py-1 rounded">${escapeHtml(tpl.category || '未分类')}</span></td>
                            <td>${tpl.priority}</td>
                            <td>
                                <span class="status-badge ${tpl.is_synced ? 'status-active' : 'status-pending'}">
                                    ${tpl.is_synced ? '已同步' : '待同步'}
                                </span>
                            </td>
                            <td>${formatRelativeTime(tpl.updated_at)}</td>
                            <td>
                                <div class="flex gap-2">
                                    <button onclick="openTemplateEditor(${tpl.id})" class="text-blue-500 hover:text-blue-700 text-sm">编辑</button>
                                    <button onclick="openDistributeModal(${tpl.id})" class="text-green-500 hover:text-green-700 text-sm">分发</button>
                                    <button onclick="deleteTemplate(${tpl.id})" class="text-red-500 hover:text-red-700 text-sm">删除</button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        // 更新分页
        updateTemplatesPagination(result.total, result.page, result.page_size);

    } catch (error) {
        console.error('加载模板列表失败:', error);
        container.innerHTML = `<div class="text-center py-8 text-red-500">加载失败: ${escapeHtml(error.message)}</div>`;
    }
}

/**
 * 更新模板分页
 */
function updateTemplatesPagination(total, page, pageSize) {
    const totalPages = Math.ceil(total / pageSize);
    const container = document.getElementById('templates-pagination');

    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    let html = '<div class="flex items-center gap-2">';
    html += `<button onclick="goToTemplatesPage(${page - 1})"
        class="px-3 py-1 rounded border ${page === 1 ? 'text-gray-400 cursor-not-allowed' : 'hover:bg-gray-100'}"
        ${page === 1 ? 'disabled' : ''}>上一页</button>`;

    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= page - 2 && i <= page + 2)) {
            html += `<button onclick="goToTemplatesPage(${i})"
                class="px-3 py-1 rounded ${i === page ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}">${i}</button>`;
        } else if (i === page - 3 || i === page + 3) {
            html += '<span class="px-2">...</span>';
        }
    }

    html += `<button onclick="goToTemplatesPage(${page + 1})"
        class="px-3 py-1 rounded border ${page === totalPages ? 'text-gray-400 cursor-not-allowed' : 'hover:bg-gray-100'}"
        ${page === totalPages ? 'disabled' : ''}>下一页</button>`;
    html += `<span class="text-sm text-gray-500 ml-4">共 ${total} 条</span>`;
    html += '</div>';

    container.innerHTML = html;
}

/**
 * 跳转到指定模板页
 */
function goToTemplatesPage(page) {
    if (page < 1) return;
    templatesState.page = page;
    loadTemplatesList();
}

/**
 * 打开模板编辑器
 */
async function openTemplateEditor(templateId = null) {
    const modal = document.getElementById('template-editor-modal');
    const content = document.getElementById('template-editor-content');
    templatesState.editingId = templateId;

    let template = { question: '', answer: '', category: '', keywords: [], priority: 0 };

    if (templateId) {
        content.innerHTML = '<div class="p-8 text-center text-gray-400">加载中...</div>';
        modal.classList.remove('hidden');

        try {
            template = await OpsAPI.get(`/templates/${templateId}`);
        } catch (error) {
            content.innerHTML = `<div class="p-8 text-center text-red-500">加载失败: ${escapeHtml(error.message)}</div>`;
            return;
        }
    }

    content.innerHTML = `
        <div class="p-6">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-xl font-bold">${templateId ? '编辑模板' : '新建模板'}</h2>
                <button onclick="closeTemplateEditor()" class="text-gray-400 hover:text-gray-600">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            </div>

            <form id="template-form" onsubmit="saveTemplate(event)">
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-1">问题 *</label>
                    <input type="text" id="tpl-question" value="${escapeHtml(template.question)}" required
                        class="w-full px-3 py-2 border rounded-lg" placeholder="输入问题...">
                </div>

                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-1">答案 *</label>
                    <textarea id="tpl-answer" required rows="5"
                        class="w-full px-3 py-2 border rounded-lg" placeholder="输入答案...">${escapeHtml(template.answer)}</textarea>
                </div>

                <div class="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">分类</label>
                        <input type="text" id="tpl-category" value="${escapeHtml(template.category || '')}"
                            class="w-full px-3 py-2 border rounded-lg" placeholder="如: 预约、价格、服务">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">优先级</label>
                        <input type="number" id="tpl-priority" value="${template.priority}" min="0" max="100"
                            class="w-full px-3 py-2 border rounded-lg">
                    </div>
                </div>

                <div class="mb-6">
                    <label class="block text-sm font-medium text-gray-700 mb-1">关键词 (逗号分隔)</label>
                    <input type="text" id="tpl-keywords" value="${escapeHtml((template.keywords || []).join(', '))}"
                        class="w-full px-3 py-2 border rounded-lg" placeholder="关键词1, 关键词2">
                </div>

                <div class="flex justify-end gap-3">
                    <button type="button" onclick="closeTemplateEditor()" class="px-4 py-2 border rounded-lg hover:bg-gray-50">
                        取消
                    </button>
                    <button type="submit" class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                        保存
                    </button>
                </div>
            </form>
        </div>
    `;

    modal.classList.remove('hidden');
}

/**
 * 关闭模板编辑器
 */
function closeTemplateEditor() {
    document.getElementById('template-editor-modal').classList.add('hidden');
    templatesState.editingId = null;
}

/**
 * 保存模板
 */
async function saveTemplate(e) {
    e.preventDefault();

    const data = {
        question: document.getElementById('tpl-question').value.trim(),
        answer: document.getElementById('tpl-answer').value.trim(),
        category: document.getElementById('tpl-category').value.trim() || null,
        priority: parseInt(document.getElementById('tpl-priority').value) || 0,
        keywords: document.getElementById('tpl-keywords').value.split(',').map(k => k.trim()).filter(k => k),
    };

    try {
        if (templatesState.editingId) {
            await OpsAPI.updateTemplate(templatesState.editingId, data);
            showToast('模板已更新', 'success');
        } else {
            await OpsAPI.createTemplate(data);
            showToast('模板已创建', 'success');
        }

        closeTemplateEditor();
        loadTemplatesList();
    } catch (error) {
        showToast('保存失败: ' + error.message, 'error');
    }
}

/**
 * 删除模板
 */
async function deleteTemplate(templateId) {
    if (!confirm('确定要删除该模板吗？')) return;

    try {
        await OpsAPI.deleteTemplate(templateId);
        showToast('模板已删除', 'success');
        loadTemplatesList();
    } catch (error) {
        showToast('删除失败: ' + error.message, 'error');
    }
}

/**
 * 打开分发模态框
 */
function openDistributeModal(templateId) {
    const modal = document.getElementById('distribute-modal');
    const content = document.getElementById('distribute-content');

    content.innerHTML = `
        <div class="p-6">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-lg font-bold">分发模板</h2>
                <button onclick="closeDistributeModal()" class="text-gray-400 hover:text-gray-600">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            </div>

            <p class="text-gray-600 mb-4">将此模板分发到所有活跃商家？</p>

            <div class="flex justify-end gap-3">
                <button onclick="closeDistributeModal()" class="px-4 py-2 border rounded-lg hover:bg-gray-50">
                    取消
                </button>
                <button onclick="distributeTemplate(${templateId})" class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
                    确认分发
                </button>
            </div>
        </div>
    `;

    modal.classList.remove('hidden');
}

/**
 * 关闭分发模态框
 */
function closeDistributeModal() {
    document.getElementById('distribute-modal').classList.add('hidden');
}

/**
 * 执行模板分发
 */
async function distributeTemplate(templateId) {
    try {
        const result = await OpsAPI.distributeTemplates([templateId]);
        closeDistributeModal();

        if (result.success_count > 0) {
            showToast(`成功分发到 ${result.tenant_ids.length} 个商家`, 'success');
        } else {
            showToast('分发失败: ' + (result.errors[0] || '未知错误'), 'error');
        }
    } catch (error) {
        showToast('分发失败: ' + error.message, 'error');
    }
}


// ========== 知识库管理页面 ==========

// 知识库管理状态
const knowledgeState = {
    page: 1,
    pageSize: 20,
    tenantId: '',
    category: '',
    source: '',
    isSynced: '',
    keyword: '',
    total: 0,
    editingId: null,
    selectedIds: new Set(),
    tenants: [],
    categories: [],
    sources: [],
};

/**
 * 加载知识库管理页面
 */
async function loadKnowledgePage() {
    const content = document.getElementById('page-content');
    content.innerHTML = getKnowledgeTemplate();

    // 加载筛选器数据
    await loadKnowledgeFilters();

    // 绑定事件
    bindKnowledgeEvents();

    // 加载数据
    await Promise.all([
        loadKnowledgeOverviewStats(),
        loadQAPairsList(),
    ]);
}

/**
 * 获取知识库管理页面模板
 */
function getKnowledgeTemplate() {
    return `
        <div class="mb-6 flex items-center justify-between">
            <h1 class="text-2xl font-bold text-gray-800">知识库管理</h1>
            <div class="flex gap-2">
                <button onclick="openImportModal()" class="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600">
                    <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                    </svg>
                    导入
                </button>
                <button onclick="exportKnowledge()" class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
                    <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                    </svg>
                    导出
                </button>
                <button onclick="openQAEditor()" class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                    + 新建 QA
                </button>
                <button class="refresh-btn" onclick="loadQAPairsList()">
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                    </svg>
                    刷新
                </button>
            </div>
        </div>

        <!-- 概览统计 -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div class="stat-card">
                <div class="stat-value" id="knowledge-total">-</div>
                <div class="stat-label">QA 总数</div>
            </div>
            <div class="stat-card">
                <div class="stat-value text-green-600" id="knowledge-synced">-</div>
                <div class="stat-label">已同步</div>
            </div>
            <div class="stat-card">
                <div class="stat-value text-yellow-600" id="knowledge-unsynced">-</div>
                <div class="stat-label">待同步</div>
            </div>
            <div class="stat-card cursor-pointer hover:bg-blue-50" onclick="triggerSync()">
                <div class="stat-value text-blue-600">
                    <svg class="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                    </svg>
                </div>
                <div class="stat-label">触发同步</div>
            </div>
        </div>

        <!-- 筛选栏 -->
        <div class="panel mb-6">
            <div class="panel-body">
                <div class="flex flex-wrap gap-4 items-center">
                    <div class="flex items-center gap-2">
                        <label class="text-sm text-gray-600">商家:</label>
                        <select id="knowledge-tenant-filter" class="px-3 py-2 border rounded-lg text-sm">
                            <option value="">全部</option>
                        </select>
                    </div>
                    <div class="flex items-center gap-2">
                        <label class="text-sm text-gray-600">分类:</label>
                        <select id="knowledge-category-filter" class="px-3 py-2 border rounded-lg text-sm">
                            <option value="">全部</option>
                        </select>
                    </div>
                    <div class="flex items-center gap-2">
                        <label class="text-sm text-gray-600">来源:</label>
                        <select id="knowledge-source-filter" class="px-3 py-2 border rounded-lg text-sm">
                            <option value="">全部</option>
                        </select>
                    </div>
                    <div class="flex items-center gap-2">
                        <label class="text-sm text-gray-600">同步状态:</label>
                        <select id="knowledge-sync-filter" class="px-3 py-2 border rounded-lg text-sm">
                            <option value="">全部</option>
                            <option value="true">已同步</option>
                            <option value="false">待同步</option>
                        </select>
                    </div>
                    <div class="flex items-center gap-2 flex-1">
                        <input type="text" id="knowledge-search-input" placeholder="搜索问题或答案..."
                            class="flex-1 px-3 py-2 border rounded-lg text-sm max-w-xs">
                        <button id="knowledge-search-btn" class="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600">
                            搜索
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- 批量操作栏 -->
        <div id="knowledge-bulk-bar" class="panel mb-4 hidden">
            <div class="panel-body py-3">
                <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-600">已选择 <strong id="knowledge-selected-count">0</strong> 项</span>
                    <div class="flex gap-2">
                        <button onclick="openBulkActionModal('sync')" class="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600">
                            标记待同步
                        </button>
                        <button onclick="openBulkActionModal('category')" class="px-3 py-1 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600">
                            批量分类
                        </button>
                        <button onclick="openBulkActionModal('delete')" class="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600">
                            批量删除
                        </button>
                        <button onclick="clearKnowledgeSelection()" class="px-3 py-1 text-sm border rounded hover:bg-gray-100">
                            取消选择
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- QA 列表 -->
        <div class="panel">
            <div class="panel-body p-0">
                <div id="knowledge-table-container">
                    <div class="text-center py-8 text-gray-400">加载中...</div>
                </div>
            </div>
        </div>

        <!-- 分页 -->
        <div id="knowledge-pagination" class="mt-4 flex justify-center"></div>

        <!-- QA 编辑器模态框 -->
        <div id="qa-editor-modal" class="fixed inset-0 bg-black bg-opacity-50 hidden z-50 flex items-center justify-center">
            <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div id="qa-editor-content"></div>
            </div>
        </div>

        <!-- 批量操作确认模态框 -->
        <div id="bulk-action-modal" class="fixed inset-0 bg-black bg-opacity-50 hidden z-50 flex items-center justify-center">
            <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                <div id="bulk-action-content"></div>
            </div>
        </div>

        <!-- 导入模态框 -->
        <div id="import-modal" class="fixed inset-0 bg-black bg-opacity-50 hidden z-50 flex items-center justify-center">
            <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                <div id="import-content"></div>
            </div>
        </div>
    `;
}

/**
 * 绑定知识库页面事件
 */
function bindKnowledgeEvents() {
    // 筛选器变更
    document.getElementById('knowledge-tenant-filter').addEventListener('change', (e) => {
        knowledgeState.tenantId = e.target.value;
        knowledgeState.page = 1;
        loadQAPairsList();
    });

    document.getElementById('knowledge-category-filter').addEventListener('change', (e) => {
        knowledgeState.category = e.target.value;
        knowledgeState.page = 1;
        loadQAPairsList();
    });

    document.getElementById('knowledge-source-filter').addEventListener('change', (e) => {
        knowledgeState.source = e.target.value;
        knowledgeState.page = 1;
        loadQAPairsList();
    });

    document.getElementById('knowledge-sync-filter').addEventListener('change', (e) => {
        knowledgeState.isSynced = e.target.value;
        knowledgeState.page = 1;
        loadQAPairsList();
    });

    // 搜索
    document.getElementById('knowledge-search-btn').addEventListener('click', () => {
        knowledgeState.keyword = document.getElementById('knowledge-search-input').value;
        knowledgeState.page = 1;
        loadQAPairsList();
    });

    document.getElementById('knowledge-search-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            knowledgeState.keyword = e.target.value;
            knowledgeState.page = 1;
            loadQAPairsList();
        }
    });
}

/**
 * 加载筛选器数据
 */
async function loadKnowledgeFilters() {
    try {
        const [tenants, categories, sources] = await Promise.all([
            OpsAPI.getKnowledgeTenants(),
            OpsAPI.getKnowledgeCategories(),
            OpsAPI.getKnowledgeSources(),
        ]);

        knowledgeState.tenants = tenants;
        knowledgeState.categories = categories;
        knowledgeState.sources = sources;

        // 填充商家下拉
        const tenantSelect = document.getElementById('knowledge-tenant-filter');
        tenants.forEach(t => {
            const option = document.createElement('option');
            option.value = t.id;
            option.textContent = t.name;
            tenantSelect.appendChild(option);
        });

        // 填充分类下拉
        const categorySelect = document.getElementById('knowledge-category-filter');
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            categorySelect.appendChild(option);
        });

        // 填充来源下拉
        const sourceSelect = document.getElementById('knowledge-source-filter');
        sources.forEach(src => {
            const option = document.createElement('option');
            option.value = src;
            option.textContent = src;
            sourceSelect.appendChild(option);
        });
    } catch (error) {
        console.error('加载筛选器失败:', error);
    }
}

/**
 * 加载概览统计
 */
async function loadKnowledgeOverviewStats() {
    try {
        const overview = await OpsAPI.getKnowledgeOverview();
        document.getElementById('knowledge-total').textContent = formatNumber(overview.total_qa_pairs);
        document.getElementById('knowledge-synced').textContent = formatNumber(overview.synced_count);
        document.getElementById('knowledge-unsynced').textContent = formatNumber(overview.unsynced_count);
    } catch (error) {
        console.error('加载概览失败:', error);
    }
}

/**
 * 加载 QA 列表
 */
async function loadQAPairsList() {
    const container = document.getElementById('knowledge-table-container');
    container.innerHTML = '<div class="text-center py-8 text-gray-400">加载中...</div>';

    try {
        const params = {
            page: knowledgeState.page,
            page_size: knowledgeState.pageSize,
        };

        if (knowledgeState.tenantId) params.tenant_id = knowledgeState.tenantId;
        if (knowledgeState.category) params.category = knowledgeState.category;
        if (knowledgeState.source) params.source = knowledgeState.source;
        if (knowledgeState.isSynced !== '') params.is_synced = knowledgeState.isSynced;
        if (knowledgeState.keyword) params.keyword = knowledgeState.keyword;

        const result = await OpsAPI.getQAPairs(params);
        knowledgeState.total = result.total;

        // 清空选择
        knowledgeState.selectedIds.clear();
        updateBulkBar();

        if (result.items.length === 0) {
            container.innerHTML = `
                <div class="empty-state py-12">
                    <svg class="w-16 h-16 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                    <p class="mt-4 text-gray-500">暂无 QA 数据</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th class="w-10">
                            <input type="checkbox" id="knowledge-select-all" onchange="toggleAllQA(this.checked)">
                        </th>
                        <th>问题</th>
                        <th>商家</th>
                        <th>分类</th>
                        <th>来源</th>
                        <th>同步状态</th>
                        <th>更新时间</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    ${result.items.map(qa => `
                        <tr>
                            <td>
                                <input type="checkbox" value="${qa.id}" onchange="toggleQASelection(${qa.id}, this.checked)">
                            </td>
                            <td>
                                <div class="max-w-xs">
                                    <div class="font-medium truncate">${escapeHtml(qa.question)}</div>
                                    <div class="text-xs text-gray-400 truncate">${escapeHtml(qa.answer.substring(0, 80))}...</div>
                                </div>
                            </td>
                            <td><span class="text-sm">${escapeHtml(qa.tenant_name || '-')}</span></td>
                            <td><span class="text-xs bg-gray-100 px-2 py-1 rounded">${escapeHtml(qa.category || '未分类')}</span></td>
                            <td><span class="text-xs text-gray-500">${escapeHtml(qa.source || '-')}</span></td>
                            <td>
                                <span class="status-badge ${qa.is_synced ? 'status-active' : 'status-pending'}">
                                    ${qa.is_synced ? '已同步' : '待同步'}
                                </span>
                            </td>
                            <td>${formatRelativeTime(qa.updated_at)}</td>
                            <td>
                                <div class="flex gap-2">
                                    <button onclick="openQAEditor(${qa.id})" class="text-blue-500 hover:text-blue-700 text-sm">编辑</button>
                                    <button onclick="deleteQAPair(${qa.id})" class="text-red-500 hover:text-red-700 text-sm">删除</button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        // 更新分页
        updateKnowledgePagination(result.total, result.page, result.page_size, result.total_pages);

    } catch (error) {
        console.error('加载 QA 列表失败:', error);
        container.innerHTML = `<div class="text-center py-8 text-red-500">加载失败: ${escapeHtml(error.message)}</div>`;
    }
}

/**
 * 更新分页
 */
function updateKnowledgePagination(total, page, pageSize, totalPages) {
    const container = document.getElementById('knowledge-pagination');
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    let html = '<div class="flex items-center gap-2">';

    html += `<button onclick="goToKnowledgePage(${page - 1})"
        class="px-3 py-1 rounded border ${page === 1 ? 'text-gray-400 cursor-not-allowed' : 'hover:bg-gray-100'}"
        ${page === 1 ? 'disabled' : ''}>上一页</button>`;

    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= page - 2 && i <= page + 2)) {
            html += `<button onclick="goToKnowledgePage(${i})"
                class="px-3 py-1 rounded ${i === page ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}">${i}</button>`;
        } else if (i === page - 3 || i === page + 3) {
            html += '<span class="px-2">...</span>';
        }
    }

    html += `<button onclick="goToKnowledgePage(${page + 1})"
        class="px-3 py-1 rounded border ${page === totalPages ? 'text-gray-400 cursor-not-allowed' : 'hover:bg-gray-100'}"
        ${page === totalPages ? 'disabled' : ''}>下一页</button>`;
    html += `<span class="text-sm text-gray-500 ml-4">共 ${total} 条</span>`;
    html += '</div>';

    container.innerHTML = html;
}

/**
 * 跳转到指定页
 */
function goToKnowledgePage(page) {
    if (page < 1) return;
    knowledgeState.page = page;
    loadQAPairsList();
}

/**
 * 切换单个 QA 选择
 */
function toggleQASelection(id, checked) {
    if (checked) {
        knowledgeState.selectedIds.add(id);
    } else {
        knowledgeState.selectedIds.delete(id);
    }
    updateBulkBar();
}

/**
 * 全选/取消全选
 */
function toggleAllQA(checked) {
    const checkboxes = document.querySelectorAll('#knowledge-table-container tbody input[type="checkbox"]');
    checkboxes.forEach(cb => {
        cb.checked = checked;
        const id = parseInt(cb.value);
        if (checked) {
            knowledgeState.selectedIds.add(id);
        } else {
            knowledgeState.selectedIds.delete(id);
        }
    });
    updateBulkBar();
}

/**
 * 清除选择
 */
function clearKnowledgeSelection() {
    knowledgeState.selectedIds.clear();
    const checkboxes = document.querySelectorAll('#knowledge-table-container input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = false);
    updateBulkBar();
}

/**
 * 更新批量操作栏
 */
function updateBulkBar() {
    const bar = document.getElementById('knowledge-bulk-bar');
    const count = document.getElementById('knowledge-selected-count');

    if (knowledgeState.selectedIds.size > 0) {
        bar.classList.remove('hidden');
        count.textContent = knowledgeState.selectedIds.size;
    } else {
        bar.classList.add('hidden');
    }
}

/**
 * 打开 QA 编辑器
 */
async function openQAEditor(qaId = null) {
    const modal = document.getElementById('qa-editor-modal');
    const content = document.getElementById('qa-editor-content');
    knowledgeState.editingId = qaId;

    let qa = { tenant_id: '', question: '', answer: '', category: '', keywords: [], priority: 0 };

    if (qaId) {
        content.innerHTML = '<div class="p-8 text-center text-gray-400">加载中...</div>';
        modal.classList.remove('hidden');

        try {
            qa = await OpsAPI.get(`/knowledge/qa-pairs/${qaId}`);
        } catch (error) {
            content.innerHTML = `<div class="p-8 text-center text-red-500">加载失败: ${escapeHtml(error.message)}</div>`;
            return;
        }
    }

    // 构建商家选项
    const tenantOptions = knowledgeState.tenants.map(t =>
        `<option value="${escapeHtml(t.id)}" ${t.id === qa.tenant_id ? 'selected' : ''}>${escapeHtml(t.name)}</option>`
    ).join('');

    content.innerHTML = `
        <div class="p-6">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-xl font-bold">${qaId ? '编辑 QA' : '新建 QA'}</h2>
                <button onclick="closeQAEditor()" class="text-gray-400 hover:text-gray-600">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            </div>

            <form id="qa-form" onsubmit="saveQAPair(event)">
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-1">商家 *</label>
                    <select id="qa-tenant" required class="w-full px-3 py-2 border rounded-lg">
                        <option value="">请选择商家</option>
                        ${tenantOptions}
                    </select>
                </div>

                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-1">问题 *</label>
                    <input type="text" id="qa-question" value="${escapeHtml(qa.question)}" required
                        class="w-full px-3 py-2 border rounded-lg" placeholder="输入问题...">
                </div>

                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-1">答案 *</label>
                    <textarea id="qa-answer" required rows="5"
                        class="w-full px-3 py-2 border rounded-lg" placeholder="输入答案...">${escapeHtml(qa.answer)}</textarea>
                </div>

                <div class="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">分类</label>
                        <input type="text" id="qa-category" value="${escapeHtml(qa.category || '')}"
                            class="w-full px-3 py-2 border rounded-lg" placeholder="如: 预约、价格、服务">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">优先级</label>
                        <input type="number" id="qa-priority" value="${qa.priority}" min="0" max="100"
                            class="w-full px-3 py-2 border rounded-lg">
                    </div>
                </div>

                <div class="mb-6">
                    <label class="block text-sm font-medium text-gray-700 mb-1">关键词 (逗号分隔)</label>
                    <input type="text" id="qa-keywords" value="${escapeHtml((qa.keywords || []).join(', '))}"
                        class="w-full px-3 py-2 border rounded-lg" placeholder="关键词1, 关键词2">
                </div>

                <div class="flex justify-end gap-3">
                    <button type="button" onclick="closeQAEditor()" class="px-4 py-2 border rounded-lg hover:bg-gray-50">
                        取消
                    </button>
                    <button type="submit" class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                        保存
                    </button>
                </div>
            </form>
        </div>
    `;

    modal.classList.remove('hidden');
}

/**
 * 关闭 QA 编辑器
 */
function closeQAEditor() {
    document.getElementById('qa-editor-modal').classList.add('hidden');
    knowledgeState.editingId = null;
}

/**
 * 保存 QA
 */
async function saveQAPair(e) {
    e.preventDefault();

    const data = {
        tenant_id: document.getElementById('qa-tenant').value,
        question: document.getElementById('qa-question').value.trim(),
        answer: document.getElementById('qa-answer').value.trim(),
        category: document.getElementById('qa-category').value.trim() || null,
        priority: parseInt(document.getElementById('qa-priority').value) || 0,
        keywords: document.getElementById('qa-keywords').value.split(',').map(k => k.trim()).filter(k => k),
    };

    try {
        if (knowledgeState.editingId) {
            await OpsAPI.updateQAPair(knowledgeState.editingId, data);
            showToast('QA 已更新', 'success');
        } else {
            await OpsAPI.createQAPair(data);
            showToast('QA 已创建', 'success');
        }

        closeQAEditor();
        await Promise.all([
            loadKnowledgeOverviewStats(),
            loadQAPairsList(),
        ]);
    } catch (error) {
        showToast('保存失败: ' + error.message, 'error');
    }
}

/**
 * 删除单个 QA
 */
async function deleteQAPair(qaId) {
    if (!confirm('确定要删除该 QA 吗？')) return;

    try {
        await OpsAPI.deleteQAPair(qaId);
        showToast('QA 已删除', 'success');
        await Promise.all([
            loadKnowledgeOverviewStats(),
            loadQAPairsList(),
        ]);
    } catch (error) {
        showToast('删除失败: ' + error.message, 'error');
    }
}

/**
 * 打开批量操作模态框
 */
function openBulkActionModal(action) {
    const modal = document.getElementById('bulk-action-modal');
    const content = document.getElementById('bulk-action-content');
    const count = knowledgeState.selectedIds.size;

    let title, message, confirmText, confirmClass, extraInput = '';

    switch (action) {
        case 'delete':
            title = '批量删除';
            message = `确定要删除选中的 ${count} 条 QA 吗？此操作不可恢复。`;
            confirmText = '确认删除';
            confirmClass = 'bg-red-500 hover:bg-red-600';
            break;
        case 'sync':
            title = '标记待同步';
            message = `确定要将选中的 ${count} 条 QA 标记为待同步吗？`;
            confirmText = '确认标记';
            confirmClass = 'bg-blue-500 hover:bg-blue-600';
            break;
        case 'category':
            title = '批量更新分类';
            message = `为选中的 ${count} 条 QA 设置分类：`;
            confirmText = '确认更新';
            confirmClass = 'bg-yellow-500 hover:bg-yellow-600';
            extraInput = `
                <div class="mt-4">
                    <input type="text" id="bulk-category-input" class="w-full px-3 py-2 border rounded-lg"
                        placeholder="输入新分类">
                </div>
            `;
            break;
    }

    content.innerHTML = `
        <div class="p-6">
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-lg font-bold">${title}</h2>
                <button onclick="closeBulkActionModal()" class="text-gray-400 hover:text-gray-600">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            </div>

            <p class="text-gray-600">${message}</p>
            ${extraInput}

            <div class="flex justify-end gap-3 mt-6">
                <button onclick="closeBulkActionModal()" class="px-4 py-2 border rounded-lg hover:bg-gray-50">
                    取消
                </button>
                <button onclick="executeBulkAction('${action}')" class="px-4 py-2 ${confirmClass} text-white rounded-lg">
                    ${confirmText}
                </button>
            </div>
        </div>
    `;

    modal.classList.remove('hidden');
}

/**
 * 关闭批量操作模态框
 */
function closeBulkActionModal() {
    document.getElementById('bulk-action-modal').classList.add('hidden');
}

/**
 * 执行批量操作
 */
async function executeBulkAction(action) {
    const qaIds = Array.from(knowledgeState.selectedIds);

    try {
        let result;
        switch (action) {
            case 'delete':
                result = await OpsAPI.bulkDeleteQA(qaIds);
                showToast(`成功删除 ${result.success_count} 条`, 'success');
                break;
            case 'sync':
                result = await OpsAPI.bulkSyncQA(qaIds);
                showToast(`成功标记 ${result.success_count} 条待同步`, 'success');
                break;
            case 'category':
                const category = document.getElementById('bulk-category-input').value.trim();
                if (!category) {
                    showToast('请输入分类名称', 'warning');
                    return;
                }
                result = await OpsAPI.bulkUpdateCategory(qaIds, category);
                showToast(`成功更新 ${result.success_count} 条分类`, 'success');
                break;
        }

        closeBulkActionModal();
        knowledgeState.selectedIds.clear();
        await Promise.all([
            loadKnowledgeOverviewStats(),
            loadQAPairsList(),
        ]);

    } catch (error) {
        showToast('操作失败: ' + error.message, 'error');
    }
}

/**
 * 打开导入模态框
 */
function openImportModal() {
    const modal = document.getElementById('import-modal');
    const content = document.getElementById('import-content');

    const tenantOptions = knowledgeState.tenants.map(t =>
        `<option value="${escapeHtml(t.id)}">${escapeHtml(t.name)}</option>`
    ).join('');

    content.innerHTML = `
        <div class="p-6">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-lg font-bold">导入知识库</h2>
                <button onclick="closeImportModal()" class="text-gray-400 hover:text-gray-600">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            </div>

            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-1">目标商家 *</label>
                <select id="import-tenant" required class="w-full px-3 py-2 border rounded-lg">
                    <option value="">请选择商家</option>
                    ${tenantOptions}
                </select>
            </div>

            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-1">CSV 文件 *</label>
                <input type="file" id="import-file" accept=".csv" required
                    class="w-full px-3 py-2 border rounded-lg">
            </div>

            <div class="mb-4">
                <label class="flex items-center gap-2">
                    <input type="checkbox" id="import-skip-header" checked>
                    <span class="text-sm text-gray-600">跳过首行（表头）</span>
                </label>
            </div>

            <div class="mb-6 text-sm text-gray-500">
                <p>CSV 格式要求：问题, 答案, 分类, 关键词, 优先级</p>
                <button onclick="downloadImportTemplate()" class="text-blue-500 hover:underline mt-1">
                    下载模板文件
                </button>
            </div>

            <div class="flex justify-end gap-3">
                <button onclick="closeImportModal()" class="px-4 py-2 border rounded-lg hover:bg-gray-50">
                    取消
                </button>
                <button onclick="executeImport()" class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                    开始导入
                </button>
            </div>
        </div>
    `;

    modal.classList.remove('hidden');
}

/**
 * 关闭导入模态框
 */
function closeImportModal() {
    document.getElementById('import-modal').classList.add('hidden');
}

/**
 * 执行导入
 */
async function executeImport() {
    const tenantId = document.getElementById('import-tenant').value;
    const fileInput = document.getElementById('import-file');
    const skipHeader = document.getElementById('import-skip-header').checked;

    if (!tenantId) {
        showToast('请选择目标商家', 'warning');
        return;
    }

    if (!fileInput.files || fileInput.files.length === 0) {
        showToast('请选择 CSV 文件', 'warning');
        return;
    }

    const file = fileInput.files[0];

    try {
        showToast('正在导入...', 'info');
        const result = await OpsAPI.importKnowledge(file, tenantId, skipHeader);

        closeImportModal();

        let message = `导入完成: 成功 ${result.success_count} 条`;
        if (result.skipped_count > 0) {
            message += `, 更新 ${result.skipped_count} 条`;
        }
        if (result.failed_count > 0) {
            message += `, 失败 ${result.failed_count} 条`;
        }

        showToast(message, result.failed_count > 0 ? 'warning' : 'success');

        await Promise.all([
            loadKnowledgeOverviewStats(),
            loadQAPairsList(),
        ]);

    } catch (error) {
        showToast('导入失败: ' + error.message, 'error');
    }
}

/**
 * 导出知识库
 */
async function exportKnowledge() {
    try {
        showToast('正在导出...', 'info');

        const params = {};
        if (knowledgeState.tenantId) params.tenant_id = knowledgeState.tenantId;
        if (knowledgeState.category) params.category = knowledgeState.category;
        if (knowledgeState.isSynced !== '') params.is_synced = knowledgeState.isSynced;

        const blob = await OpsAPI.exportKnowledge(params);

        // 下载文件
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `knowledge_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();

        showToast('导出成功', 'success');
    } catch (error) {
        showToast('导出失败: ' + error.message, 'error');
    }
}

/**
 * 下载导入模板
 */
async function downloadImportTemplate() {
    try {
        const blob = await OpsAPI.getImportTemplate();

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'knowledge_import_template.csv';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();

        showToast('模板下载成功', 'success');
    } catch (error) {
        showToast('下载失败: ' + error.message, 'error');
    }
}

/**
 * 触发同步
 */
async function triggerSync() {
    if (!confirm('确定要触发知识库同步吗？这将同步所有待同步的 QA 到向量数据库。')) return;

    try {
        showToast('正在触发同步...', 'info');
        const tenantId = knowledgeState.tenantId || null;
        await OpsAPI.syncKnowledge(tenantId);
        showToast('同步任务已启动', 'success');

        // 延迟刷新统计
        setTimeout(loadKnowledgeOverviewStats, 2000);
    } catch (error) {
        showToast('触发同步失败: ' + error.message, 'error');
    }
}


// ========== 日志管理 ==========

const logsState = {
    page: 1,
    pageSize: 50,
    action: '',
    targetType: '',
    userId: '',
    success: '',
    keyword: '',
    total: 0,
    actions: [],
    targetTypes: [],
    users: [],
};

/**
 * 加载日志页面
 */
async function loadLogsPage() {
    const content = document.getElementById('page-content');
    content.innerHTML = getLogsTemplate();

    await loadLogsFilters();
    await loadLogsList();
    await loadLogsStats();
}

function getLogsTemplate() {
    return `
        <div class="mb-6">
            <h1 class="text-2xl font-bold text-gray-800">系统日志</h1>
            <p class="text-gray-500 mt-1">查看和分析运维操作日志</p>
        </div>

        <!-- 统计卡片 -->
        <div class="grid grid-cols-4 gap-4 mb-6" id="logs-stats">
            <div class="bg-white rounded-lg p-4 shadow-sm">
                <div class="text-2xl font-bold text-blue-600" id="stat-total">-</div>
                <div class="text-sm text-gray-500">总日志数</div>
            </div>
            <div class="bg-white rounded-lg p-4 shadow-sm">
                <div class="text-2xl font-bold text-green-600" id="stat-success">-</div>
                <div class="text-sm text-gray-500">成功操作</div>
            </div>
            <div class="bg-white rounded-lg p-4 shadow-sm">
                <div class="text-2xl font-bold text-red-600" id="stat-failed">-</div>
                <div class="text-sm text-gray-500">失败操作</div>
            </div>
            <div class="bg-white rounded-lg p-4 shadow-sm">
                <div class="text-2xl font-bold text-purple-600" id="stat-actions">-</div>
                <div class="text-sm text-gray-500">操作类型</div>
            </div>
        </div>

        <!-- 筛选栏 -->
        <div class="bg-white rounded-lg shadow-sm p-4 mb-4">
            <div class="flex flex-wrap gap-4">
                <select id="filter-action" class="px-3 py-2 border rounded-lg text-sm" onchange="loadLogsList()">
                    <option value="">全部操作</option>
                </select>
                <select id="filter-target-type" class="px-3 py-2 border rounded-lg text-sm" onchange="loadLogsList()">
                    <option value="">全部目标类型</option>
                </select>
                <select id="filter-user" class="px-3 py-2 border rounded-lg text-sm" onchange="loadLogsList()">
                    <option value="">全部用户</option>
                </select>
                <select id="filter-success" class="px-3 py-2 border rounded-lg text-sm" onchange="loadLogsList()">
                    <option value="">全部状态</option>
                    <option value="true">成功</option>
                    <option value="false">失败</option>
                </select>
                <input type="text" id="filter-keyword" placeholder="搜索关键词..."
                    class="px-3 py-2 border rounded-lg text-sm w-48"
                    onkeypress="if(event.key==='Enter')loadLogsList()">
                <button onclick="loadLogsList()" class="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600">
                    搜索
                </button>
            </div>
        </div>

        <!-- 日志列表 -->
        <div class="bg-white rounded-lg shadow-sm">
            <div id="logs-list" class="overflow-x-auto">
                <table class="min-w-full">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">时间</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">用户</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">目标</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">详情</th>
                        </tr>
                    </thead>
                    <tbody id="logs-tbody">
                        <tr><td colspan="6" class="px-4 py-8 text-center text-gray-500">加载中...</td></tr>
                    </tbody>
                </table>
            </div>

            <!-- 分页 -->
            <div id="logs-pagination" class="px-4 py-3 border-t flex justify-between items-center"></div>
        </div>
    `;
}

async function loadLogsFilters() {
    try {
        const [actions, targetTypes, users] = await Promise.all([
            OpsAPI.getLogActions(),
            OpsAPI.getLogTargetTypes(),
            OpsAPI.getLogUsers(),
        ]);

        logsState.actions = actions;
        logsState.targetTypes = targetTypes;
        logsState.users = users;

        const actionSelect = document.getElementById('filter-action');
        actions.forEach(a => {
            actionSelect.innerHTML += `<option value="${escapeHtml(a)}">${escapeHtml(a)}</option>`;
        });

        const targetSelect = document.getElementById('filter-target-type');
        targetTypes.forEach(t => {
            targetSelect.innerHTML += `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`;
        });

        const userSelect = document.getElementById('filter-user');
        users.forEach(u => {
            userSelect.innerHTML += `<option value="${escapeHtml(u.id)}">${escapeHtml(u.name)}</option>`;
        });
    } catch (error) {
        console.error('加载筛选选项失败:', error);
    }
}

async function loadLogsList() {
    const tbody = document.getElementById('logs-tbody');

    logsState.action = document.getElementById('filter-action')?.value || '';
    logsState.targetType = document.getElementById('filter-target-type')?.value || '';
    logsState.userId = document.getElementById('filter-user')?.value || '';
    logsState.success = document.getElementById('filter-success')?.value || '';
    logsState.keyword = document.getElementById('filter-keyword')?.value || '';

    try {
        const params = {
            page: logsState.page,
            page_size: logsState.pageSize,
        };
        if (logsState.action) params.action = logsState.action;
        if (logsState.targetType) params.target_type = logsState.targetType;
        if (logsState.userId) params.user_id = logsState.userId;
        if (logsState.success !== '') params.success = logsState.success === 'true';
        if (logsState.keyword) params.keyword = logsState.keyword;

        const result = await OpsAPI.queryLogs(params);
        logsState.total = result.total;

        if (result.items.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="px-4 py-8 text-center text-gray-500">暂无日志记录</td></tr>';
        } else {
            tbody.innerHTML = result.items.map(log => `
                <tr class="border-b hover:bg-gray-50">
                    <td class="px-4 py-3 text-sm text-gray-600">${formatDateTime(log.timestamp)}</td>
                    <td class="px-4 py-3 text-sm">${escapeHtml(log.username || log.user_id || '-')}</td>
                    <td class="px-4 py-3 text-sm font-medium">${escapeHtml(log.action)}</td>
                    <td class="px-4 py-3 text-sm text-gray-600">
                        ${log.target_type ? `<span class="text-xs bg-gray-100 px-2 py-1 rounded">${escapeHtml(log.target_type)}</span>` : ''}
                        ${log.target_id ? `<span class="text-xs text-gray-400 ml-1">${escapeHtml(log.target_id)}</span>` : ''}
                    </td>
                    <td class="px-4 py-3">
                        ${log.success
                            ? '<span class="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">成功</span>'
                            : '<span class="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">失败</span>'
                        }
                    </td>
                    <td class="px-4 py-3 text-sm">
                        ${log.error_message ? `<span class="text-red-500">${escapeHtml(log.error_message)}</span>` : '-'}
                    </td>
                </tr>
            `).join('');
        }

        updateLogsPagination(result);
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="6" class="px-4 py-8 text-center text-red-500">加载失败: ${escapeHtml(error.message)}</td></tr>`;
    }
}

async function loadLogsStats() {
    try {
        const stats = await OpsAPI.getLogStats({ days: 7 });
        document.getElementById('stat-total').textContent = formatNumber(stats.total_logs);
        document.getElementById('stat-success').textContent = formatNumber(stats.success_count);
        document.getElementById('stat-failed').textContent = formatNumber(stats.failed_count);
        document.getElementById('stat-actions').textContent = Object.keys(stats.by_action).length;
    } catch (error) {
        console.error('加载日志统计失败:', error);
    }
}

function updateLogsPagination(result) {
    const pagination = document.getElementById('logs-pagination');
    const totalPages = result.total_pages;

    pagination.innerHTML = `
        <div class="text-sm text-gray-500">
            共 ${formatNumber(result.total)} 条记录，第 ${result.page}/${totalPages} 页
        </div>
        <div class="flex gap-2">
            <button onclick="goToLogsPage(1)" ${result.page <= 1 ? 'disabled' : ''}
                class="px-3 py-1 border rounded text-sm ${result.page <= 1 ? 'text-gray-300' : 'hover:bg-gray-50'}">首页</button>
            <button onclick="goToLogsPage(${result.page - 1})" ${result.page <= 1 ? 'disabled' : ''}
                class="px-3 py-1 border rounded text-sm ${result.page <= 1 ? 'text-gray-300' : 'hover:bg-gray-50'}">上一页</button>
            <button onclick="goToLogsPage(${result.page + 1})" ${result.page >= totalPages ? 'disabled' : ''}
                class="px-3 py-1 border rounded text-sm ${result.page >= totalPages ? 'text-gray-300' : 'hover:bg-gray-50'}">下一页</button>
            <button onclick="goToLogsPage(${totalPages})" ${result.page >= totalPages ? 'disabled' : ''}
                class="px-3 py-1 border rounded text-sm ${result.page >= totalPages ? 'text-gray-300' : 'hover:bg-gray-50'}">末页</button>
        </div>
    `;
}

function goToLogsPage(page) {
    if (page < 1) return;
    logsState.page = page;
    loadLogsList();
}


// ========== 告警管理 ==========

const alertsState = {
    page: 1,
    pageSize: 50,
    status: '',
    severity: '',
    alertType: '',
    total: 0,
    selectedIds: new Set(),
};

/**
 * 加载告警页面
 */
async function loadAlertsPage() {
    const content = document.getElementById('page-content');
    content.innerHTML = getAlertsTemplate();

    await loadAlertsStats();
    await loadActiveAlerts();
}

function getAlertsTemplate() {
    return `
        <div class="mb-6">
            <h1 class="text-2xl font-bold text-gray-800">告警中心</h1>
            <p class="text-gray-500 mt-1">监控和处理系统告警</p>
        </div>

        <!-- 统计卡片 -->
        <div class="grid grid-cols-4 gap-4 mb-6" id="alerts-stats">
            <div class="bg-white rounded-lg p-4 shadow-sm border-l-4 border-red-500">
                <div class="text-2xl font-bold text-red-600" id="stat-active">-</div>
                <div class="text-sm text-gray-500">活跃告警</div>
            </div>
            <div class="bg-white rounded-lg p-4 shadow-sm border-l-4 border-yellow-500">
                <div class="text-2xl font-bold text-yellow-600" id="stat-acknowledged">-</div>
                <div class="text-sm text-gray-500">已确认</div>
            </div>
            <div class="bg-white rounded-lg p-4 shadow-sm border-l-4 border-green-500">
                <div class="text-2xl font-bold text-green-600" id="stat-resolved">-</div>
                <div class="text-sm text-gray-500">今日解决</div>
            </div>
            <div class="bg-white rounded-lg p-4 shadow-sm border-l-4 border-purple-500">
                <div class="text-2xl font-bold text-purple-600" id="stat-critical">-</div>
                <div class="text-sm text-gray-500">严重告警</div>
            </div>
        </div>

        <!-- 标签页切换 -->
        <div class="bg-white rounded-lg shadow-sm mb-4">
            <div class="border-b flex">
                <button id="tab-active" onclick="switchAlertTab('active')"
                    class="px-6 py-3 text-sm font-medium border-b-2 border-blue-500 text-blue-600">
                    活跃告警
                </button>
                <button id="tab-history" onclick="switchAlertTab('history')"
                    class="px-6 py-3 text-sm font-medium text-gray-500 hover:text-gray-700">
                    历史记录
                </button>
            </div>
        </div>

        <!-- 批量操作栏 -->
        <div id="alert-bulk-bar" class="bg-blue-50 rounded-lg p-3 mb-4 hidden">
            <div class="flex items-center justify-between">
                <span class="text-sm text-blue-700">已选择 <span id="alert-selected-count">0</span> 个告警</span>
                <div class="flex gap-2">
                    <button onclick="bulkAcknowledgeAlerts()" class="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600">
                        批量确认
                    </button>
                    <button onclick="bulkResolveAlerts()" class="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600">
                        批量解决
                    </button>
                    <button onclick="clearAlertSelection()" class="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600">
                        取消选择
                    </button>
                </div>
            </div>
        </div>

        <!-- 告警列表 -->
        <div class="bg-white rounded-lg shadow-sm">
            <div id="alerts-list" class="overflow-x-auto">
                <table class="min-w-full">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-4 py-3 text-left">
                                <input type="checkbox" onchange="toggleAllAlerts(this.checked)" class="rounded">
                            </th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">级别</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">标题</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">类型</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">来源</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">时间</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                        </tr>
                    </thead>
                    <tbody id="alerts-tbody">
                        <tr><td colspan="8" class="px-4 py-8 text-center text-gray-500">加载中...</td></tr>
                    </tbody>
                </table>
            </div>

            <!-- 分页 -->
            <div id="alerts-pagination" class="px-4 py-3 border-t flex justify-between items-center"></div>
        </div>
    `;
}

async function loadAlertsStats() {
    try {
        const stats = await OpsAPI.getAlertStats({ days: 7 });
        document.getElementById('stat-active').textContent = formatNumber(stats.active_count);
        document.getElementById('stat-acknowledged').textContent = formatNumber(stats.acknowledged_count);
        document.getElementById('stat-resolved').textContent = formatNumber(stats.resolved_count);
        document.getElementById('stat-critical').textContent = formatNumber(stats.by_severity?.critical || 0);
    } catch (error) {
        console.error('加载告警统计失败:', error);
    }
}

async function loadActiveAlerts() {
    const tbody = document.getElementById('alerts-tbody');

    try {
        const alerts = await OpsAPI.getActiveAlerts();

        if (alerts.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="px-4 py-8 text-center text-gray-500">🎉 当前没有活跃告警</td></tr>';
        } else {
            tbody.innerHTML = alerts.map(alert => renderAlertRow(alert)).join('');
        }

        document.getElementById('alerts-pagination').innerHTML = '';
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="8" class="px-4 py-8 text-center text-red-500">加载失败: ${escapeHtml(error.message)}</td></tr>`;
    }
}

async function loadAlertHistory() {
    const tbody = document.getElementById('alerts-tbody');

    try {
        const params = {
            page: alertsState.page,
            page_size: alertsState.pageSize,
        };
        if (alertsState.status) params.status = alertsState.status;
        if (alertsState.severity) params.severity = alertsState.severity;

        const result = await OpsAPI.getAlertHistory(params);
        alertsState.total = result.total;

        if (result.items.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="px-4 py-8 text-center text-gray-500">暂无告警记录</td></tr>';
        } else {
            tbody.innerHTML = result.items.map(alert => renderAlertRow(alert)).join('');
        }

        updateAlertsPagination(result);
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="8" class="px-4 py-8 text-center text-red-500">加载失败: ${escapeHtml(error.message)}</td></tr>`;
    }
}

function renderAlertRow(alert) {
    const severityColors = {
        critical: 'bg-red-100 text-red-800',
        error: 'bg-orange-100 text-orange-800',
        warning: 'bg-yellow-100 text-yellow-800',
        info: 'bg-blue-100 text-blue-800',
    };
    const statusColors = {
        active: 'bg-red-100 text-red-800',
        acknowledged: 'bg-yellow-100 text-yellow-800',
        resolved: 'bg-green-100 text-green-800',
    };

    return `
        <tr class="border-b hover:bg-gray-50">
            <td class="px-4 py-3">
                <input type="checkbox" class="rounded" onchange="toggleAlertSelection(${alert.id}, this.checked)"
                    ${alertsState.selectedIds.has(alert.id) ? 'checked' : ''}>
            </td>
            <td class="px-4 py-3">
                <span class="px-2 py-1 text-xs rounded-full ${severityColors[alert.severity] || 'bg-gray-100'}">
                    ${escapeHtml(alert.severity)}
                </span>
            </td>
            <td class="px-4 py-3">
                <div class="font-medium text-sm">${escapeHtml(alert.title)}</div>
                ${alert.message ? `<div class="text-xs text-gray-500 mt-1">${escapeHtml(alert.message)}</div>` : ''}
            </td>
            <td class="px-4 py-3 text-sm">${escapeHtml(alert.alert_type)}</td>
            <td class="px-4 py-3 text-sm text-gray-500">${escapeHtml(alert.source || '-')}</td>
            <td class="px-4 py-3 text-sm text-gray-500">${formatRelativeTime(alert.created_at)}</td>
            <td class="px-4 py-3">
                <span class="px-2 py-1 text-xs rounded-full ${statusColors[alert.status] || 'bg-gray-100'}">
                    ${alert.status === 'active' ? '活跃' : alert.status === 'acknowledged' ? '已确认' : '已解决'}
                </span>
            </td>
            <td class="px-4 py-3">
                <div class="flex gap-1">
                    ${alert.status === 'active' ? `
                        <button onclick="acknowledgeAlertItem(${alert.id})"
                            class="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200">确认</button>
                    ` : ''}
                    ${alert.status !== 'resolved' ? `
                        <button onclick="resolveAlertItem(${alert.id})"
                            class="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200">解决</button>
                    ` : ''}
                </div>
            </td>
        </tr>
    `;
}

function switchAlertTab(tab) {
    document.getElementById('tab-active').className = 'px-6 py-3 text-sm font-medium ' +
        (tab === 'active' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700');
    document.getElementById('tab-history').className = 'px-6 py-3 text-sm font-medium ' +
        (tab === 'history' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700');

    alertsState.page = 1;
    alertsState.selectedIds.clear();
    updateAlertBulkBar();

    if (tab === 'active') {
        loadActiveAlerts();
    } else {
        loadAlertHistory();
    }
}

function toggleAlertSelection(id, checked) {
    if (checked) {
        alertsState.selectedIds.add(id);
    } else {
        alertsState.selectedIds.delete(id);
    }
    updateAlertBulkBar();
}

function toggleAllAlerts(checked) {
    const checkboxes = document.querySelectorAll('#alerts-tbody input[type="checkbox"]');
    checkboxes.forEach(cb => {
        cb.checked = checked;
        const id = parseInt(cb.getAttribute('onchange').match(/\d+/)[0]);
        if (checked) {
            alertsState.selectedIds.add(id);
        } else {
            alertsState.selectedIds.delete(id);
        }
    });
    updateAlertBulkBar();
}

function clearAlertSelection() {
    alertsState.selectedIds.clear();
    const checkboxes = document.querySelectorAll('#alerts-tbody input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = false);
    updateAlertBulkBar();
}

function updateAlertBulkBar() {
    const bar = document.getElementById('alert-bulk-bar');
    const count = alertsState.selectedIds.size;
    document.getElementById('alert-selected-count').textContent = count;
    bar.classList.toggle('hidden', count === 0);
}

async function acknowledgeAlertItem(id) {
    try {
        await OpsAPI.acknowledgeAlert(id);
        showToast('告警已确认', 'success');
        loadActiveAlerts();
        loadAlertsStats();
    } catch (error) {
        showToast('确认失败: ' + error.message, 'error');
    }
}

async function resolveAlertItem(id) {
    const note = prompt('请输入解决说明（可选）:');
    if (note === null) return;

    try {
        await OpsAPI.resolveAlert(id, note);
        showToast('告警已解决', 'success');
        loadActiveAlerts();
        loadAlertsStats();
    } catch (error) {
        showToast('解决失败: ' + error.message, 'error');
    }
}

async function bulkAcknowledgeAlerts() {
    const ids = Array.from(alertsState.selectedIds);
    if (ids.length === 0) return;

    try {
        await OpsAPI.bulkAcknowledgeAlerts(ids);
        showToast(`已确认 ${ids.length} 个告警`, 'success');
        clearAlertSelection();
        loadActiveAlerts();
        loadAlertsStats();
    } catch (error) {
        showToast('批量确认失败: ' + error.message, 'error');
    }
}

async function bulkResolveAlerts() {
    const ids = Array.from(alertsState.selectedIds);
    if (ids.length === 0) return;

    const note = prompt('请输入解决说明（可选）:');
    if (note === null) return;

    try {
        await OpsAPI.bulkResolveAlerts(ids, note);
        showToast(`已解决 ${ids.length} 个告警`, 'success');
        clearAlertSelection();
        loadActiveAlerts();
        loadAlertsStats();
    } catch (error) {
        showToast('批量解决失败: ' + error.message, 'error');
    }
}

function updateAlertsPagination(result) {
    const pagination = document.getElementById('alerts-pagination');
    const totalPages = result.total_pages;

    pagination.innerHTML = `
        <div class="text-sm text-gray-500">
            共 ${formatNumber(result.total)} 条记录，第 ${result.page}/${totalPages} 页
        </div>
        <div class="flex gap-2">
            <button onclick="goToAlertsPage(1)" ${result.page <= 1 ? 'disabled' : ''}
                class="px-3 py-1 border rounded text-sm ${result.page <= 1 ? 'text-gray-300' : 'hover:bg-gray-50'}">首页</button>
            <button onclick="goToAlertsPage(${result.page - 1})" ${result.page <= 1 ? 'disabled' : ''}
                class="px-3 py-1 border rounded text-sm ${result.page <= 1 ? 'text-gray-300' : 'hover:bg-gray-50'}">上一页</button>
            <button onclick="goToAlertsPage(${result.page + 1})" ${result.page >= totalPages ? 'disabled' : ''}
                class="px-3 py-1 border rounded text-sm ${result.page >= totalPages ? 'text-gray-300' : 'hover:bg-gray-50'}">下一页</button>
            <button onclick="goToAlertsPage(${totalPages})" ${result.page >= totalPages ? 'disabled' : ''}
                class="px-3 py-1 border rounded text-sm ${result.page >= totalPages ? 'text-gray-300' : 'hover:bg-gray-50'}">末页</button>
        </div>
    `;
}

function goToAlertsPage(page) {
    if (page < 1) return;
    alertsState.page = page;
    loadAlertHistory();
}


// ========== 配置管理页面 (第五阶段) ==========

/**
 * 配置页面状态
 */
const configState = {
    categories: [],
    currentCategory: null,
    configData: null,
    editMode: false,
};

/**
 * 加载配置页面
 */
async function loadConfigPage() {
    const content = document.getElementById('page-content');
    content.innerHTML = getConfigPageTemplate();

    try {
        // 加载配置分类
        const categories = await OpsAPI.getConfigCategories();
        configState.categories = categories.categories || [];

        // 渲染分类标签
        renderConfigTabs();

        // 默认加载第一个分类
        if (configState.categories.length > 0) {
            await loadConfigCategory(configState.categories[0].category);
        }
    } catch (error) {
        console.error('加载配置页面失败:', error);
        showToast('加载配置页面失败: ' + error.message, 'error');
    }
}

/**
 * 获取配置页面模板
 */
function getConfigPageTemplate() {
    return `
        <div class="mb-6 flex items-center justify-between">
            <h1 class="text-2xl font-bold text-gray-800">系统配置</h1>
            <div class="flex gap-2">
                <button onclick="loadConfigPage()" class="refresh-btn">
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                    </svg>
                    刷新
                </button>
            </div>
        </div>

        <!-- 配置分类标签 -->
        <div class="mb-6">
            <div class="border-b border-gray-200">
                <nav id="config-tabs" class="flex gap-1 -mb-px" role="tablist">
                    <div class="text-gray-400 text-sm py-2">加载中...</div>
                </nav>
            </div>
        </div>

        <!-- 配置内容区域 -->
        <div class="panel">
            <div id="config-header" class="panel-header flex justify-between items-center">
                <span class="panel-title">配置项</span>
                <div id="config-actions" class="flex gap-2"></div>
            </div>
            <div id="config-content" class="panel-body">
                <div class="text-center py-8 text-gray-400">请选择一个配置分类</div>
            </div>
        </div>

        <!-- 重置确认对话框 -->
        <div id="reset-config-modal" class="fixed inset-0 bg-black bg-opacity-50 hidden z-50 flex items-center justify-center">
            <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                <div id="reset-config-content" class="p-6"></div>
            </div>
        </div>
    `;
}

/**
 * 渲染配置分类标签
 */
function renderConfigTabs() {
    const tabsContainer = document.getElementById('config-tabs');

    if (configState.categories.length === 0) {
        tabsContainer.innerHTML = '<div class="text-gray-400 text-sm py-2">暂无配置分类</div>';
        return;
    }

    tabsContainer.innerHTML = configState.categories.map(cat => `
        <button onclick="loadConfigCategory('${escapeHtml(cat.category)}')"
            class="config-tab px-4 py-3 text-sm font-medium border-b-2 transition-colors
            ${configState.currentCategory === cat.category ?
                'border-blue-500 text-blue-600' :
                'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
            data-category="${escapeHtml(cat.category)}">
            ${escapeHtml(cat.name)}
        </button>
    `).join('');
}

/**
 * 加载指定分类的配置
 */
async function loadConfigCategory(category) {
    configState.currentCategory = category;
    configState.editMode = false;

    // 更新标签状态
    document.querySelectorAll('.config-tab').forEach(tab => {
        const isActive = tab.dataset.category === category;
        tab.classList.toggle('border-blue-500', isActive);
        tab.classList.toggle('text-blue-600', isActive);
        tab.classList.toggle('border-transparent', !isActive);
        tab.classList.toggle('text-gray-500', !isActive);
    });

    const content = document.getElementById('config-content');
    content.innerHTML = '<div class="text-center py-8 text-gray-400">加载中...</div>';

    try {
        const data = await OpsAPI.getConfig(category);
        configState.configData = data;

        // 更新标题和操作按钮
        const catInfo = configState.categories.find(c => c.category === category);
        const header = document.getElementById('config-header');
        header.querySelector('.panel-title').innerHTML = `
            ${escapeHtml(catInfo?.name || category)}
            <span class="text-sm font-normal text-gray-500 ml-2">${escapeHtml(catInfo?.description || '')}</span>
        `;

        // 渲染操作按钮
        const actions = document.getElementById('config-actions');
        actions.innerHTML = `
            <button onclick="toggleConfigEditMode()" id="edit-config-btn"
                class="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50">
                <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                </svg>
                编辑配置
            </button>
            <button onclick="openResetConfigModal()"
                class="px-3 py-1.5 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50">
                <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
                重置为默认
            </button>
        `;

        // 渲染配置项
        renderConfigItems(data.items);
    } catch (error) {
        console.error('加载配置失败:', error);
        content.innerHTML = `<div class="text-center py-8 text-red-500">加载失败: ${escapeHtml(error.message)}</div>`;
    }
}

/**
 * 渲染配置项列表
 */
function renderConfigItems(items) {
    const content = document.getElementById('config-content');

    if (!items || items.length === 0) {
        content.innerHTML = '<div class="text-center py-8 text-gray-400">暂无配置项</div>';
        return;
    }

    content.innerHTML = `
        <form id="config-form" onsubmit="saveConfig(event)">
            <div class="divide-y">
                ${items.map(item => renderConfigItem(item)).join('')}
            </div>
            <div id="config-form-actions" class="hidden mt-6 pt-4 border-t flex justify-end gap-3">
                <button type="button" onclick="cancelConfigEdit()" class="px-4 py-2 border rounded-lg hover:bg-gray-50">
                    取消
                </button>
                <button type="submit" class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                    保存配置
                </button>
            </div>
        </form>
    `;
}

/**
 * 渲染单个配置项
 */
function renderConfigItem(item) {
    const inputId = `config-${item.key}`;
    const value = item.value;
    const isSensitive = item.is_sensitive;

    // 根据值类型选择合适的输入组件
    let inputHtml = '';
    const valueType = typeof value;

    if (valueType === 'boolean') {
        inputHtml = `
            <select id="${inputId}" data-key="${escapeHtml(item.key)}" disabled
                class="config-input w-48 px-3 py-2 border rounded-lg bg-gray-50 disabled:cursor-not-allowed">
                <option value="true" ${value === true ? 'selected' : ''}>启用</option>
                <option value="false" ${value === false ? 'selected' : ''}>禁用</option>
            </select>
        `;
    } else if (valueType === 'number') {
        inputHtml = `
            <input type="number" id="${inputId}" data-key="${escapeHtml(item.key)}"
                value="${value}" disabled step="any"
                class="config-input w-48 px-3 py-2 border rounded-lg bg-gray-50 disabled:cursor-not-allowed">
        `;
    } else if (Array.isArray(value)) {
        inputHtml = `
            <input type="text" id="${inputId}" data-key="${escapeHtml(item.key)}"
                value="${escapeHtml(value.join(', '))}" disabled
                placeholder="多个值用逗号分隔"
                class="config-input w-64 px-3 py-2 border rounded-lg bg-gray-50 disabled:cursor-not-allowed">
        `;
    } else {
        inputHtml = `
            <input type="${isSensitive ? 'password' : 'text'}" id="${inputId}" data-key="${escapeHtml(item.key)}"
                value="${escapeHtml(String(value))}" disabled
                class="config-input w-64 px-3 py-2 border rounded-lg bg-gray-50 disabled:cursor-not-allowed">
        `;
    }

    return `
        <div class="py-4 flex items-center justify-between">
            <div class="flex-1">
                <div class="font-medium text-gray-800">${escapeHtml(item.key)}</div>
                <div class="text-sm text-gray-500 mt-1">${escapeHtml(item.description || '无描述')}</div>
                ${item.updated_at ? `<div class="text-xs text-gray-400 mt-1">最后更新: ${formatDateTime(item.updated_at)}</div>` : ''}
            </div>
            <div class="flex items-center gap-2">
                ${isSensitive ? '<span class="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">敏感</span>' : ''}
                ${inputHtml}
            </div>
        </div>
    `;
}

/**
 * 切换编辑模式
 */
function toggleConfigEditMode() {
    configState.editMode = !configState.editMode;

    const inputs = document.querySelectorAll('.config-input');
    const formActions = document.getElementById('config-form-actions');
    const editBtn = document.getElementById('edit-config-btn');

    if (configState.editMode) {
        inputs.forEach(input => {
            input.disabled = false;
            input.classList.remove('bg-gray-50', 'disabled:cursor-not-allowed');
            input.classList.add('bg-white', 'focus:ring-2', 'focus:ring-blue-500');
        });
        formActions.classList.remove('hidden');
        editBtn.innerHTML = `
            <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
            取消编辑
        `;
        editBtn.classList.add('bg-gray-100');
    } else {
        inputs.forEach(input => {
            input.disabled = true;
            input.classList.add('bg-gray-50', 'disabled:cursor-not-allowed');
            input.classList.remove('bg-white', 'focus:ring-2', 'focus:ring-blue-500');
        });
        formActions.classList.add('hidden');
        editBtn.innerHTML = `
            <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
            </svg>
            编辑配置
        `;
        editBtn.classList.remove('bg-gray-100');
    }
}

/**
 * 取消配置编辑
 */
function cancelConfigEdit() {
    toggleConfigEditMode();
    // 重新加载当前配置以恢复原始值
    if (configState.currentCategory) {
        loadConfigCategory(configState.currentCategory);
    }
}

/**
 * 保存配置
 */
async function saveConfig(e) {
    e.preventDefault();

    const inputs = document.querySelectorAll('.config-input');
    const updates = {};

    inputs.forEach(input => {
        const key = input.dataset.key;
        let value = input.value;

        // 根据输入类型转换值
        if (input.tagName === 'SELECT') {
            value = value === 'true';
        } else if (input.type === 'number') {
            value = parseFloat(value);
        } else if (value.includes(',')) {
            // 尝试解析为数组
            const originalItem = configState.configData.items.find(item => item.key === key);
            if (originalItem && Array.isArray(originalItem.value)) {
                value = value.split(',').map(v => v.trim()).filter(v => v);
            }
        }

        updates[key] = value;
    });

    try {
        await OpsAPI.updateConfig(configState.currentCategory, { updates });
        showToast('配置已保存', 'success');
        configState.editMode = false;
        await loadConfigCategory(configState.currentCategory);
    } catch (error) {
        showToast('保存配置失败: ' + error.message, 'error');
    }
}

/**
 * 打开重置配置确认对话框
 */
function openResetConfigModal() {
    const modal = document.getElementById('reset-config-modal');
    const content = document.getElementById('reset-config-content');

    const catInfo = configState.categories.find(c => c.category === configState.currentCategory);

    content.innerHTML = `
        <div class="flex items-center mb-4">
            <div class="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mr-4">
                <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
            </div>
            <div>
                <h3 class="text-lg font-bold text-gray-900">确认重置配置</h3>
                <p class="text-sm text-gray-500">此操作不可撤销</p>
            </div>
        </div>
        <p class="text-gray-600 mb-6">
            确定要将 <strong>${escapeHtml(catInfo?.name || configState.currentCategory)}</strong> 的所有配置项重置为默认值吗？
        </p>
        <div class="flex justify-end gap-3">
            <button onclick="closeResetConfigModal()" class="px-4 py-2 border rounded-lg hover:bg-gray-50">
                取消
            </button>
            <button onclick="executeResetConfig()" class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
                确认重置
            </button>
        </div>
    `;

    modal.classList.remove('hidden');
}

/**
 * 关闭重置配置确认对话框
 */
function closeResetConfigModal() {
    document.getElementById('reset-config-modal').classList.add('hidden');
}

/**
 * 执行重置配置
 */
async function executeResetConfig() {
    try {
        await OpsAPI.resetConfig(configState.currentCategory);
        showToast('配置已重置为默认值', 'success');
        closeResetConfigModal();
        await loadConfigCategory(configState.currentCategory);
    } catch (error) {
        showToast('重置配置失败: ' + error.message, 'error');
    }
}


// 导出
window.escapeHtml = escapeHtml;
window.loadDashboard = loadDashboard;
window.loadTenantsPage = loadTenantsPage;
window.loadTemplatesPage = loadTemplatesPage;
window.loadKnowledgePage = loadKnowledgePage;
window.formatNumber = formatNumber;
window.formatTime = formatTime;
window.formatDateTime = formatDateTime;
window.formatRelativeTime = formatRelativeTime;
window.showToast = showToast;

// 商家管理相关
window.loadTenantsList = loadTenantsList;
window.goToTenantsPage = goToTenantsPage;
window.viewTenantDetail = viewTenantDetail;
window.closeTenantModal = closeTenantModal;
window.suspendTenant = suspendTenant;
window.activateTenant = activateTenant;

// 模板管理相关
window.loadTemplatesList = loadTemplatesList;
window.goToTemplatesPage = goToTemplatesPage;
window.openTemplateEditor = openTemplateEditor;
window.closeTemplateEditor = closeTemplateEditor;
window.saveTemplate = saveTemplate;
window.deleteTemplate = deleteTemplate;
window.openDistributeModal = openDistributeModal;
window.closeDistributeModal = closeDistributeModal;
window.distributeTemplate = distributeTemplate;

// 知识库管理相关
window.loadQAPairsList = loadQAPairsList;
window.goToKnowledgePage = goToKnowledgePage;
window.toggleQASelection = toggleQASelection;
window.toggleAllQA = toggleAllQA;
window.clearKnowledgeSelection = clearKnowledgeSelection;
window.openQAEditor = openQAEditor;
window.closeQAEditor = closeQAEditor;
window.saveQAPair = saveQAPair;
window.deleteQAPair = deleteQAPair;
window.openBulkActionModal = openBulkActionModal;
window.closeBulkActionModal = closeBulkActionModal;
window.executeBulkAction = executeBulkAction;
window.openImportModal = openImportModal;
window.closeImportModal = closeImportModal;
window.executeImport = executeImport;
window.exportKnowledge = exportKnowledge;
window.downloadImportTemplate = downloadImportTemplate;
window.triggerSync = triggerSync;

// 日志管理相关
window.loadLogsPage = loadLogsPage;
window.loadLogsList = loadLogsList;
window.goToLogsPage = goToLogsPage;

// 告警管理相关
window.loadAlertsPage = loadAlertsPage;
window.loadActiveAlerts = loadActiveAlerts;
window.loadAlertHistory = loadAlertHistory;
window.switchAlertTab = switchAlertTab;
window.toggleAlertSelection = toggleAlertSelection;
window.toggleAllAlerts = toggleAllAlerts;
window.clearAlertSelection = clearAlertSelection;
window.acknowledgeAlertItem = acknowledgeAlertItem;
window.resolveAlertItem = resolveAlertItem;
window.bulkAcknowledgeAlerts = bulkAcknowledgeAlerts;
window.bulkResolveAlerts = bulkResolveAlerts;
window.goToAlertsPage = goToAlertsPage;

// 配置管理相关
window.loadConfigPage = loadConfigPage;
window.loadConfigCategory = loadConfigCategory;
window.toggleConfigEditMode = toggleConfigEditMode;
window.cancelConfigEdit = cancelConfigEdit;
window.saveConfig = saveConfig;
window.openResetConfigModal = openResetConfigModal;
window.closeResetConfigModal = closeResetConfigModal;
window.executeResetConfig = executeResetConfig;
