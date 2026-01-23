// Booking feature components

// 基础组件
export { default as TimeSlotPicker } from "./TimeSlotPicker";
export { default as MiniCalendar } from "./MiniCalendar";
export { default as ContactForm } from "./ContactForm";
export type { ContactFormValues, ContactFormErrors } from "./ContactForm";
export { default as PriceBreakdown } from "./PriceBreakdown";
export type { UpgradeItem, CartItem } from "./PriceBreakdown";

// 复合组件
export { default as CollapsibleDateTimePicker } from "./CollapsibleDateTimePicker";

// Modal
export { default as InstantBookingModal } from "./InstantBookingModal";

// 辅助组件
export { default as MiniBookingBar } from "./MiniBookingBar";

// 兼容性重导出 (待迁移的组件)
export { default as BookingCard } from "@/components/BookingCard";
export { default as BookingsList } from "@/components/BookingsList";
