export default function InvestorUpdatePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero 区域 */}
      <section className="bg-gradient-to-b from-sakura-50 to-white py-12">
        <div className="container">
          <h1 className="text-3xl font-bold text-gray-900">项目进度报告</h1>
          <p className="text-gray-600 mt-2">Kimono One 投资者更新</p>
        </div>
      </section>

      {/* 报告列表 */}
      <section className="container py-8 space-y-12">
        {/* 2026年1月报告 */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 bg-sakura-100 text-sakura-700 rounded-full text-sm font-medium">
              2026年1月
            </span>
            <h2 className="text-xl font-semibold text-gray-800">项目进度报告</h2>
          </div>
          <iframe
            src="https://working-patella-f15.notion.site/ebd//2e465c8a1fc0801991b4fde871479af3"
            className="w-full border-0 rounded-lg shadow-sm"
            style={{ height: "calc(100vh - 100px)", minHeight: "800px" }}
            allowFullScreen
          />
        </div>
      </section>
    </div>
  );
}
