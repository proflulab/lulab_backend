/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-07-07 02:27:45
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-07-28 13:16:54
 * @FilePath: /lulab_backend/src/auth/decorators/user.decorator.ts
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentUser {
  id: string;
  username?: string;
  email?: string;
  phone?: string;
  profile?: any;
}

export const User = createParamDecorator(
  (data: keyof CurrentUser | undefined, ctx: ExecutionContext): CurrentUser | any => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);