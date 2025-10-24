export default function AdminSettingsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">系统设置</h1>
        <p className="text-gray-600 mt-2">配置平台参数和功能选项</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚙️</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            系统设置功能
          </h2>
          <p className="text-gray-600">
            此功能正在开发中，敬请期待...
          </p>
        </div>
      </div>
    </div>
  );
}
