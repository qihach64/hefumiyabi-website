export default function InvestorUpdatePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* 简洁标题栏 - 移动端更紧凑 */}
      <div className="container py-3 md:py-6 flex items-center gap-3">
        <span className="px-2.5 py-1 bg-sakura-100 text-sakura-700 rounded-full text-xs md:text-sm font-medium">
          2026年1月
        </span>
        <h1 className="text-base md:text-xl font-semibold text-gray-800">项目进度报告</h1>
      </div>

      {/* Notion 嵌入 - 全屏高度 */}
      <iframe
        src="https://working-patella-f15.notion.site/ebd//2e465c8a1fc0801991b4fde871479af3"
        className="w-full border-0"
        style={{ height: "calc(100vh - 120px)", minHeight: "600px" }}
        allowFullScreen
      />
    </div>
  );
}
