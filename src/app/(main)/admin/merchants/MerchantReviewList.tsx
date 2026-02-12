"use client";

import { useState } from "react";
import { Store, Check, X, Eye, MapPin, Mail, Phone, Calendar } from "lucide-react";
import { Button, Badge } from "@/components/ui";
import { useRouter } from "next/navigation";

interface Merchant {
  id: string;
  businessName: string;
  legalName: string | null;
  description: string | null;
  logo: string | null;
  status: string;
  verified: boolean;
  commissionRate: number;
  createdAt: Date;
  owner: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    createdAt: Date;
  };
  stores: {
    id: string;
    name: string;
    city: string;
  }[];
}

interface MerchantReviewListProps {
  merchants: Merchant[];
}

export default function MerchantReviewList({ merchants }: MerchantReviewListProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // 筛选商家
  const filteredMerchants = merchants.filter((merchant) => {
    if (filter === "ALL") return true;
    return merchant.status === filter;
  });

  // 批准商家
  const handleApprove = async (merchantId: string) => {
    if (!confirm("确定要批准此商家申请吗？")) return;

    setIsProcessing(true);
    try {
      const response = await fetch(`/api/admin/merchants/${merchantId}/approve`, {
        method: "POST",
      });

      if (response.ok) {
        alert("商家申请已批准！");
        router.refresh();
        setSelectedMerchant(null);
      } else {
        const data = await response.json();
        alert(data.message || "批准失败");
      }
    } catch (error) {
      alert("操作失败，请重试");
    } finally {
      setIsProcessing(false);
    }
  };

  // 拒绝商家
  const handleReject = async (merchantId: string) => {
    const reason = prompt("请输入拒绝原因（将发送给商家）:");
    if (!reason) return;

    setIsProcessing(true);
    try {
      const response = await fetch(`/api/admin/merchants/${merchantId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });

      if (response.ok) {
        alert("商家申请已拒绝");
        router.refresh();
        setSelectedMerchant(null);
      } else {
        const data = await response.json();
        alert(data.message || "拒绝失败");
      }
    } catch (error) {
      alert("操作失败，请重试");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div>
      {/* 筛选器 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">状态筛选：</span>
          <div className="flex gap-2">
            {["ALL", "PENDING", "APPROVED", "REJECTED"].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === status
                    ? "bg-sakura-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {status === "ALL"
                  ? "全部"
                  : status === "PENDING"
                    ? "待审核"
                    : status === "APPROVED"
                      ? "已批准"
                      : "已拒绝"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 商家列表 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  商家信息
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  负责人
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  店铺数量
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  申请时间
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMerchants.map((merchant) => (
                <tr key={merchant.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {merchant.logo ? (
                          <img
                            className="h-10 w-10 rounded-lg object-cover"
                            src={merchant.logo}
                            alt={merchant.businessName}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center">
                            <Store className="h-5 w-5 text-gray-500" />
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {merchant.businessName}
                        </div>
                        <div className="text-sm text-gray-500">{merchant.legalName}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{merchant.owner.name || "未设置"}</div>
                    <div className="text-sm text-gray-500">{merchant.owner.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{merchant.stores.length} 个店铺</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge
                      variant={
                        merchant.status === "APPROVED"
                          ? "success"
                          : merchant.status === "PENDING"
                            ? "warning"
                            : "danger"
                      }
                      size="sm"
                    >
                      {merchant.status === "APPROVED"
                        ? "已批准"
                        : merchant.status === "PENDING"
                          ? "待审核"
                          : "已拒绝"}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(merchant.createdAt).toLocaleDateString("zh-CN")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelectedMerchant(merchant)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {merchant.status === "PENDING" && (
                        <>
                          <button
                            onClick={() => handleApprove(merchant.id)}
                            disabled={isProcessing}
                            className="text-green-600 hover:text-green-900 disabled:opacity-50"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleReject(merchant.id)}
                            disabled={isProcessing}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredMerchants.length === 0 && (
          <div className="text-center py-12">
            <Store className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">暂无符合条件的商家</p>
          </div>
        )}
      </div>

      {/* 商家详情弹窗 */}
      {selectedMerchant && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedMerchant(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  {selectedMerchant.logo ? (
                    <img
                      src={selectedMerchant.logo}
                      alt={selectedMerchant.businessName}
                      className="w-16 h-16 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-gray-200 flex items-center justify-center">
                      <Store className="w-8 h-8 text-gray-500" />
                    </div>
                  )}
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {selectedMerchant.businessName}
                    </h2>
                    <p className="text-gray-600">{selectedMerchant.legalName}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedMerchant(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* 商家简介 */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">商家简介</h3>
                  <p className="text-gray-600">{selectedMerchant.description}</p>
                </div>

                {/* 负责人信息 */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">负责人信息</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{selectedMerchant.owner.email}</span>
                    </div>
                    {selectedMerchant.owner.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">{selectedMerchant.owner.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">
                        注册时间：
                        {new Date(selectedMerchant.owner.createdAt).toLocaleDateString("zh-CN")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 店铺信息 */}
                {selectedMerchant.stores.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">店铺信息</h3>
                    <div className="space-y-2">
                      {selectedMerchant.stores.map((store) => (
                        <div key={store.id} className="flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">
                            {store.name} - {store.city}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 操作按钮 */}
                {selectedMerchant.status === "PENDING" && (
                  <div className="flex gap-3 pt-4 border-t">
                    <Button
                      variant="primary"
                      size="lg"
                      fullWidth
                      onClick={() => handleApprove(selectedMerchant.id)}
                      disabled={isProcessing}
                    >
                      <Check className="w-5 h-5 mr-2" />
                      批准申请
                    </Button>
                    <Button
                      variant="destructive"
                      size="lg"
                      fullWidth
                      onClick={() => handleReject(selectedMerchant.id)}
                      disabled={isProcessing}
                    >
                      <X className="w-5 h-5 mr-2" />
                      拒绝申请
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
