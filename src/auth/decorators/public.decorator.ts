/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-08-10 01:46:53
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-09-12 19:34:39
 * @FilePath: /lulab_backend/src/auth/decorators/public.decorator.ts
 * @Description:
 *
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved.
 */

import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
