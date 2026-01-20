# 标签管理系统设计文档

> **文档日期**: 2025-11-02
> **设计理念**: 让管理员和商家都能方便地管理标签，零代码实现筛选器配置
> **核心目标**: 灵活性 > 易用性 > 性能

---

## 📋 目录

1. [角色与权限](#角色与权限)
2. [管理员功能](#管理员功能)
3. [商家功能](#商家功能)
4. [数据模型扩展](#数据模型扩展)
5. [管理界面设计](#管理界面设计)
6. [API设计](#api设计)
7. [实施路线图](#实施路线图)

---

## 角色与权限

### 角色定义

```typescript
// src/types/roles.ts

enum UserRole {
  ADMIN = 'ADMIN',           // 平台管理员
  MERCHANT = 'MERCHANT',     // 商家
  STAFF = 'STAFF',           // 店员
  USER = 'USER',             // 普通用户
}

// 权限矩阵
const PERMISSIONS = {
  // 标签分类管理
  'tag_category.create': [UserRole.ADMIN],
  'tag_category.update': [UserRole.ADMIN],
  'tag_category.delete': [UserRole.ADMIN],
  'tag_category.view': [UserRole.ADMIN, UserRole.MERCHANT],

  // 标签管理
  'tag.create': [UserRole.ADMIN],
  'tag.update': [UserRole.ADMIN],
  'tag.delete': [UserRole.ADMIN],
  'tag.view': [UserRole.ADMIN, UserRole.MERCHANT],

  // 套餐标签管理
  'plan_tag.assign': [UserRole.ADMIN, UserRole.MERCHANT],  // 商家可以为自己的套餐打标签
  'plan_tag.remove': [UserRole.ADMIN, UserRole.MERCHANT],
  'plan_tag.view': [UserRole.ADMIN, UserRole.MERCHANT, UserRole.USER],

  // 筛选器配置
  'filter.configure': [UserRole.ADMIN],  // 只有管理员能配置筛选器
  'filter.view': [UserRole.ADMIN, UserRole.MERCHANT, UserRole.USER],
} as const;
```

### 业务场景

> **设计理念**: 初期由平台统一管理所有标签，确保标准化。后期如有需要可扩展商家建议功能。

**管理员 (ADMIN)**:
- ✅ 创建新的标签分类 (如"拍摄场景")
- ✅ 在分类下创建具体标签 (如"樱花季专属")
- ✅ 配置哪些标签出现在前端筛选器中
- ✅ 设置标签的推荐规则
- ✅ 为套餐批量打标签 (包括商家套餐)

**商家 (MERCHANT)**:
- ✅ 为自己的套餐添加/移除标签 (从管理员预定义的标签中选择)
- ✅ 批量编辑套餐标签
- ✅ 查看可用标签列表
- ❌ **不能创建新标签** (保证平台标准化)
- ❌ **不能建议新标签** (初期简化，后期可开放)
- ❌ 不能创建新标签分类
- ❌ 不能配置筛选器

**用户 (USER)**:
- ✅ 使用筛选器浏览套餐
- ✅ 查看套餐的标签
- ❌ 不能编辑任何标签

---

## 管理员功能

### 1. 标签分类管理

#### 数据模型扩展

```prisma
// prisma/schema.prisma

model TagCategory {
  id          String @id @default(cuid())
  code        String @unique
  name        String
  nameEn      String?
  description String?
  icon        String?  // Lucide icon name
  color       String?  // 主题色 (hex)

  // 显示控制
  order       Int @default(0)
  isActive    Boolean @default(true)
  isRequired  Boolean @default(false)  // 是否必选

  // 筛选器配置
  showInFilter       Boolean @default(true)   // 是否在筛选器中显示
  filterType         FilterType @default(CHECKBOX)  // 筛选器类型
  filterOrder        Int @default(0)          // 筛选器中的排序
  filterCollapsible  Boolean @default(false)  // 是否可折叠
  filterDefaultOpen  Boolean @default(true)   // 默认展开
  maxSelections      Int?                     // 最大可选数量 (null=无限制)

  // 多选逻辑
  multipleSelection  Boolean @default(false)  // 是否支持多选
  selectionLogic     SelectionLogic @default(OR)  // OR=任意匹配, AND=全部匹配

  tags        Tag[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([isActive, order])
  @@index([showInFilter, filterOrder])
}

enum FilterType {
  CHECKBOX      // 复选框列表
  RADIO         // 单选按钮
  DROPDOWN      // 下拉选择器
  BUTTON_GROUP  // 按钮组
  SLIDER        // 滑块 (用于数值范围)
}

enum SelectionLogic {
  OR   // 任意匹配 (场景: 选中"街拍"或"约会"，两者都显示)
  AND  // 全部匹配 (场景: 必须同时满足多个条件)
}

model Tag {
  id          String @id @default(cuid())
  categoryId  String
  code        String
  name        String
  nameEn      String?
  description String?
  icon        String?
  color       String?

  // 显示控制
  order       Int @default(0)
  isActive    Boolean @default(true)

  // 推荐权重 (用于智能推荐)
  weight      Int @default(1)

  // 使用统计
  usageCount  Int @default(0)  // 有多少套餐使用了这个标签

  category    TagCategory @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  plans       PlanTag[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([categoryId, code])
  @@index([categoryId, isActive, order])
  @@index([usageCount])
}

model PlanTag {
  id        String @id @default(cuid())
  planId    String
  tagId     String

  // 审计字段
  addedBy   String?  // 谁添加的 (userId)
  addedAt   DateTime @default(now())

  plan      RentalPlan @relation(fields: [planId], references: [id], onDelete: Cascade)
  tag       Tag @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@unique([planId, tagId])
  @@index([planId])
  @@index([tagId])
  @@index([addedBy])
}

// ===================================================================
// 以下模型用于后期扩展商家建议功能，初期不实现
// ===================================================================

// // 商家标签建议 (V2功能，初期不启用)
// model TagSuggestion {
//   id          String @id @default(cuid())
//   categoryId  String
//   code        String
//   name        String
//   nameEn      String?
//   description String?
//   reason      String?  // 建议理由
//
//   // 建议者信息
//   suggestedBy String   // 商家ID
//   status      SuggestionStatus @default(PENDING)
//
//   // 审核信息
//   reviewedBy  String?  // 管理员ID
//   reviewedAt  DateTime?
//   reviewNote  String?
//
//   // 如果通过，创建的标签ID
//   createdTagId String?
//
//   category    TagCategory @relation(fields: [categoryId], references: [id])
//   suggester   User @relation("suggestions", fields: [suggestedBy], references: [id])
//   reviewer    User? @relation("reviews", fields: [reviewedBy], references: [id])
//
//   createdAt   DateTime @default(now())
//   updatedAt   DateTime @updatedAt
//
//   @@index([status, createdAt])
//   @@index([suggestedBy])
// }
//
// enum SuggestionStatus {
//   PENDING
//   APPROVED
//   REJECTED
// }
```

---

### 2. 管理员控制台 - 标签分类管理

#### 页面结构

```tsx
// src/app/admin/tags/categories/page.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Settings, Eye, EyeOff } from 'lucide-react';
import { CategoryCard } from './CategoryCard';
import { CategoryEditor } from './CategoryEditor';

export default function TagCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [editingCategory, setEditingCategory] = useState(null);
  const [showEditor, setShowEditor] = useState(false);

  return (
    <div className="container mx-auto py-8">
      {/* 页头 */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">标签分类管理</h1>
          <p className="text-gray-600 mt-2">
            管理标签分类和筛选器配置。拖拽可调整顺序。
          </p>
        </div>
        <Button onClick={() => setShowEditor(true)}>
          <Plus className="w-4 h-4 mr-2" />
          新建分类
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="总分类数"
          value={categories.length}
          icon={<Layers />}
        />
        <StatCard
          title="激活的分类"
          value={categories.filter(c => c.isActive).length}
          icon={<Eye />}
        />
        <StatCard
          title="筛选器中显示"
          value={categories.filter(c => c.showInFilter).length}
          icon={<Filter />}
        />
        <StatCard
          title="总标签数"
          value={categories.reduce((sum, c) => sum + c.tags.length, 0)}
          icon={<Tag />}
        />
      </div>

      {/* 分类列表 (可拖拽排序) */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="categories">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-4"
            >
              {categories.map((category, index) => (
                <Draggable
                  key={category.id}
                  draggableId={category.id}
                  index={index}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                    >
                      <CategoryCard
                        category={category}
                        onEdit={() => {
                          setEditingCategory(category);
                          setShowEditor(true);
                        }}
                        onToggleActive={() => toggleCategoryActive(category.id)}
                        onDelete={() => deleteCategory(category.id)}
                      />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* 编辑器模态框 */}
      <CategoryEditor
        category={editingCategory}
        open={showEditor}
        onClose={() => {
          setShowEditor(false);
          setEditingCategory(null);
        }}
        onSave={handleSaveCategory}
      />
    </div>
  );
}
```

---

#### 分类卡片组件

```tsx
// src/app/admin/tags/categories/CategoryCard.tsx
'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  GripVertical,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Settings,
  Tag as TagIcon,
} from 'lucide-react';

interface CategoryCardProps {
  category: TagCategory;
  onEdit: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
}

export function CategoryCard({
  category,
  onEdit,
  onToggleActive,
  onDelete,
}: CategoryCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-start gap-4">
        {/* 拖拽手柄 */}
        <div className="cursor-move mt-1">
          <GripVertical className="w-5 h-5 text-gray-400" />
        </div>

        {/* 图标 */}
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: category.color || '#e5e7eb' }}
        >
          {category.icon ? (
            <Icon name={category.icon} className="w-6 h-6" />
          ) : (
            <TagIcon className="w-6 h-6" />
          )}
        </div>

        {/* 主要内容 */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold">{category.name}</h3>
            {category.nameEn && (
              <span className="text-sm text-gray-500">{category.nameEn}</span>
            )}
            <Badge variant={category.isActive ? 'success' : 'secondary'}>
              {category.isActive ? '激活' : '停用'}
            </Badge>
            {category.isRequired && (
              <Badge variant="error">必选</Badge>
            )}
            {category.showInFilter && (
              <Badge variant="default">显示在筛选器</Badge>
            )}
          </div>

          <p className="text-gray-600 text-sm mb-4">
            {category.description || '暂无描述'}
          </p>

          {/* 配置信息 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <InfoItem label="标签数量" value={category.tags.length} />
            <InfoItem label="筛选器类型" value={getFilterTypeLabel(category.filterType)} />
            <InfoItem
              label="多选逻辑"
              value={category.multipleSelection ? (category.selectionLogic === 'OR' ? '任意匹配' : '全部匹配') : '单选'}
            />
            <InfoItem
              label="使用次数"
              value={category.tags.reduce((sum, t) => sum + t.usageCount, 0)}
            />
          </div>

          {/* 标签预览 */}
          <div className="flex flex-wrap gap-2">
            {category.tags.slice(0, 10).map(tag => (
              <Badge key={tag.id} variant="outline" className="text-xs">
                {tag.icon && <Icon name={tag.icon} className="w-3 h-3 mr-1" />}
                {tag.name}
              </Badge>
            ))}
            {category.tags.length > 10 && (
              <Badge variant="outline" className="text-xs">
                +{category.tags.length - 10} 更多
              </Badge>
            )}
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={onEdit}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={onToggleActive}
          >
            {category.isActive ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={onDelete}
            disabled={category.tags.length > 0}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

function InfoItem({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <div className="text-xs text-gray-500">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
```

---

#### 分类编辑器

```tsx
// src/app/admin/tags/categories/CategoryEditor.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { IconPicker } from '@/components/IconPicker';
import { ColorPicker } from '@/components/ColorPicker';

interface CategoryEditorProps {
  category?: TagCategory | null;
  open: boolean;
  onClose: () => void;
  onSave: (data: TagCategoryInput) => Promise<void>;
}

export function CategoryEditor({
  category,
  open,
  onClose,
  onSave,
}: CategoryEditorProps) {
  const [formData, setFormData] = useState<TagCategoryInput>({
    code: '',
    name: '',
    nameEn: '',
    description: '',
    icon: 'Tag',
    color: '#3b82f6',
    order: 0,
    isActive: true,
    isRequired: false,
    showInFilter: true,
    filterType: 'CHECKBOX',
    filterOrder: 0,
    filterCollapsible: false,
    filterDefaultOpen: true,
    maxSelections: null,
    multipleSelection: true,
    selectionLogic: 'OR',
    merchantCanSuggest: true,
  });

  useEffect(() => {
    if (category) {
      setFormData(category);
    }
  }, [category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {category ? '编辑标签分类' : '新建标签分类'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">基本信息</TabsTrigger>
              <TabsTrigger value="filter">筛选器配置</TabsTrigger>
              <TabsTrigger value="advanced">高级设置</TabsTrigger>
            </TabsList>

            {/* 基本信息 */}
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>分类代码 *</Label>
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="scene, style, price_range"
                    required
                    disabled={!!category}  // 编辑时不可修改
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    英文小写+下划线，创建后不可修改
                  </p>
                </div>

                <div>
                  <Label>排序</Label>
                  <Input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>中文名称 *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="使用场景"
                    required
                  />
                </div>

                <div>
                  <Label>英文名称</Label>
                  <Input
                    value={formData.nameEn || ''}
                    onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                    placeholder="Scene"
                  />
                </div>
              </div>

              <div>
                <Label>描述</Label>
                <Textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="描述这个分类的用途..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>图标</Label>
                  <IconPicker
                    value={formData.icon || 'Tag'}
                    onChange={(icon) => setFormData({ ...formData, icon })}
                  />
                </div>

                <div>
                  <Label>主题色</Label>
                  <ColorPicker
                    value={formData.color || '#3b82f6'}
                    onChange={(color) => setFormData({ ...formData, color })}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>是否激活</Label>
                  <p className="text-xs text-gray-500">停用后不会显示在前端</p>
                </div>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isActive: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>是否必选</Label>
                  <p className="text-xs text-gray-500">
                    套餐必须至少有一个此分类的标签
                  </p>
                </div>
                <Switch
                  checked={formData.isRequired}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isRequired: checked })
                  }
                />
              </div>
            </TabsContent>

            {/* 筛选器配置 */}
            <TabsContent value="filter" className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>显示在筛选器</Label>
                  <p className="text-xs text-gray-500">
                    是否在前端套餐列表的筛选器中显示
                  </p>
                </div>
                <Switch
                  checked={formData.showInFilter}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, showInFilter: checked })
                  }
                />
              </div>

              {formData.showInFilter && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>筛选器类型</Label>
                      <Select
                        value={formData.filterType}
                        onValueChange={(value) =>
                          setFormData({ ...formData, filterType: value })
                        }
                      >
                        <option value="CHECKBOX">复选框列表</option>
                        <option value="RADIO">单选按钮</option>
                        <option value="DROPDOWN">下拉选择器</option>
                        <option value="BUTTON_GROUP">按钮组</option>
                      </Select>
                    </div>

                    <div>
                      <Label>筛选器排序</Label>
                      <Input
                        type="number"
                        value={formData.filterOrder}
                        onChange={(e) =>
                          setFormData({ ...formData, filterOrder: parseInt(e.target.value) })
                        }
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        数字越小越靠前
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>支持多选</Label>
                      <p className="text-xs text-gray-500">
                        用户可以同时选择多个标签
                      </p>
                    </div>
                    <Switch
                      checked={formData.multipleSelection}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, multipleSelection: checked })
                      }
                    />
                  </div>

                  {formData.multipleSelection && (
                    <>
                      <div>
                        <Label>多选逻辑</Label>
                        <Select
                          value={formData.selectionLogic}
                          onValueChange={(value) =>
                            setFormData({ ...formData, selectionLogic: value })
                          }
                        >
                          <option value="OR">
                            OR - 任意匹配 (选中"街拍"或"约会"，两者都显示)
                          </option>
                          <option value="AND">
                            AND - 全部匹配 (必须同时满足所有条件)
                          </option>
                        </Select>
                      </div>

                      <div>
                        <Label>最大可选数量</Label>
                        <Input
                          type="number"
                          value={formData.maxSelections || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              maxSelections: e.target.value ? parseInt(e.target.value) : null,
                            })
                          }
                          placeholder="不限制"
                        />
                      </div>
                    </>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>可折叠</Label>
                      <p className="text-xs text-gray-500">
                        移动端或次要筛选器可折叠以节省空间
                      </p>
                    </div>
                    <Switch
                      checked={formData.filterCollapsible}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, filterCollapsible: checked })
                      }
                    />
                  </div>

                  {formData.filterCollapsible && (
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>默认展开</Label>
                        <p className="text-xs text-gray-500">
                          页面加载时是否默认展开
                        </p>
                      </div>
                      <Switch
                        checked={formData.filterDefaultOpen}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, filterDefaultOpen: checked })
                        }
                      />
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            {/* 高级设置 */}
            <TabsContent value="advanced" className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium mb-2">💡 使用建议</h4>
                <ul className="text-sm space-y-1 text-gray-700">
                  <li>• <strong>必选分类</strong>: 价格区间、服务等级等核心维度</li>
                  <li>• <strong>可折叠分类</strong>: 便利性特性、次要筛选器</li>
                  <li>• <strong>OR逻辑</strong>: 场景、风格 (用户可能想看多种)</li>
                  <li>• <strong>AND逻辑</strong>: 严格筛选条件 (必须全部满足)</li>
                </ul>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button type="submit">
              {category ? '保存修改' : '创建分类'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

---

### 3. 标签管理界面

```tsx
// src/app/admin/tags/page.tsx
'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Filter } from 'lucide-react';
import { TagCard } from './TagCard';
import { TagEditor } from './TagEditor';

export default function TagsPage() {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [editingTag, setEditingTag] = useState(null);

  const filteredTags = selectedCategory
    ? categories.find(c => c.id === selectedCategory)?.tags || []
    : categories.flatMap(c => c.tags);

  return (
    <div className="container mx-auto py-8">
      {/* 页头 */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">标签管理</h1>
          <p className="text-gray-600 mt-2">
            管理所有标签，商家将从这里选择标签为套餐打标
          </p>
        </div>
        <Button onClick={() => setShowEditor(true)}>
          <Plus className="w-4 h-4 mr-2" />
          新建标签
        </Button>
      </div>

      {/* 筛选栏 */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="搜索标签..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={selectedCategory || 'all'}
          onValueChange={(value) =>
            setSelectedCategory(value === 'all' ? null : value)
          }
        >
          <option value="all">所有分类</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.name} ({cat.tags.length})
            </option>
          ))}
        </Select>
      </div>

      {/* 标签网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTags
          .filter(tag =>
            tag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tag.code.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .map(tag => (
            <TagCard
              key={tag.id}
              tag={tag}
              onEdit={() => {
                setEditingTag(tag);
                setShowEditor(true);
              }}
              onDelete={() => deleteTag(tag.id)}
            />
          ))}
      </div>

      {/* 编辑器 */}
      <TagEditor
        tag={editingTag}
        categories={categories}
        open={showEditor}
        onClose={() => {
          setShowEditor(false);
          setEditingTag(null);
        }}
        onSave={handleSaveTag}
      />
    </div>
  );
}
```

---

## 商家功能

### 1. 商家套餐标签编辑

```tsx
// src/app/merchant/plans/[id]/tags/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Search, Plus, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function PlanTagsEditor({ params }: { params: { id: string } }) {
  const [plan, setPlan] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [params.id]);

  async function loadData() {
    // 加载套餐和标签数据
    const response = await fetch(`/api/merchant/plans/${params.id}/tags`);
    const data = await response.json();

    setPlan(data.plan);
    setCategories(data.categories);
    setSelectedTags(new Set(data.plan.tags.map(t => t.tagId)));
  }

  const toggleTag = (tagId: string, category: TagCategory) => {
    const newSelected = new Set(selectedTags);

    if (newSelected.has(tagId)) {
      newSelected.delete(tagId);
    } else {
      // 如果分类不支持多选，先删除同分类的其他标签
      if (!category.multipleSelection) {
        category.tags.forEach(tag => {
          if (newSelected.has(tag.id)) {
            newSelected.delete(tag.id);
          }
        });
      }

      // 检查最大可选数量
      if (category.maxSelections) {
        const categoryTags = Array.from(newSelected).filter(id =>
          category.tags.some(t => t.id === id)
        );
        if (categoryTags.length >= category.maxSelections) {
          toast.error(`最多只能选择 ${category.maxSelections} 个标签`);
          return;
        }
      }

      newSelected.add(tagId);
    }

    setSelectedTags(newSelected);
  };

  async function handleSave() {
    setSaving(true);
    try {
      // 验证必选分类
      const requiredCategories = categories.filter(c => c.isRequired);
      for (const category of requiredCategories) {
        const hasTag = category.tags.some(tag => selectedTags.has(tag.id));
        if (!hasTag) {
          toast.error(`请至少选择一个"${category.name}"标签`);
          setSaving(false);
          return;
        }
      }

      // 保存
      await fetch(`/api/merchant/plans/${params.id}/tags`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tagIds: Array.from(selectedTags),
        }),
      });

      toast.success('标签保存成功!');
    } catch (error) {
      toast.error('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="container mx-auto py-8">
      {/* 页头 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">编辑套餐标签</h1>
        <p className="text-gray-600">
          套餐: <strong>{plan?.name}</strong>
        </p>
        <p className="text-sm text-gray-500 mt-1">
          标签帮助游客更快找到您的套餐。标有"必选"的分类至少要选一个。
        </p>
      </div>

      {/* 搜索栏 */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="搜索标签..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* 已选标签 */}
      <Card className="p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium">已选标签 ({selectedTags.size})</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedTags(new Set())}
          >
            清空
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {selectedTags.size === 0 ? (
            <p className="text-gray-500 text-sm">还没有选择标签</p>
          ) : (
            categories.flatMap(cat =>
              cat.tags
                .filter(tag => selectedTags.has(tag.id))
                .map(tag => (
                  <Badge
                    key={tag.id}
                    variant="default"
                    className="cursor-pointer"
                    onClick={() => toggleTag(tag.id, cat)}
                  >
                    {tag.icon && <Icon name={tag.icon} className="w-3 h-3 mr-1" />}
                    {tag.name}
                    <X className="w-3 h-3 ml-1" />
                  </Badge>
                ))
            )
          )}
        </div>
      </Card>

      {/* 标签分类列表 */}
      <div className="space-y-6">
        {categories
          .filter(cat => cat.isActive)
          .map(category => (
            <Card key={category.id} className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: category.color || '#e5e7eb' }}
                >
                  {category.icon && <Icon name={category.icon} className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{category.name}</h3>
                    {category.isRequired && (
                      <Badge variant="error" className="text-xs">必选</Badge>
                    )}
                    {!category.multipleSelection && (
                      <Badge variant="secondary" className="text-xs">单选</Badge>
                    )}
                    {category.maxSelections && (
                      <Badge variant="secondary" className="text-xs">
                        最多{category.maxSelections}个
                      </Badge>
                    )}
                  </div>
                  {category.description && (
                    <p className="text-sm text-gray-600 mt-1">
                      {category.description}
                    </p>
                  )}
                </div>
                {/* 建议新标签按钮 */}
                {category.merchantCanSuggest && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openSuggestionDialog(category)}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    建议新标签
                  </Button>
                )}
              </div>

              {/* 标签网格 */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {category.tags
                  .filter(tag =>
                    tag.isActive &&
                    (searchQuery === '' ||
                      tag.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  )
                  .map(tag => (
                    <label
                      key={tag.id}
                      className={cn(
                        'flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all',
                        selectedTags.has(tag.id)
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <Checkbox
                        checked={selectedTags.has(tag.id)}
                        onCheckedChange={() => toggleTag(tag.id, category)}
                      />
                      {tag.icon && <Icon name={tag.icon} className="w-4 h-4" />}
                      <span className="text-sm font-medium">{tag.name}</span>
                      {tag.usageCount > 0 && (
                        <span className="text-xs text-gray-500 ml-auto">
                          {tag.usageCount}
                        </span>
                      )}
                    </label>
                  ))}
              </div>
            </Card>
          ))}
      </div>

      {/* 保存按钮 */}
      <div className="sticky bottom-0 bg-white border-t py-4 mt-8">
        <div className="container mx-auto flex justify-end gap-3">
          <Button variant="outline" onClick={() => router.back()}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? '保存中...' : '保存标签'}
          </Button>
        </div>
      </div>
    </div>
  );
}
```

---

### 2. 批量编辑标签

```tsx
// src/app/merchant/plans/bulk-tags/page.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

export default function BulkTagsEditor() {
  const [plans, setPlans] = useState([]);
  const [selectedPlans, setSelectedPlans] = useState<Set<string>>(new Set());
  const [tagsToAdd, setTagsToAdd] = useState<Set<string>>(new Set());
  const [tagsToRemove, setTagsToRemove] = useState<Set<string>>(new Set());

  const handleBulkUpdate = async () => {
    if (selectedPlans.size === 0) {
      toast.error('请至少选择一个套餐');
      return;
    }

    await fetch('/api/merchant/plans/bulk-tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        planIds: Array.from(selectedPlans),
        addTagIds: Array.from(tagsToAdd),
        removeTagIds: Array.from(tagsToRemove),
      }),
    });

    toast.success(`已更新 ${selectedPlans.size} 个套餐的标签`);
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">批量编辑标签</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧: 套餐列表 */}
        <Card className="p-4 lg:col-span-1">
          <h3 className="font-semibold mb-4">
            选择套餐 ({selectedPlans.size}/{plans.length})
          </h3>
          <div className="space-y-2">
            {plans.map(plan => (
              <label key={plan.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                <Checkbox
                  checked={selectedPlans.has(plan.id)}
                  onCheckedChange={(checked) => {
                    const newSelected = new Set(selectedPlans);
                    if (checked) {
                      newSelected.add(plan.id);
                    } else {
                      newSelected.delete(plan.id);
                    }
                    setSelectedPlans(newSelected);
                  }}
                />
                <span className="text-sm">{plan.name}</span>
              </label>
            ))}
          </div>
        </Card>

        {/* 右侧: 标签选择 */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-4">
            <h3 className="font-semibold mb-4">添加标签</h3>
            {/* 标签选择器 */}
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold mb-4">移除标签</h3>
            {/* 标签选择器 */}
          </Card>

          <Button onClick={handleBulkUpdate} className="w-full">
            批量更新
          </Button>
        </div>
      </div>
    </div>
  );
}
```

---

### 3. 标签使用帮助

商家在编辑标签时，如果遇到问题（如找不到合适的标签），可以通过以下方式联系管理员:

```tsx
// src/app/merchant/plans/[id]/tags/HelpButton.tsx
'use client';

import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';

export function TagHelpButton({ planId }: { planId: string }) {
  const handleContactAdmin = () => {
    // 打开帮助对话框或跳转到联系页面
    window.open(`/merchant/support?subject=标签问题&planId=${planId}`, '_blank');
  };

  return (
    <Button variant="outline" size="sm" onClick={handleContactAdmin}>
      <MessageCircle className="w-4 h-4 mr-2" />
      需要帮助？联系管理员
    </Button>
  );
}
```

**初期流程**:
1. 商家在编辑标签时遇到问题
2. 通过"联系管理员"按钮提交反馈
3. 管理员收到反馈后，手动创建新标签
4. 通知商家新标签已创建

**后期扩展**:
- 可开放 `TagSuggestion` 模型（已在schema中注释）
- 实现商家建议 + 管理员审核的完整流程

---

## API设计

### 管理员API

```typescript
// src/app/api/admin/tags/categories/route.ts

// GET: 获取所有分类
export async function GET(request: Request) {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') {
    return new Response('Unauthorized', { status: 401 });
  }

  const categories = await prisma.tagCategory.findMany({
    include: {
      tags: {
        orderBy: { order: 'asc' },
      },
    },
    orderBy: { order: 'asc' },
  });

  return Response.json(categories);
}

// POST: 创建分类
export async function POST(request: Request) {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') {
    return new Response('Unauthorized', { status: 401 });
  }

  const data = await request.json();

  // 验证code唯一性
  const existing = await prisma.tagCategory.findUnique({
    where: { code: data.code },
  });

  if (existing) {
    return Response.json(
      { error: '分类代码已存在' },
      { status: 400 }
    );
  }

  const category = await prisma.tagCategory.create({
    data,
  });

  return Response.json(category, { status: 201 });
}

// PUT: 更新分类
// DELETE: 删除分类
```

```typescript
// src/app/api/admin/tags/route.ts

// GET: 获取所有标签
// POST: 创建标签
// PUT: 更新标签
// DELETE: 删除标签
```

```typescript
// src/app/api/admin/tags/batch/route.ts

// POST: 批量操作标签
export async function POST(request: Request) {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') {
    return new Response('Unauthorized', { status: 401 });
  }

  const { action, tagIds } = await request.json();

  if (action === 'activate') {
    await prisma.tag.updateMany({
      where: { id: { in: tagIds } },
      data: { isActive: true },
    });
  } else if (action === 'deactivate') {
    await prisma.tag.updateMany({
      where: { id: { in: tagIds } },
      data: { isActive: false },
    });
  } else if (action === 'delete') {
    // 删除前检查是否有套餐在使用
    const usageCount = await prisma.planTag.count({
      where: { tagId: { in: tagIds } },
    });

    if (usageCount > 0) {
      return Response.json(
        { error: `无法删除，有 ${usageCount} 个套餐正在使用这些标签` },
        { status: 400 }
      );
    }

    await prisma.tag.deleteMany({
      where: { id: { in: tagIds } },
    });
  }

  return Response.json({ success: true });
}
```

---

### 商家API

```typescript
// src/app/api/merchant/plans/[id]/tags/route.ts

// GET: 获取套餐标签 + 可用标签列表
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const plan = await prisma.rentalPlan.findUnique({
    where: { id: params.id },
    include: {
      tags: {
        include: {
          tag: {
            include: {
              category: true,
            },
          },
        },
      },
    },
  });

  // 验证所有权 (商家只能编辑自己的套餐)
  if (session.user.role === 'MERCHANT') {
    const merchant = await prisma.merchant.findUnique({
      where: { userId: session.user.id },
    });

    if (!merchant || plan.merchantId !== merchant.id) {
      return new Response('Forbidden', { status: 403 });
    }
  }

  // 获取所有可用标签分类
  const categories = await prisma.tagCategory.findMany({
    where: { isActive: true },
    include: {
      tags: {
        where: { isActive: true },
        orderBy: { order: 'asc' },
      },
    },
    orderBy: { order: 'asc' },
  });

  return Response.json({
    plan,
    categories,
  });
}

// PUT: 更新套餐标签
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { tagIds } = await request.json();

  // 验证所有权
  // ...

  // 删除现有标签
  await prisma.planTag.deleteMany({
    where: { planId: params.id },
  });

  // 添加新标签
  await prisma.planTag.createMany({
    data: tagIds.map((tagId: string) => ({
      planId: params.id,
      tagId,
      addedBy: session.user.id,
    })),
  });

  // 更新标签使用统计
  await prisma.tag.updateMany({
    where: { id: { in: tagIds } },
    data: {
      usageCount: { increment: 1 },
    },
  });

  return Response.json({ success: true });
}
```

```typescript
// src/app/api/merchant/plans/bulk-tags/route.ts

// POST: 批量更新标签
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { planIds, addTagIds, removeTagIds } = await request.json();

  // 验证所有套餐都属于当前商家
  // ...

  // 批量添加标签
  if (addTagIds.length > 0) {
    const data = planIds.flatMap((planId: string) =>
      addTagIds.map((tagId: string) => ({
        planId,
        tagId,
        addedBy: session.user.id,
      }))
    );

    await prisma.planTag.createMany({
      data,
      skipDuplicates: true,
    });
  }

  // 批量删除标签
  if (removeTagIds.length > 0) {
    await prisma.planTag.deleteMany({
      where: {
        planId: { in: planIds },
        tagId: { in: removeTagIds },
      },
    });
  }

  return Response.json({ success: true });
}
```


---

## 实施路线图

> **简化版路线图** - 初期只实现平台统一管理，商家建议功能留待后期扩展

### Phase 1: 数据模型与种子数据 (2-3天)

**任务**:
- [ ] 扩展 Prisma schema
  - [ ] TagCategory 模型
  - [ ] Tag 模型
  - [ ] PlanTag 模型
  - [ ] ~~TagSuggestion 模型~~ (注释掉，后期扩展)
- [ ] 创建数据库迁移
- [ ] 编写种子脚本，初始化7大标签分类和50+标签

**产出**:
- 完整的标签系统数据模型
- 初始化的标签数据

---

### Phase 2: 管理员功能 (5-7天)

**任务**:
- [ ] 标签分类管理页面
  - [ ] 分类列表（可拖拽排序）
  - [ ] 创建/编辑/删除分类
  - [ ] 筛选器配置界面
- [ ] 标签管理页面
  - [ ] 标签列表（按分类筛选）
  - [ ] 创建/编辑/删除标签
  - [ ] 批量激活/停用标签
- [ ] ~~标签建议审核页面~~ (V2功能)
- [ ] API实现
  - [ ] `/api/admin/tags/categories` - CRUD
  - [ ] `/api/admin/tags` - CRUD
  - [ ] `/api/admin/tags/batch` - 批量操作

**产出**:
- 完整的管理员标签管理界面
- 所有管理员API

---

### Phase 3: 商家功能 (3-4天)

**任务**:
- [ ] 套餐标签编辑页面
  - [ ] 标签选择器（按分类展示）
  - [ ] 已选标签预览
  - [ ] 保存/取消
  - [ ] ~~建议新标签按钮~~ (V2功能，暂时只提供"联系管理员"按钮)
- [ ] 批量编辑标签功能
- [ ] API实现
  - [ ] `/api/merchant/plans/[id]/tags` - GET/PUT
  - [ ] `/api/merchant/plans/bulk-tags` - POST

**产出**:
- 商家标签编辑界面
- 商家标签API

---

### Phase 4: 前端筛选器集成 (2-3天)

**任务**:
- [ ] 更新 `PlansClient.tsx` 筛选器
  - [ ] 从数据库读取筛选器配置
  - [ ] 根据配置动态渲染筛选组件
  - [ ] 支持多选逻辑（OR/AND）
- [ ] 更新 `PlanCard.tsx`
  - [ ] 显示套餐标签
  - [ ] 标签图标和颜色
- [ ] 首页场景快速入口
  - [ ] 场景卡片组件
  - [ ] 跳转到预筛选的列表页

**产出**:
- 完全基于配置的筛选器系统
- 标签在前端的完整展示

---

### Phase 5: 数据迁移 (2-3天)

**任务**:
- [ ] 分析现有967个套餐数据
- [ ] 编写智能标签推断脚本
- [ ] 批量为套餐打标签
- [ ] 管理员人工审核高优先级套餐（前100个）
- [ ] 调整标签系统（根据实际情况增删标签）

**产出**:
- 所有套餐完成标签标注
- 标签系统优化完成

---

### Phase 6: 测试与优化 (2天)

**任务**:
- [ ] 功能测试
  - [ ] 管理员创建/编辑标签
  - [ ] 商家编辑套餐标签
  - [ ] 前端筛选器功能
- [ ] 性能测试
  - [ ] 查询响应时间
  - [ ] 缓存命中率
- [ ] 用户体验优化
  - [ ] UI/UX调整
  - [ ] 错误提示优化

**产出**:
- 测试报告
- 优化建议

---

### 总计时间

**MVP版本**: 约 **16-22天** (3-4周)

**时间分配**:
- 后端开发: 40% (8-9天)
- 前端开发: 35% (6-7天)
- 数据迁移: 15% (3天)
- 测试优化: 10% (2天)

---

### V2 扩展功能 (后期，可选)

如果未来需要开放商家建议功能，可以在此基础上快速扩展:

**额外工作量**: 约5-7天
- [ ] 启用 `TagSuggestion` 模型
- [ ] 商家建议标签界面
- [ ] 管理员审核界面
- [ ] 通知系统
- [ ] API实现

---

## 总结

### 核心优势

这个**简化版标签管理系统**的核心优势:

1. **平台统一标准化**: 所有标签由管理员统一创建和管理，确保一致性
2. **商家自主选择**: 商家可以为自己的套餐选择标签，无需等待管理员
3. **零代码配置**: 筛选器的显示、排序、逻辑完全通过UI配置
4. **灵活扩展**: 新增筛选维度只需在管理界面操作，不需要修改代码
5. **可选升级**: 后期可轻松扩展商家建议功能

---

### 与原设计的区别

| 维度 | 完整版（原设计） | 简化版（当前） |
|------|----------------|--------------|
| **标签创建** | 管理员 + 商家建议 | 仅管理员 |
| **实施时间** | 3-4周 | 3-4周 |
| **复杂度** | 中高 | 中 |
| **标准化程度** | 中（需要审核控制） | 高（完全统一） |
| **商家参与度** | 高（可建议） | 中（只能选择） |
| **维护成本** | 中（需审核商家建议） | 低（管理员全权） |
| **扩展性** | 已包含扩展功能 | 预留扩展接口 |

---

### 适用场景

**简化版适合**:
- ✅ 初期阶段，需要快速建立标准化体系
- ✅ 商家数量较少（< 50个）
- ✅ 套餐类型相对固定
- ✅ 强调平台控制和一致性

**需要升级到完整版时**:
- ⚠️ 商家数量增长（> 100个）
- ⚠️ 套餐类型多样化，标签需求频繁变化
- ⚠️ 商家需要更多自主权
- ⚠️ 管理员精力不足以覆盖所有标签需求

---

### 设计哲学

> "先标准化，再个性化。初期由平台统一标准，待体系成熟后再开放商家参与。"

这个设计完全符合您提出的"标准化套餐"理念：
- 避免商家乱加标签导致混乱
- 保持平台统一的筛选体验
- 为后期扩展预留空间

---

**下一步行动**:
1. 确认此设计方案
2. 开始 Phase 1: 数据模型设计
3. 准备初始标签分类和标签数据

有任何问题或需要调整的地方吗？