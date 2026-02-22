'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  CheckCircle,
  Calendar,
  MapPin,
  Mail,
  Home,
  User,
  CreditCard,
  Store,
} from 'lucide-react';

interface BookingItem {
  id: string;
  planName: string;
  planImage: string | null;
  storeName: string;
  storeCity: string;
  storeAddress: string;
  quantity: number;
  totalPrice: number;
}

interface BookingData {
  id: string;
  userId: string | null;
  totalAmount: number;
  paidAmount: number;
  paymentStatus: string;
  visitDate: string;
  visitTime: string;
  guestEmail: string | null;
  userEmail: string | null;
  viewToken: string | null;
  items: BookingItem[];
}

interface Props {
  booking: BookingData;
  paymentMethod: 'online' | 'store';
}

export default function BookingSuccessClient({ booking, paymentMethod }: Props) {
  const visitDate = new Date(booking.visitDate).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const email = booking.guestEmail || booking.userEmail;

  // 去重店铺信息
  const uniqueStores = Array.from(
    new Map(
      booking.items.map((item) => [
        item.storeName,
        { name: item.storeName, city: item.storeCity, address: item.storeAddress },
      ]),
    ).values(),
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF7F5]/60 via-white to-[#FFF7F5]/30 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* 成功图标 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-[28px] md:text-[32px] font-semibold text-gray-900 mb-2">
            {paymentMethod === 'online' ? '支付成功！' : '预约已提交！'}
          </h1>
          <p className="text-[15px] text-gray-600">
            {paymentMethod === 'online'
              ? '感谢您的支付，预约已确认'
              : '感谢您的预约，请到店时支付'}
          </p>
        </div>

        {/* 支付方式标签 */}
        <div className="flex justify-center mb-6">
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[14px] font-medium ${
              paymentMethod === 'online'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
            }`}
          >
            {paymentMethod === 'online' ? (
              <>
                <CreditCard className="w-4 h-4" />
                已在线支付 ¥{(booking.totalAmount / 100).toLocaleString()}
              </>
            ) : (
              <>
                <Store className="w-4 h-4" />
                到店付款 ¥{(booking.totalAmount / 100).toLocaleString()}
              </>
            )}
          </div>
        </div>

        {/* 预约详情卡片 */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 mb-6">
          <div className="mb-6 pb-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-[18px] font-semibold text-gray-900">预约详情</h2>
              <span className="text-[14px] text-gray-500">
                编号: {booking.id.slice(0, 8)}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {/* 预约项目 */}
            {booking.items.length > 0 && (
              <div>
                <p className="text-[14px] text-gray-500 mb-3">预约项目</p>
                <div className="space-y-3">
                  {booking.items.map((item) => (
                    <div key={item.id} className="flex gap-3 p-3 bg-gray-50 rounded-xl">
                      {item.planImage ? (
                        <div className="relative w-16 h-20 rounded-lg overflow-hidden bg-gray-200 shrink-0">
                          <Image
                            src={item.planImage}
                            alt={item.planName}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-20 rounded-lg bg-gray-200 flex items-center justify-center shrink-0">
                          <Store className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="text-[15px] font-medium text-gray-900">
                          {item.planName}
                        </div>
                        <div className="text-[14px] text-gray-600 mt-1">数量: {item.quantity}</div>
                        <div className="text-[14px] text-gray-600 mt-0.5">
                          店铺: {item.storeName}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 店铺信息 */}
            {uniqueStores.length > 0 && (
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-500 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-[14px] text-gray-500">店铺地址</p>
                  {uniqueStores.map((store, idx) => (
                    <div key={idx} className="mt-1">
                      <p className="text-[15px] font-medium text-gray-900">{store.name}</p>
                      <p className="text-[14px] text-gray-600">
                        {store.city} - {store.address}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 日期信息 */}
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-500 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-[14px] text-gray-500">到店时间</p>
                <p className="text-[15px] font-medium text-gray-900">
                  {visitDate} {booking.visitTime}
                </p>
              </div>
            </div>

            {/* 邮件通知 */}
            {email && (
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-gray-500 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-[14px] text-gray-500">确认邮件已发送至</p>
                  <p className="text-[15px] font-medium text-gray-900">{email}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 温馨提示 */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
          <h3 className="text-[15px] font-semibold text-blue-900 mb-3">温馨提示</h3>
          <ul className="space-y-2 text-[14px] text-blue-800">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>请在预约时间前15分钟到店</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>到店后工作人员将为您准备和服</span>
            </li>
            {paymentMethod === 'store' && (
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>到店时请准备好支付金额，支持现金和刷卡</span>
              </li>
            )}
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>如需取消或修改预约，请提前3天联系我们</span>
            </li>
          </ul>
        </div>

        {/* 游客注册提示 */}
        {!booking.userId && (
          <div className="bg-shu-50 border border-shu-200 rounded-xl p-6 mb-6">
            <h3 className="text-[15px] font-semibold text-shu-900 mb-2">注册账户享受更多优惠</h3>
            <p className="text-[14px] text-shu-800 mb-4">
              注册后可以查看预约历史、获得会员折扣、优先预约特别活动
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-shu-500 text-white font-semibold py-2 px-6 rounded-lg hover:bg-shu-600 transition shadow-md hover:shadow-lg text-[14px]"
            >
              <User className="w-4 h-4" />
              立即注册
            </Link>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex flex-col sm:flex-row gap-4">
          {booking.userId ? (
            <Link
              href="/profile#bookings"
              className="flex-1 text-center bg-shu-500 text-white font-semibold py-3 px-6 rounded-lg hover:bg-shu-600 transition shadow-md hover:shadow-lg"
            >
              查看我的预约
            </Link>
          ) : booking.viewToken ? (
            <Link
              href={`/booking/status?token=${booking.viewToken}`}
              className="flex-1 text-center bg-shu-500 text-white font-semibold py-3 px-6 rounded-lg hover:bg-shu-600 transition shadow-md hover:shadow-lg"
            >
              查看预约状态
            </Link>
          ) : null}
          <Link
            href="/"
            className="flex-1 text-center border border-gray-300 text-gray-700 font-medium py-3 px-6 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Home className="w-4 h-4 inline mr-2" />
            返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}
