/**
 * 测试热点位置一致性
 *
 * 确保用户端只显示商户明确设置过位置的热点
 * 运行: DATABASE_URL="..." pnpm tsx scripts/test-hotspot-consistency.ts
 */

import prisma from "../src/lib/prisma";
import { getPlanMapData } from "../src/lib/kimono-map";

const TEST_PLAN_ID = "cmioftwvu0009yc2h40pakpy5";

async function runTests() {
  console.log("🧪 热点位置一致性测试\n");

  let passed = 0;
  let failed = 0;

  try {
    // 测试 1: 检查数据库数据
    console.log("📋 测试 1: 检查数据库中的 planComponents");
    const plan = await prisma.rentalPlan.findUnique({
      where: { id: TEST_PLAN_ID },
      include: {
        planComponents: {
          include: {
            component: {
              select: {
                id: true,
                name: true,
                icon: true,
              },
            },
          },
        },
      },
    });

    if (!plan) {
      console.log("❌ 套餐不存在");
      failed++;
      return;
    }

    console.log(`   套餐名称: ${plan.name}`);
    console.log(`   组件总数: ${plan.planComponents.length}`);

    const componentsWithPosition = plan.planComponents.filter(
      (pc) => pc.hotmapX != null && pc.hotmapY != null
    );
    const componentsWithoutPosition = plan.planComponents.filter(
      (pc) => pc.hotmapX == null || pc.hotmapY == null
    );

    console.log(`   有位置的组件: ${componentsWithPosition.length}`);
    console.log(`   无位置的组件: ${componentsWithoutPosition.length}`);

    componentsWithPosition.forEach((pc) => {
      console.log(
        `   ✓ ${pc.component.icon} ${pc.component.name} @ (${pc.hotmapX}, ${pc.hotmapY})`
      );
    });

    componentsWithoutPosition.forEach((pc) => {
      console.log(`   ○ ${pc.component.icon} ${pc.component.name} (无位置)`);
    });
    passed++;

    // 测试 2: 检查 getPlanMapData 返回结果
    console.log("\n📋 测试 2: 检查 getPlanMapData 返回结果");
    const mapData = await getPlanMapData(TEST_PLAN_ID);

    if (!mapData) {
      console.log("❌ getPlanMapData 返回 null");
      failed++;
    } else {
      console.log(`   热点数量: ${mapData.hotspots.length}`);

      // 验证热点数量
      if (mapData.hotspots.length === componentsWithPosition.length) {
        console.log(`   ✅ 热点数量正确 (${mapData.hotspots.length})`);
        passed++;
      } else {
        console.log(
          `   ❌ 热点数量不一致: 期望 ${componentsWithPosition.length}, 实际 ${mapData.hotspots.length}`
        );
        failed++;
      }

      // 显示返回的热点
      mapData.hotspots.forEach((h) => {
        console.log(
          `   → ${h.component.icon} ${h.component.name} @ (${h.x}, ${h.y})`
        );
      });
    }

    // 测试 3: 验证没有位置的组件不在返回结果中
    console.log("\n📋 测试 3: 验证无位置组件不在返回结果中");
    if (mapData) {
      const mapComponentIds = new Set(mapData.hotspots.map((h) => h.component.id));
      let allExcluded = true;

      componentsWithoutPosition.forEach((pc) => {
        if (mapComponentIds.has(pc.componentId)) {
          console.log(
            `   ❌ ${pc.component.icon} ${pc.component.name} 不应该出现在结果中`
          );
          allExcluded = false;
        }
      });

      if (allExcluded) {
        console.log("   ✅ 所有无位置组件都被正确排除");
        passed++;
      } else {
        failed++;
      }
    }

    // 测试 4: 验证位置值一致性
    console.log("\n📋 测试 4: 验证位置值一致性 (WYSIWYG)");
    if (mapData) {
      const planComponentMap = new Map(
        plan.planComponents.map((pc) => [pc.componentId, pc])
      );

      let allMatch = true;
      mapData.hotspots.forEach((h) => {
        const pc = planComponentMap.get(h.component.id);
        if (!pc) {
          console.log(`   ❌ 找不到组件 ${h.component.id}`);
          allMatch = false;
          return;
        }

        const xMatch = h.x === pc.hotmapX;
        const yMatch = h.y === pc.hotmapY;
        const labelMatch = h.labelPosition === (pc.hotmapLabelPosition || "right");

        if (xMatch && yMatch && labelMatch) {
          console.log(
            `   ✅ ${h.component.icon} ${h.component.name}: 位置一致`
          );
        } else {
          console.log(
            `   ❌ ${h.component.icon} ${h.component.name}: 位置不一致`
          );
          console.log(`      期望: (${pc.hotmapX}, ${pc.hotmapY}, ${pc.hotmapLabelPosition})`);
          console.log(`      实际: (${h.x}, ${h.y}, ${h.labelPosition})`);
          allMatch = false;
        }
      });

      if (allMatch) {
        passed++;
      } else {
        failed++;
      }
    }

    // 总结
    console.log("\n" + "=".repeat(50));
    console.log(`📊 测试结果: ${passed} 通过, ${failed} 失败`);
    console.log("=".repeat(50));

    if (failed === 0) {
      console.log("🎉 所有测试通过！商户端与用户端热点位置一致。");
    } else {
      console.log("⚠️ 存在不一致，请检查代码。");
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ 测试出错:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
