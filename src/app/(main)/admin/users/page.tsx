export default function AdminUsersPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">用户管理</h1>
        <p className="text-gray-600 mt-2">查看和管理平台用户</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">👥</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            用户管理功能
          </h2>
          <p className="text-gray-600">
            此功能正在开发中，敬请期待...
          </p>
        </div>
      </div>
    </div>
  );
}
