import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiHeader,
  ApiConsumes,
  ApiProduces,
} from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from './services/auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Public } from './decorators/public.decorator';
import {
  RegisterDto,
  LoginDto,
  SendCodeDto,
  VerifyCodeDto,
  ResetPasswordDto,
  AuthResponseDto,
} from '../dto/auth.dto';

@ApiTags('Auth')
@Controller({
  path: 'api/auth',
  version: '1'
})
@UseGuards(JwtAuthGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '用户注册',
    description: '用户注册需要先通过邮箱或手机号验证码验证。支持的注册类型：email_code（邮箱验证码）、phone_code（手机验证码）。为了安全考虑，不再支持纯用户名密码注册。',
    tags: ['Auth']
  })
  @ApiConsumes('application/json')
  @ApiProduces('application/json')
  @ApiResponse({
    status: 201,
    description: '注册成功，返回访问令牌和用户信息',
    type: AuthResponseDto,
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          username: 'testuser',
          email: 'user@example.com',
          phone: '13800138000',
          countryCode: '+86',
          createdAt: '2024-01-01T00:00:00.000Z'
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: '请求参数错误或使用了不支持的注册方式',
    schema: {
      example: {
        statusCode: 400,
        message: ['邮箱格式不正确', '密码必须包含至少一个字母和一个数字'],
        error: 'Bad Request'
      }
    }
  })
  @ApiResponse({
    status: 409,
    description: '用户已存在',
    schema: {
      example: {
        statusCode: 409,
        message: '该邮箱已被注册',
        error: 'Conflict'
      }
    }
  })
  @ApiResponse({
    status: 422,
    description: '验证码错误或已过期',
    schema: {
      example: {
        statusCode: 422,
        message: '验证码错误或已过期',
        error: 'Unprocessable Entity'
      }
    }
  })
  @ApiBody({
    type: RegisterDto,
    description: '注册请求参数',
    examples: {
      email_code: {
        summary: '邮箱验证码注册',
        description: '使用邮箱验证码进行注册',
        value: {
          type: 'email_code',
          email: 'user@example.com',
          username: 'testuser',
          password: 'password123',
          code: '123456'
        }
      },
      phone_code: {
        summary: '手机验证码注册',
        description: '使用手机验证码进行注册',
        value: {
          type: 'phone_code',
          phone: '13800138000',
          countryCode: '+86',
          username: 'testuser',
          password: 'password123',
          code: '123456'
        }
      }
    }
  })
  @ApiHeader({
    name: 'Content-Type',
    description: '请求内容类型',
    required: true,
    schema: {
      type: 'string',
      default: 'application/json'
    }
  })
  async register(
    @Body(ValidationPipe) registerDto: RegisterDto,
    @Req() req: Request,
  ): Promise<AuthResponseDto> {
    const ip = this.getClientIp(req);
    const userAgent = req.get('User-Agent');
    return await this.authService.register(registerDto, ip, userAgent);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '用户登录',
    description: '支持多种登录方式：用户名密码、邮箱密码、手机密码、邮箱验证码、手机验证码。根据不同的登录类型提供相应的参数。',
    tags: ['Auth']
  })
  @ApiConsumes('application/json')
  @ApiProduces('application/json')
  @ApiResponse({
    status: 200,
    description: '登录成功，返回访问令牌和用户信息',
    type: AuthResponseDto,
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          username: 'testuser',
          email: 'user@example.com',
          phone: '13800138000',
          countryCode: '+86',
          createdAt: '2024-01-01T00:00:00.000Z'
        }
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: '认证失败，用户名/密码错误或验证码无效',
    schema: {
      example: {
        statusCode: 401,
        message: '用户名或密码错误',
        error: 'Unauthorized'
      }
    }
  })
  @ApiResponse({
    status: 429,
    description: '登录尝试过于频繁，请稍后再试',
    schema: {
      example: {
        statusCode: 429,
        message: '登录尝试过于频繁，请5分钟后再试',
        error: 'Too Many Requests'
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: '用户不存在',
    schema: {
      example: {
        statusCode: 404,
        message: '用户不存在',
        error: 'Not Found'
      }
    }
  })
  @ApiBody({
    type: LoginDto,
    description: '登录请求参数',
    examples: {
      username_password: {
        summary: '用户名密码登录',
        description: '使用用户名和密码进行登录',
        value: {
          type: 'username_password',
          username: 'testuser',
          password: 'password123'
        }
      },
      email_password: {
        summary: '邮箱密码登录',
        description: '使用邮箱和密码进行登录',
        value: {
          type: 'email_password',
          email: 'user@example.com',
          password: 'password123'
        }
      },
      phone_password: {
        summary: '手机密码登录',
        description: '使用手机号和密码进行登录',
        value: {
          type: 'phone_password',
          phone: '13800138000',
          countryCode: '+86',
          password: 'password123'
        }
      },
      email_code: {
        summary: '邮箱验证码登录',
        description: '使用邮箱验证码进行登录',
        value: {
          type: 'email_code',
          email: 'user@example.com',
          code: '123456'
        }
      },
      phone_code: {
        summary: '手机验证码登录',
        description: '使用手机验证码进行登录',
        value: {
          type: 'phone_code',
          phone: '13800138000',
          countryCode: '+86',
          code: '123456'
        }
      }
    }
  })
  @ApiHeader({
    name: 'Content-Type',
    description: '请求内容类型',
    required: true,
    schema: {
      type: 'string',
      default: 'application/json'
    }
  })
  @ApiHeader({
    name: 'User-Agent',
    description: '用户代理信息',
    required: false,
    schema: {
      type: 'string',
      example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  })
  async login(
    @Body(ValidationPipe) loginDto: LoginDto,
    @Req() req: Request,
  ): Promise<AuthResponseDto> {
    const ip = this.getClientIp(req);
    const userAgent = req.get('User-Agent');
    return await this.authService.login(loginDto, ip, userAgent);
  }

  @Public()
  @Post('send-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '发送验证码',
    description: '向指定的邮箱或手机号发送验证码。支持注册、登录、重置密码等场景。发送频率限制：同一目标60秒内只能发送一次。验证码有效期为5分钟。',
    tags: ['Auth']
  })
  @ApiConsumes('application/json')
  @ApiProduces('application/json')
  @ApiResponse({
    status: 200,
    description: '验证码发送成功，请查收邮箱或短信',
    schema: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          description: '发送是否成功',
          example: true
        },
        message: {
          type: 'string',
          description: '发送结果消息',
          example: '验证码已发送，请查收'
        },
      },
      example: {
        success: true,
        message: '验证码已发送到您的邮箱，请查收'
      }
    },
  })
  @ApiResponse({
    status: 400,
    description: '请求参数错误，邮箱或手机号格式不正确',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: '邮箱格式不正确' },
        statusCode: { type: 'number', example: 400 },
        error: { type: 'string', example: 'Bad Request' }
      },
      example: {
        success: false,
        message: '邮箱格式不正确',
        statusCode: 400,
        error: 'Bad Request'
      }
    },
  })
  @ApiResponse({
    status: 429,
    description: '发送过于频繁，请稍后再试',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: '发送过于频繁，请60秒后再试' },
        statusCode: { type: 'number', example: 429 },
        error: { type: 'string', example: 'Too Many Requests' }
      },
      example: {
        success: false,
        message: '发送过于频繁，请60秒后再试',
        statusCode: 429,
        error: 'Too Many Requests'
      }
    },
  })
  @ApiResponse({
    status: 500,
    description: '服务器内部错误，验证码发送失败',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: '验证码发送失败，请稍后重试' },
        statusCode: { type: 'number', example: 500 },
        error: { type: 'string', example: 'Internal Server Error' }
      },
      example: {
        success: false,
        message: '验证码发送失败，请稍后重试',
        statusCode: 500,
        error: 'Internal Server Error'
      }
    },
  })
  @ApiBody({
    type: SendCodeDto,
    description: '发送验证码请求参数。target可以是邮箱或手机号，当为手机号时需要提供countryCode。',
    examples: {
      email_register: {
        summary: '邮箱注册验证码',
        description: '为邮箱注册发送验证码，用于新用户注册验证',
        value: {
          target: 'user@example.com',
          type: 'register',
        },
      },
      phone_register: {
        summary: '手机注册验证码',
        description: '为手机号注册发送验证码，用于新用户注册验证',
        value: {
          target: '13800138000',
          type: 'register',
          countryCode: '+86',
        },
      },
      email_login: {
        summary: '邮箱登录验证码',
        description: '为邮箱登录发送验证码，用于免密登录',
        value: {
          target: 'user@example.com',
          type: 'login',
        },
      },
      phone_login: {
        summary: '手机登录验证码',
        description: '为手机号登录发送验证码，用于免密登录',
        value: {
          target: '13800138000',
          type: 'login',
          countryCode: '+86',
        },
      },
      reset_password: {
        summary: '重置密码验证码',
        description: '为重置密码发送验证码，用于找回密码',
        value: {
          target: 'user@example.com',
          type: 'reset_password',
        },
      },
    },
  })
  @ApiHeader({
    name: 'Content-Type',
    description: '请求内容类型',
    required: true,
    schema: {
      type: 'string',
      default: 'application/json'
    }
  })
  @ApiHeader({
    name: 'User-Agent',
    description: '用户代理信息',
    required: false,
    schema: {
      type: 'string',
      example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  })
  async sendCode(
    @Body(ValidationPipe) sendCodeDto: SendCodeDto,
    @Req() req: Request,
  ): Promise<{ success: boolean; message: string }> {
    const ip = this.getClientIp(req);
    const userAgent = req.get('User-Agent');
    return await this.authService.sendCode(sendCodeDto, ip, userAgent);
  }

  @Public()
  @Post('verify-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '验证验证码',
    description: '验证邮箱或手机号收到的验证码是否正确。用于注册、登录、重置密码等场景的验证码校验。',
    tags: ['Auth']
  })
  @ApiConsumes('application/json')
  @ApiProduces('application/json')
  @ApiResponse({
    status: 200,
    description: '验证码验证结果',
    schema: {
      type: 'object',
      properties: {
        valid: { type: 'boolean', description: '验证码是否有效' },
        message: { type: 'string', description: '验证结果消息' },
      },
      example: {
        valid: true,
        message: '验证码验证成功'
      }
    },
  })
  @ApiResponse({
    status: 400,
    description: '请求参数错误',
    schema: {
      example: {
        statusCode: 400,
        message: ['验证码至少4位', '目标不能为空'],
        error: 'Bad Request'
      }
    }
  })
  @ApiResponse({
    status: 422,
    description: '验证码错误或已过期',
    schema: {
      example: {
        valid: false,
        message: '验证码错误或已过期'
      }
    }
  })
  @ApiBody({
    type: VerifyCodeDto,
    description: '验证码验证请求参数',
    examples: {
      email_verify: {
        summary: '邮箱验证码验证',
        description: '验证邮箱收到的验证码',
        value: {
          target: 'user@example.com',
          code: '123456',
          type: 'register'
        }
      },
      phone_verify: {
        summary: '手机验证码验证',
        description: '验证手机收到的验证码',
        value: {
          target: '13800138000',
          code: '123456',
          type: 'login'
        }
      }
    }
  })
  async verifyCode(
    @Body(ValidationPipe) verifyCodeDto: VerifyCodeDto,
  ): Promise<{ valid: boolean; message: string }> {
    return await this.authService.verifyCode(verifyCodeDto);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '重置密码',
    description: '通过验证码重置用户密码。需要先调用发送验证码接口获取验证码，然后提供验证码和新密码完成重置。',
    tags: ['Auth']
  })
  @ApiConsumes('application/json')
  @ApiProduces('application/json')
  @ApiResponse({
    status: 200,
    description: '密码重置成功',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', description: '重置是否成功' },
        message: { type: 'string', description: '重置结果消息' },
      },
      example: {
        success: true,
        message: '密码重置成功'
      }
    },
  })
  @ApiResponse({
    status: 400,
    description: '请求参数错误',
    schema: {
      example: {
        statusCode: 400,
        message: ['密码必须包含至少一个字母和一个数字', '验证码至少4位'],
        error: 'Bad Request'
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: '用户不存在',
    schema: {
      example: {
        statusCode: 404,
        message: '用户不存在',
        error: 'Not Found'
      }
    }
  })
  @ApiResponse({
    status: 422,
    description: '验证码错误或已过期',
    schema: {
      example: {
        statusCode: 422,
        message: '验证码错误或已过期',
        error: 'Unprocessable Entity'
      }
    }
  })
  @ApiBody({
    type: ResetPasswordDto,
    description: '重置密码请求参数',
    examples: {
      email_reset: {
        summary: '邮箱重置密码',
        description: '通过邮箱验证码重置密码',
        value: {
          target: 'user@example.com',
          code: '123456',
          newPassword: 'newPassword123'
        }
      },
      phone_reset: {
        summary: '手机重置密码',
        description: '通过手机验证码重置密码',
        value: {
          target: '13800138000',
          code: '123456',
          newPassword: 'newPassword123'
        }
      }
    }
  })
  async resetPassword(
    @Body(ValidationPipe) resetPasswordDto: ResetPasswordDto,
    @Req() req: Request,
  ): Promise<{ success: boolean; message: string }> {
    const ip = this.getClientIp(req);
    const userAgent = req.get('User-Agent');
    return await this.authService.resetPassword(resetPasswordDto, ip, userAgent);
  }

  @Public()
  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '刷新访问令牌',
    description: '使用刷新令牌获取新的访问令牌。当访问令牌过期时，可以使用此接口获取新的访问令牌而无需重新登录。',
    tags: ['Auth']
  })
  @ApiConsumes('application/json')
  @ApiProduces('application/json')
  @ApiResponse({
    status: 200,
    description: '令牌刷新成功，返回新的访问令牌',
    schema: {
      type: 'object',
      properties: {
        accessToken: {
          type: 'string',
          description: '新的访问令牌',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
        },
      },
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
      }
    },
  })
  @ApiResponse({
    status: 401,
    description: '刷新令牌无效或已过期',
    schema: {
      example: {
        statusCode: 401,
        message: '刷新令牌无效或已过期',
        error: 'Unauthorized'
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: '请求参数错误',
    schema: {
      example: {
        statusCode: 400,
        message: '刷新令牌不能为空',
        error: 'Bad Request'
      }
    }
  })
  @ApiBody({
    description: '刷新令牌请求参数',
    schema: {
      type: 'object',
      properties: {
        refreshToken: {
          type: 'string',
          description: '刷新令牌',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
        },
      },
      required: ['refreshToken'],
    },
    examples: {
      refresh: {
        summary: '刷新访问令牌',
        description: '使用有效的刷新令牌获取新的访问令牌',
        value: {
          refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
        }
      }
    }
  })
  async refreshToken(
    @Body('refreshToken') refreshToken: string,
  ): Promise<{ accessToken: string }> {
    return await this.authService.refreshToken(refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '退出登录',
    description: '用户退出登录。由于JWT是无状态的，客户端删除token即可完成退出。如果需要实现token黑名单，可以在服务端添加相应逻辑。',
    tags: ['Auth']
  })
  @ApiConsumes('application/json')
  @ApiProduces('application/json')
  @ApiResponse({
    status: 200,
    description: '退出登录成功',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', description: '退出是否成功' },
        message: { type: 'string', description: '退出结果消息' },
      },
      example: {
        success: true,
        message: '退出登录成功'
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: '未授权，访问令牌无效或已过期',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
        error: 'Unauthorized'
      }
    }
  })
  @ApiBearerAuth()
  async logout(): Promise<{ success: boolean; message: string }> {
    // JWT是无状态的，客户端删除token即可
    // 如果需要实现token黑名单，可以在这里添加逻辑
    return {
      success: true,
      message: '退出登录成功',
    };
  }



  private getClientIp(req: Request): string {
    return (
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      (req.headers['x-real-ip'] as string) ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      '127.0.0.1'
    );
  }
}