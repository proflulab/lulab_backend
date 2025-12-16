/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-12-16 10:00:00
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-12-16 10:00:00
 * @FilePath: /lulab_backend/prisma/seeds/curriculums.ts
 * @Description: 课程数据种子模块 - 优化版本
 *
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved.
 */

import { PrismaClient, Curriculum, Project, Prisma } from '@prisma/client';

// ==================== 类型定义 ====================

/**
 * 创建课程所需的参数
 */
export interface CreateCurriculumsParams {
  projects: Project[];
}

/**
 * 创建课程后返回的数据
 */
export interface CreatedCurriculums {
  curriculums: Curriculum[];
}

/**
 * 课程配置数据类型
 */
interface CurriculumConfig {
  id: string;
  projectId: string;
  title: string;
  description: string;
  week: number;
  topics: string[];
  goals: string[];
}

// ==================== 课程配置数据 ====================

/**
 * 课程配置数据
 * 注意: topics 和 goals 在存储时会转换为 JSON 格式
 */
const CURRICULUM_CONFIGS: CurriculumConfig[] = [
  // Python数据分析实战项目课程
  {
    id: 'curr_001_01',
    projectId: 'proj_001',
    title: 'Python基础与环境搭建',
    description:
      '学习Python基础语法，搭建开发环境，了解Jupyter Notebook的使用',
    week: 1,
    topics: [
      'Python安装与配置',
      '基础语法学习',
      'Jupyter Notebook使用',
      '变量与数据类型',
      '控制流程',
    ],
    goals: [
      '能够搭建Python开发环境',
      '掌握Python基础语法',
      '熟练使用Jupyter Notebook',
      '理解变量和数据类型概念',
    ],
  },
  {
    id: 'curr_001_02',
    projectId: 'proj_001',
    title: 'NumPy数组操作',
    description: '学习NumPy库的使用，掌握数组操作和数学运算',
    week: 2,
    topics: [
      'NumPy数组创建',
      '数组索引与切片',
      '数组运算',
      '广播机制',
      '常用数学函数',
    ],
    goals: [
      '掌握NumPy数组操作',
      '理解广播机制',
      '能够进行数组运算',
      '熟练使用数学函数',
    ],
  },
  {
    id: 'curr_001_03',
    projectId: 'proj_001',
    title: 'Pandas数据处理',
    description: '学习Pandas库进行数据处理，包括数据读取、清洗和转换',
    week: 3,
    topics: [
      'DataFrame和Series',
      '数据读取与保存',
      '数据选择与过滤',
      '数据清洗技巧',
      '数据合并与连接',
    ],
    goals: [
      '掌握Pandas基本操作',
      '能够读取各种格式数据',
      '掌握数据清洗技巧',
      '理解数据合并方法',
    ],
  },
  {
    id: 'curr_001_04',
    projectId: 'proj_001',
    title: '数据可视化基础',
    description: '使用Matplotlib和Seaborn进行数据可视化',
    week: 4,
    topics: [
      'Matplotlib基础绘图',
      'Seaborn统计图表',
      '图表美化技巧',
      '交互式图表',
      '图表保存与导出',
    ],
    goals: [
      '掌握基础绘图技能',
      '能够创建统计图表',
      '掌握图表美化方法',
      '理解可视化设计原则',
    ],
  },
  // 机器学习算法实践课程
  {
    id: 'curr_002_01',
    projectId: 'proj_002',
    title: '机器学习概述',
    description: '机器学习基本概念、分类和应用场景介绍',
    week: 1,
    topics: [
      '机器学习定义与分类',
      '监督学习vs无监督学习',
      '机器学习工作流程',
      '常见应用场景',
      '评估指标介绍',
    ],
    goals: [
      '理解机器学习基本概念',
      '掌握学习类型分类',
      '了解工作流程',
      '认识评估指标',
    ],
  },
  {
    id: 'curr_002_02',
    projectId: 'proj_002',
    title: '线性回归与逻辑回归',
    description: '学习线性回归和逻辑回归算法的原理与实现',
    week: 2,
    topics: [
      '线性回归原理',
      '最小二乘法',
      '逻辑回归原理',
      '梯度下降算法',
      'scikit-learn实现',
    ],
    goals: [
      '理解回归算法原理',
      '掌握梯度下降方法',
      '能够实现回归模型',
      '理解模型评估方法',
    ],
  },
  // 深度学习与神经网络课程
  {
    id: 'curr_003_01',
    projectId: 'proj_003',
    title: '神经网络基础',
    description: '神经网络的基本原理和前向传播、反向传播算法',
    week: 1,
    topics: [
      '感知机模型',
      '多层感知机',
      '激活函数',
      '前向传播',
      '反向传播算法',
    ],
    goals: [
      '理解神经网络结构',
      '掌握前向传播过程',
      '理解反向传播原理',
      '熟悉激活函数作用',
    ],
  },
  // Web全栈开发实战课程
  {
    id: 'curr_004_01',
    projectId: 'proj_004',
    title: 'React基础与组件开发',
    description: '学习React基础概念，掌握组件开发技巧',
    week: 1,
    topics: [
      'React环境搭建',
      'JSX语法',
      '组件概念',
      'Props和State',
      '事件处理',
    ],
    goals: [
      '掌握React基础概念',
      '能够创建React组件',
      '理解Props和State',
      '掌握事件处理方法',
    ],
  },
  {
    id: 'curr_004_02',
    projectId: 'proj_004',
    title: 'Node.js后端开发',
    description: '学习Node.js后端开发，包括Express框架和API设计',
    week: 5,
    topics: [
      'Node.js基础',
      'Express框架',
      'RESTful API设计',
      '中间件使用',
      '错误处理',
    ],
    goals: [
      '掌握Node.js基础',
      '能够使用Express框架',
      '理解RESTful API设计',
      '掌握中间件概念',
    ],
  },
  // 移动应用开发课程
  {
    id: 'curr_005_01',
    projectId: 'proj_005',
    title: 'React Native入门',
    description: '学习React Native基础，搭建移动开发环境',
    week: 1,
    topics: [
      'React Native环境搭建',
      '基础组件介绍',
      '样式系统',
      '导航系统',
      '调试技巧',
    ],
    goals: [
      '搭建React Native环境',
      '掌握基础组件使用',
      '理解样式系统',
      '掌握导航配置',
    ],
  },
];

// ==================== 辅助函数 ====================

/**
 * 将课程配置转换为 Prisma 创建输入格式
 * topics 和 goals 转换为 JSON 格式以符合 Prisma 模型定义
 */
function convertToCurriculumCreateInput(
  config: CurriculumConfig,
): Prisma.CurriculumUncheckedCreateInput {
  return {
    id: config.id,
    projectId: config.projectId,
    title: config.title,
    description: config.description,
    week: config.week,
    topics: config.topics as unknown as Prisma.InputJsonValue,
    goals: config.goals as unknown as Prisma.InputJsonValue,
  };
}

// ==================== 主函数 ====================

/**
 * 创建课程数据
 * 
 * @param prisma - Prisma 客户端实例
 * @param params - 创建参数，包含项目列表
 * @returns 创建的课程数据
 */
export async function createCurriculums(
  prisma: PrismaClient,
  { projects }: CreateCurriculumsParams,
): Promise<CreatedCurriculums> {
  console.log('📖 开始创建课程数据...');

  try {
    // 并行创建所有课程
    const curriculumPromises = CURRICULUM_CONFIGS.map((config) => {
      const createInput = convertToCurriculumCreateInput(config);

      return prisma.curriculum.upsert({
        where: { id: config.id },
        update: createInput,
        create: createInput,
      });
    });

    const curriculums = await Promise.all(curriculumPromises);

    // 输出创建结果
    curriculums.forEach((curriculum) => {
      console.log(`✅ 创建课程: ${curriculum.title} (第${curriculum.week}周)`);
    });

    console.log(`📚 课程数据创建完成，共 ${curriculums.length} 个课程`);
    return { curriculums };
  } catch (error) {
    console.error('❌ 创建课程数据失败:', error);
    throw error;
  }
}
