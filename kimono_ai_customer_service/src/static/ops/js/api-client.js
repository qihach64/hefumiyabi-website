/**
 * Kimono AI 运维中心 - API 客户端
 */

const OpsAPI = {
    baseUrl: '/api/v1/ops',

    /**
     * 发送 API 请求
     */
    async request(endpoint, options = {}) {
        const url = this.baseUrl + endpoint;

        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            },
        };

        // 如果有 token，添加到 header
        const token = localStorage.getItem('ops_token');
        if (token) {
            defaultOptions.headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(url, { ...defaultOptions, ...options });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: '请求失败' }));
            throw new Error(error.detail || error.message || `HTTP ${response.status}`);
        }

        return response.json();
    },

    /**
     * GET 请求
     */
    async get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        return this.request(url);
    },

    /**
     * POST 请求
     */
    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    /**
     * PUT 请求
     */
    async put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    /**
     * DELETE 请求
     */
    async delete(endpoint, data = null) {
        const options = {
            method: 'DELETE',
        };
        if (data) {
            options.body = JSON.stringify(data);
        }
        return this.request(endpoint, options);
    },

    // ========== 仪表盘 API ==========

    /**
     * 获取仪表盘概览
     */
    async getDashboardOverview() {
        return this.get('/dashboard/overview');
    },

    /**
     * 获取趋势数据
     */
    async getDashboardTrends(days = 7) {
        return this.get('/dashboard/trends', { days });
    },

    /**
     * 获取活跃商家 TOP N
     */
    async getTopActiveTenants(limit = 5) {
        return this.get('/dashboard/top-tenants', { limit });
    },

    // ========== 系统状态 API ==========

    /**
     * 获取系统状态
     */
    async getSystemStatus() {
        return this.get('/system/status');
    },

    /**
     * 获取组件健康状态
     */
    async getComponentHealth() {
        return this.get('/system/components');
    },

    // ========== 商家管理 API (第二阶段) ==========

    /**
     * 获取商家列表
     */
    async getTenants(params = {}) {
        return this.get('/tenants', params);
    },

    /**
     * 获取商家详情
     */
    async getTenantDetail(tenantId) {
        return this.get(`/tenants/${tenantId}`);
    },

    /**
     * 获取商家统计
     */
    async getTenantStats(tenantId) {
        return this.get(`/tenants/${tenantId}/stats`);
    },

    /**
     * 暂停商家
     */
    async suspendTenant(tenantId, reason = '') {
        return this.post(`/tenants/${tenantId}/suspend`, { reason });
    },

    /**
     * 激活商家
     */
    async activateTenant(tenantId) {
        return this.post(`/tenants/${tenantId}/activate`);
    },

    /**
     * 获取商家删除预览统计
     */
    async getTenantDeletePreview(tenantId) {
        return this.get(`/tenants/${tenantId}/delete-preview`);
    },

    /**
     * 删除商家及所有数据
     */
    async deleteTenant(tenantId, confirmName) {
        return this.delete(`/tenants/${tenantId}`, { confirm_name: confirmName });
    },

    // ========== 通用模板 API (第二阶段) ==========

    /**
     * 获取模板列表
     */
    async getTemplates(params = {}) {
        return this.get('/templates', params);
    },

    /**
     * 创建模板
     */
    async createTemplate(data) {
        return this.post('/templates', data);
    },

    /**
     * 更新模板
     */
    async updateTemplate(id, data) {
        return this.put(`/templates/${id}`, data);
    },

    /**
     * 删除模板
     */
    async deleteTemplate(id) {
        return this.delete(`/templates/${id}`);
    },

    /**
     * 分发模板
     */
    async distributeTemplates(templateIds, tenantIds = null) {
        return this.post('/templates/distribute', {
            template_ids: templateIds,
            tenant_ids: tenantIds,
        });
    },

    // ========== 知识库管理 API (第三阶段) ==========

    /**
     * 获取知识库概览
     */
    async getKnowledgeOverview() {
        return this.get('/knowledge/overview');
    },

    /**
     * 获取 QA 列表
     */
    async getQAPairs(params = {}) {
        return this.get('/knowledge/qa-pairs', params);
    },

    /**
     * 创建 QA
     */
    async createQAPair(data) {
        return this.post('/knowledge/qa-pairs', data);
    },

    /**
     * 更新 QA
     */
    async updateQAPair(id, data) {
        return this.put(`/knowledge/qa-pairs/${id}`, data);
    },

    /**
     * 删除 QA
     */
    async deleteQAPair(id) {
        return this.delete(`/knowledge/qa-pairs/${id}`);
    },

    /**
     * 触发同步
     */
    async syncKnowledge(tenantId = null) {
        return this.post('/knowledge/sync', { tenant_id: tenantId });
    },

    /**
     * 获取同步状态
     */
    async getSyncStatus() {
        return this.get('/knowledge/sync/status');
    },

    /**
     * 批量删除 QA
     */
    async bulkDeleteQA(qaIds) {
        return this.post('/knowledge/qa-pairs/bulk', {
            action: 'delete',
            qa_ids: qaIds,
        });
    },

    /**
     * 批量标记待同步
     */
    async bulkSyncQA(qaIds) {
        return this.post('/knowledge/qa-pairs/bulk', {
            action: 'sync',
            qa_ids: qaIds,
        });
    },

    /**
     * 批量更新分类
     */
    async bulkUpdateCategory(qaIds, category) {
        return this.post('/knowledge/qa-pairs/bulk', {
            action: 'update_category',
            qa_ids: qaIds,
            category: category,
        });
    },

    /**
     * 获取知识库分类列表
     */
    async getKnowledgeCategories(tenantId = null) {
        const params = tenantId ? { tenant_id: tenantId } : {};
        return this.get('/knowledge/categories', params);
    },

    /**
     * 获取知识库来源列表
     */
    async getKnowledgeSources() {
        return this.get('/knowledge/sources');
    },

    /**
     * 获取商家列表（用于下拉选择）
     */
    async getKnowledgeTenants() {
        return this.get('/knowledge/tenants');
    },

    /**
     * 导入知识库 (需要使用 FormData)
     */
    async importKnowledge(file, tenantId, skipHeader = true) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('tenant_id', tenantId);
        formData.append('skip_header', skipHeader);

        const token = localStorage.getItem('ops_token');
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(this.baseUrl + '/knowledge/import', {
            method: 'POST',
            headers: headers,
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: '导入失败' }));
            throw new Error(error.detail || error.message);
        }

        return response.json();
    },

    /**
     * 导出知识库
     */
    async exportKnowledge(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = this.baseUrl + '/knowledge/export' + (queryString ? `?${queryString}` : '');

        const token = localStorage.getItem('ops_token');
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(url, { headers });

        if (!response.ok) {
            throw new Error('导出失败');
        }

        return response.blob();
    },

    /**
     * 下载导入模板
     */
    async getImportTemplate() {
        const token = localStorage.getItem('ops_token');
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(this.baseUrl + '/knowledge/import-template', { headers });

        if (!response.ok) {
            throw new Error('下载模板失败');
        }

        return response.blob();
    },

    // ========== 日志 API (第四阶段) ==========

    /**
     * 查询日志
     */
    async queryLogs(params = {}) {
        return this.get('/logs/query', params);
    },

    /**
     * 获取日志统计
     */
    async getLogStats(params = {}) {
        return this.get('/logs/stats', params);
    },

    /**
     * 获取日志操作类型
     */
    async getLogActions() {
        return this.get('/logs/actions');
    },

    /**
     * 获取日志目标类型
     */
    async getLogTargetTypes() {
        return this.get('/logs/target-types');
    },

    /**
     * 获取日志用户列表
     */
    async getLogUsers() {
        return this.get('/logs/users');
    },

    // ========== 告警 API (第四阶段) ==========

    /**
     * 获取活跃告警
     */
    async getActiveAlerts() {
        return this.get('/alerts/active');
    },

    /**
     * 获取告警历史
     */
    async getAlertHistory(params = {}) {
        return this.get('/alerts/history', params);
    },

    /**
     * 获取告警统计
     */
    async getAlertStats(params = {}) {
        return this.get('/alerts/stats', params);
    },

    /**
     * 创建告警
     */
    async createAlert(data) {
        return this.post('/alerts', data);
    },

    /**
     * 确认告警
     */
    async acknowledgeAlert(alertId) {
        return this.post(`/alerts/${alertId}/acknowledge`);
    },

    /**
     * 解决告警
     */
    async resolveAlert(alertId, note = '') {
        return this.post(`/alerts/${alertId}/resolve`, { note });
    },

    /**
     * 批量确认告警
     */
    async bulkAcknowledgeAlerts(alertIds) {
        return this.post('/alerts/bulk/acknowledge', { alert_ids: alertIds });
    },

    /**
     * 批量解决告警
     */
    async bulkResolveAlerts(alertIds, note = '') {
        return this.post('/alerts/bulk/resolve', { alert_ids: alertIds, note });
    },

    /**
     * 获取告警类型列表
     */
    async getAlertTypes() {
        return this.get('/alerts/types');
    },

    /**
     * 获取告警来源列表
     */
    async getAlertSources() {
        return this.get('/alerts/sources');
    },

    // ========== API 使用统计 (第四阶段) ==========

    /**
     * 获取使用记录
     */
    async getAPIUsageRecords(params = {}) {
        return this.get('/api-usage/records', params);
    },

    /**
     * 获取 API 使用统计
     */
    async getAPIUsageStats(params = {}) {
        return this.get('/api-usage/stats', params);
    },

    /**
     * 获取成本估算
     */
    async getAPICostEstimate(params = {}) {
        return this.get('/api-usage/cost', params);
    },

    /**
     * 获取 API 类型列表
     */
    async getAPITypes() {
        return this.get('/api-usage/types');
    },

    /**
     * 获取操作类型列表
     */
    async getAPIOperations(apiType = null) {
        const params = apiType ? { api_type: apiType } : {};
        return this.get('/api-usage/operations', params);
    },

    // ========== 配置管理 API (第五阶段) ==========

    /**
     * 获取配置分类
     */
    async getConfigCategories() {
        return this.get('/config/categories');
    },

    /**
     * 获取配置
     */
    async getConfig(category) {
        return this.get(`/config/${category}`);
    },

    /**
     * 更新配置
     */
    async updateConfig(category, data) {
        return this.put(`/config/${category}`, data);
    },

    /**
     * 重置配置
     */
    async resetConfig(category) {
        return this.post(`/config/${category}/reset`);
    },

    // ========== 认证 API (第五阶段) ==========

    /**
     * 登录
     */
    async login(username, password) {
        // 登录不需要带 token
        const response = await fetch(this.baseUrl + '/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: '登录失败' }));
            throw new Error(error.detail || `HTTP ${response.status}`);
        }

        return response.json();
    },

    /**
     * 登出
     */
    async logout() {
        return this.post('/auth/logout');
    },

    /**
     * 检查会话状态
     */
    async checkAuthStatus() {
        return this.get('/auth/status');
    },

    /**
     * 检查是否已登录
     */
    isLoggedIn() {
        return !!localStorage.getItem('ops_token');
    },

    /**
     * 获取当前用户名
     */
    getCurrentUsername() {
        return localStorage.getItem('ops_username');
    },

    /**
     * 清除登录信息
     */
    clearAuth() {
        localStorage.removeItem('ops_token');
        localStorage.removeItem('ops_username');
    },
};

// 导出
window.OpsAPI = OpsAPI;
