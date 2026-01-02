/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-12-31 21:03:49
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2026-01-03 06:31:16
 * @FilePath: /lulab_backend/prisma/seeds/index.ts
 * @Description: 
 * 
 * Copyright (c) 2026 by LuLab-Team, All Rights Reserved. 
 */
// ==================== 基础数据模块 ====================

// 用户相关
export { createUsers } from './users';
export type { CreatedUsers } from './users';

// 组织相关
export { createOrganization } from './organization';

// 部门相关
export {
  createDepartments,
  createUserDepartmentRelations,
} from './departments';
export type { CreatedDepartments } from './departments';

// 权限相关
export { createPermissions } from './permissions';
export type { CreatedPermissions } from './permissions';

// ==================== 业务数据模块 ====================

// 产品相关
export { createProducts } from './products';
export type { CreatedProducts } from './products';

// 项目相关
export { createProjects } from './projects';
export type { CreatedProjects } from './projects';

// 课程相关
export { createCurriculums } from './curriculums';
export type {
  CreatedCurriculums,
  CreateCurriculumsParams,
} from './curriculums';

// 渠道相关
export { createChannels } from './channels';
export type { CreatedChannels } from './channels';

// ==================== 交易数据模块 ====================

// 订单相关
export { createOrders } from './orders';

// 退款相关
export { createRefunds } from './refunds';

// ==================== 会议数据模块 ====================

// 会议相关
export { createMeetings } from './meetings';
export type { CreatedMeetings } from './meetings';

// ==================== 关系数据模块 ====================

// 关联关系相关
export {
  createUserOrganizationRelations,
  createRolePermissionRelations,
  createUserPermissionRelations,
  createAllRelations,
} from './relations';
