import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  // 未登录访问 /profile → 重定向到登录页并携带 callbackUrl
  if (pathname.startsWith("/profile") && !isLoggedIn) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 已登录访问登录/注册页 → 重定向到首页
  if ((pathname.startsWith("/login") || pathname.startsWith("/register")) && isLoggedIn) {
    return NextResponse.redirect(new URL("/", req.url));
  }
});

export const config = {
  // /booking 不保护（支持游客预约）
  matcher: ["/profile/:path*", "/login", "/register"],
};
