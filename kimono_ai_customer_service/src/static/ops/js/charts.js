/**
 * Kimono AI 运维中心 - 图表模块
 */

const OpsCharts = {
    // 图表实例缓存
    instances: {},

    // ECharts 主题颜色
    colors: {
        primary: '#3b82f6',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        info: '#6366f1',
        gray: '#6b7280',
    },

    /**
     * 初始化或获取图表实例
     */
    getChart(containerId) {
        if (!this.instances[containerId]) {
            const container = document.getElementById(containerId);
            if (container) {
                this.instances[containerId] = echarts.init(container);

                // 响应窗口大小变化
                window.addEventListener('resize', () => {
                    this.instances[containerId]?.resize();
                });
            }
        }
        return this.instances[containerId];
    },

    /**
     * 销毁图表实例
     */
    destroyChart(containerId) {
        if (this.instances[containerId]) {
            this.instances[containerId].dispose();
            delete this.instances[containerId];
        }
    },

    /**
     * 渲染对话趋势图
     */
    renderConversationTrend(containerId, data) {
        const chart = this.getChart(containerId);
        if (!chart) return;

        const option = {
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'shadow'
                }
            },
            legend: {
                data: ['对话数', '反馈数', '新增QA'],
                bottom: 0,
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '15%',
                top: '10%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: data.map(d => d.date.slice(5)), // MM-DD 格式
                axisLine: {
                    lineStyle: { color: '#e5e7eb' }
                },
                axisLabel: {
                    color: '#6b7280'
                }
            },
            yAxis: {
                type: 'value',
                axisLine: {
                    show: false
                },
                axisTick: {
                    show: false
                },
                splitLine: {
                    lineStyle: { color: '#f3f4f6' }
                },
                axisLabel: {
                    color: '#6b7280'
                }
            },
            series: [
                {
                    name: '对话数',
                    type: 'bar',
                    data: data.map(d => d.conversations),
                    itemStyle: {
                        color: this.colors.primary,
                        borderRadius: [4, 4, 0, 0]
                    },
                    barWidth: '20%',
                },
                {
                    name: '反馈数',
                    type: 'line',
                    data: data.map(d => d.feedbacks),
                    itemStyle: {
                        color: this.colors.warning
                    },
                    lineStyle: {
                        width: 2
                    },
                    symbol: 'circle',
                    symbolSize: 6,
                },
                {
                    name: '新增QA',
                    type: 'line',
                    data: data.map(d => d.qa_pairs_created),
                    itemStyle: {
                        color: this.colors.success
                    },
                    lineStyle: {
                        width: 2
                    },
                    symbol: 'circle',
                    symbolSize: 6,
                }
            ]
        };

        chart.setOption(option);
    },

    /**
     * 渲染知识库分布饼图
     */
    renderKnowledgeDistribution(containerId, data) {
        const chart = this.getChart(containerId);
        if (!chart) return;

        const option = {
            tooltip: {
                trigger: 'item',
                formatter: '{b}: {c} ({d}%)'
            },
            legend: {
                orient: 'vertical',
                right: '5%',
                top: 'center',
            },
            series: [
                {
                    type: 'pie',
                    radius: ['40%', '70%'],
                    center: ['35%', '50%'],
                    avoidLabelOverlap: false,
                    itemStyle: {
                        borderRadius: 4,
                        borderColor: '#fff',
                        borderWidth: 2
                    },
                    label: {
                        show: false,
                    },
                    emphasis: {
                        label: {
                            show: true,
                            fontSize: 14,
                            fontWeight: 'bold'
                        }
                    },
                    data: data.map((item, index) => ({
                        value: item.count,
                        name: item.category || '未分类',
                        itemStyle: {
                            color: [
                                this.colors.primary,
                                this.colors.success,
                                this.colors.warning,
                                this.colors.info,
                                this.colors.danger,
                                this.colors.gray,
                            ][index % 6]
                        }
                    }))
                }
            ]
        };

        chart.setOption(option);
    },

    /**
     * 渲染 API 调用趋势图
     */
    renderAPIUsageTrend(containerId, data) {
        const chart = this.getChart(containerId);
        if (!chart) return;

        const option = {
            tooltip: {
                trigger: 'axis',
            },
            legend: {
                data: ['DashScope', 'Pinecone'],
                bottom: 0,
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '15%',
                top: '10%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: data.map(d => d.date.slice(5)),
                axisLine: {
                    lineStyle: { color: '#e5e7eb' }
                },
                axisLabel: {
                    color: '#6b7280'
                }
            },
            yAxis: {
                type: 'value',
                axisLine: {
                    show: false
                },
                axisTick: {
                    show: false
                },
                splitLine: {
                    lineStyle: { color: '#f3f4f6' }
                },
                axisLabel: {
                    color: '#6b7280'
                }
            },
            series: [
                {
                    name: 'DashScope',
                    type: 'line',
                    stack: 'Total',
                    areaStyle: {
                        opacity: 0.3
                    },
                    data: data.map(d => d.dashscope || 0),
                    itemStyle: {
                        color: this.colors.primary
                    },
                    smooth: true,
                },
                {
                    name: 'Pinecone',
                    type: 'line',
                    stack: 'Total',
                    areaStyle: {
                        opacity: 0.3
                    },
                    data: data.map(d => d.pinecone || 0),
                    itemStyle: {
                        color: this.colors.success
                    },
                    smooth: true,
                }
            ]
        };

        chart.setOption(option);
    },

    /**
     * 渲染商家对话分布图
     */
    renderTenantDistribution(containerId, data) {
        const chart = this.getChart(containerId);
        if (!chart) return;

        const option = {
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'shadow'
                }
            },
            grid: {
                left: '3%',
                right: '10%',
                bottom: '3%',
                top: '3%',
                containLabel: true
            },
            xAxis: {
                type: 'value',
                axisLine: {
                    show: false
                },
                axisTick: {
                    show: false
                },
                splitLine: {
                    lineStyle: { color: '#f3f4f6' }
                },
                axisLabel: {
                    color: '#6b7280'
                }
            },
            yAxis: {
                type: 'category',
                data: data.map(d => d.tenant_name).reverse(),
                axisLine: {
                    lineStyle: { color: '#e5e7eb' }
                },
                axisLabel: {
                    color: '#6b7280'
                }
            },
            series: [
                {
                    type: 'bar',
                    data: data.map(d => d.conversations_count).reverse(),
                    itemStyle: {
                        color: this.colors.primary,
                        borderRadius: [0, 4, 4, 0]
                    },
                    label: {
                        show: true,
                        position: 'right',
                        color: '#6b7280'
                    }
                }
            ]
        };

        chart.setOption(option);
    },

    /**
     * 渲染仪表盘迷你图
     */
    renderMiniChart(containerId, data, color = '#3b82f6') {
        const chart = this.getChart(containerId);
        if (!chart) return;

        const option = {
            grid: {
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
            },
            xAxis: {
                type: 'category',
                show: false,
                data: data.map((_, i) => i),
            },
            yAxis: {
                type: 'value',
                show: false,
            },
            series: [
                {
                    type: 'line',
                    data: data,
                    symbol: 'none',
                    lineStyle: {
                        color: color,
                        width: 2,
                    },
                    areaStyle: {
                        color: {
                            type: 'linear',
                            x: 0, y: 0, x2: 0, y2: 1,
                            colorStops: [
                                { offset: 0, color: color + '40' },
                                { offset: 1, color: color + '00' },
                            ],
                        },
                    },
                    smooth: true,
                }
            ]
        };

        chart.setOption(option);
    },
};

// 导出
window.OpsCharts = OpsCharts;
