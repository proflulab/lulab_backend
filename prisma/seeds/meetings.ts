/**
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-12-15
 * @Description: 会议数据种子模块
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */

import { PrismaClient, MeetingPlatform, MeetingType, FileType, StorageType, ProcessingStatus, SummarySourceType, GenerationMethod } from '@prisma/client'

// 会议配置数据
const MEETING_CONFIGS = {
  teamMeeting: {
    title: '周例会 - 项目进度同步',
    description: '团队周例会，同步各项目进度和讨论下周计划',
    platform: MeetingPlatform.TENCENT_MEETING,
    MeetingId: '123456789',
    meetingCode: '123-456-789',
    type: MeetingType.SCHEDULED,
    hostUserName: '张三',
    participantCount: 8,
    tags: ['周例会', '项目同步', '团队协作'],
    language: 'zh-CN',
  },
  clientMeeting: {
    title: '客户需求评审会议',
    description: '与客户讨论新功能需求和技术实现方案',
    platform: MeetingPlatform.ZOOM,
    MeetingId: '987654321',
    meetingCode: '987-654-321',
    type: MeetingType.SCHEDULED,
    hostUserName: '李四',
    participantCount: 12,
    tags: ['客户需求', '评审', '技术讨论'],
    language: 'zh-CN',
  },
  trainingMeeting: {
    title: '新员工培训 - 产品功能介绍',
    description: '为新入职员工介绍公司主要产品功能和使用方法',
    platform: MeetingPlatform.TENCENT_MEETING,
    MeetingId: '555666777',
    meetingCode: '555-666-777',
    type: MeetingType.WEBINAR,
    hostUserName: '王五',
    participantCount: 25,
    tags: ['培训', '新员工', '产品介绍'],
    language: 'zh-CN',
  },
  emergencyMeeting: {
    title: '紧急问题处理会议',
    description: '讨论生产环境紧急问题的处理方案',
    platform: MeetingPlatform.DINGTALK,
    MeetingId: '111222333',
    type: MeetingType.INSTANT,
    hostUserName: '赵六',
    participantCount: 6,
    tags: ['紧急', '问题处理', '生产环境'],
    language: 'zh-CN',
  },
} as const

// 平台用户配置
const PLATFORM_USER_CONFIGS = {
  host1: {
    platform: MeetingPlatform.TENCENT_MEETING,
    platformUserId: 'user_12345',
    userName: '张三',
    userEmail: 'zhangsan@company.com',
    isActive: true,
  },
  host2: {
    platform: MeetingPlatform.ZOOM,
    platformUserId: 'user_67890',
    userName: '李四',
    userEmail: 'lisi@company.com',
    isActive: true,
  },
  host3: {
    platform: MeetingPlatform.TENCENT_MEETING,
    platformUserId: 'user_54321',
    userName: '王五',
    userEmail: 'wangwu@company.com',
    isActive: true,
  },
  host4: {
    platform: MeetingPlatform.DINGTALK,
    platformUserId: 'user_98765',
    userName: '赵六',
    userEmail: 'zhaoliu@company.com',
    isActive: true,
  },
  participant1: {
    platform: MeetingPlatform.TENCENT_MEETING,
    platformUserId: 'participant_001',
    userName: '参与者1',
    userEmail: 'participant1@company.com',
    isActive: true,
  },
  participant2: {
    platform: MeetingPlatform.TENCENT_MEETING,
    platformUserId: 'participant_002',
    userName: '参与者2',
    userEmail: 'participant2@company.com',
    isActive: true,
  },
} as const

// 会议文件配置
const MEETING_FILE_CONFIGS = {
  recording: {
    fileName: 'meeting_recording_20241215.mp4',
    originalFileName: '会议录制_20241215.mp4',
    fileType: FileType.VIDEO,
    mimeType: 'video/mp4',
    fileSize: BigInt(524288000), // 500MB
    duration: 3600, // 1小时
    storageType: StorageType.LOCAL,
    storagePath: '/recordings/2024/12/15/meeting_recording_20241215.mp4',
    storageUrl: 'https://example.com/recordings/meeting_recording_20241215.mp4',
    processingStatus: ProcessingStatus.COMPLETED,
  },
  transcript: {
    fileName: 'meeting_transcript_20241215.txt',
    originalFileName: '会议转录_20241215.txt',
    fileType: FileType.TRANSCRIPT,
    mimeType: 'text/plain',
    fileSize: BigInt(102400), // 100KB
    storageType: StorageType.LOCAL,
    storagePath: '/transcripts/2024/12/15/meeting_transcript_20241215.txt',
    storageUrl: 'https://example.com/transcripts/meeting_transcript_20241215.txt',
    processingStatus: ProcessingStatus.COMPLETED,
    content: '会议转录内容示例...',
  },
  summary: {
    fileName: 'meeting_summary_20241215.pdf',
    originalFileName: '会议纪要_20241215.pdf',
    fileType: FileType.SUMMARY,
    mimeType: 'application/pdf',
    fileSize: BigInt(204800), // 200KB
    storageType: StorageType.LOCAL,
    storagePath: '/summaries/2024/12/15/meeting_summary_20241215.pdf',
    storageUrl: 'https://example.com/summaries/meeting_summary_20241215.pdf',
    processingStatus: ProcessingStatus.COMPLETED,
  },
} as const

// 会议总结配置
const MEETING_SUMMARY_CONFIGS = {
  teamSummary: {
    title: '周例会总结 - 2024年12月第3周',
    content: '本次会议主要讨论了各项目的进展情况...',
    sourceType: SummarySourceType.TRANSCRIPT,
    generatedBy: GenerationMethod.AI,
    aiModel: 'gpt-4',
    confidence: 0.95,
    language: 'zh-CN',
    keyPoints: [
      '项目A进度正常，预计下周完成',
      '项目B遇到技术难点，需要额外支持',
      '团队需要加强代码审查流程',
    ],
    actionItems: [
      { assignee: '张三', task: '跟进项目A的测试进度', deadline: '2024-12-22' },
      { assignee: '李四', task: '协调资源解决项目B的技术问题', deadline: '2024-12-20' },
    ],
    decisions: [
      '决定采用新的代码审查工具',
      '调整项目B的开发计划',
    ],
    participants: [
      { name: '张三', role: '项目负责人', attendance: '全程参与' },
      { name: '李四', role: '技术负责人', attendance: '全程参与' },
    ],
    status: ProcessingStatus.COMPLETED,
  },
} as const

export interface CreatedMeetings {
  meetings: {
    teamMeeting: any
    clientMeeting: any
    trainingMeeting: any
    emergencyMeeting: any
  }
  platformUsers: {
    host1: any
    host2: any
    host3: any
    host4: any
    participant1: any
    participant2: any
  }
  meetingFiles: {
    recording: any
    transcript: any
    summary: any
  }
  meetingSummaries: {
    teamSummary: any
  }
}

/**
 * 创建平台用户
 */
async function createPlatformUser(
  prisma: PrismaClient,
  platform: MeetingPlatform,
  platformUserId: string,
  userName: string,
  userEmail: string,
  isActive: boolean = true
) {
  return prisma.platformUser.upsert({
    where: {
      platform_platformUserId: {
        platform,
        platformUserId,
      },
    },
    update: {},
    create: {
      platform,
      platformUserId,
      userName,
      userEmail,
      isActive,
      lastSeenAt: new Date(),
    },
  })
}

/**
 * 创建会议记录
 */
async function createMeeting(
  prisma: PrismaClient,
  meetingData: any,
  hostPlatformUserId?: string,
) {
  const now = new Date()
  const startTime = new Date(now.getTime() - 2 * 60 * 60 * 1000) // 2小时前
  const endTime = new Date(now.getTime() - 1 * 60 * 60 * 1000) // 1小时前

  const { hostUserName, ...dataToCreate } = meetingData

  return prisma.meeting.upsert({
    where: {
      platform_MeetingId: {
        platform: meetingData.platform,
        MeetingId: meetingData.MeetingId,
      },
    },
    update: {
      hostPlatformUserId,
      updatedAt: new Date(),
    },
    create: {
      ...dataToCreate,
      hostPlatformUserId,
      scheduledStartTime: startTime,
      scheduledEndTime: endTime,
      startTime,
      endTime,
      durationSeconds: 3600, // 1小时
      hasRecording: true,
      recordingStatus: ProcessingStatus.COMPLETED,
      processingStatus: ProcessingStatus.COMPLETED,
      timezone: 'Asia/Shanghai',
    },
  })
}

/**
 * 创建会议文件
 */
async function createMeetingFile(
  prisma: PrismaClient,
  meetingId: string,
  fileData: any
) {
  return prisma.meetingFile.create({
    data: {
      meetingRecordId: meetingId,
      ...fileData,
    },
  })
}

/**
 * 创建会议总结
 */
async function createMeetingSummary(
  prisma: PrismaClient,
  meetingId: string,
  summaryData: any,
  sourceFileId?: string,
  createdBy?: string
) {
  return prisma.meetingSummary.create({
    data: {
      meetingId,
      ...summaryData,
      sourceFileId,
      createdBy,
      processingTime: 30000, // 30秒
      status: ProcessingStatus.COMPLETED,
    },
  })
}

/**
 * 创建会议参与记录
 */
async function createMeetingParticipation(
  prisma: PrismaClient,
  meetingId: string,
  platformUserId: string,
  userId?: string
) {
  const now = new Date()
  const joinTime = new Date(now.getTime() - 1.5 * 60 * 60 * 1000) // 1.5小时前
  const leftTime = new Date(now.getTime() - 0.5 * 60 * 60 * 1000) // 0.5小时前
  const durationSeconds = Math.floor((leftTime.getTime() - joinTime.getTime()) / 1000)

  return prisma.meetingParticipation.create({
    data: {
      meetingId,
      platformUserId,
      userId,
      joinTime,
      leftTime,
      durationSeconds,
      userRole: 1, // 普通参与者
    },
  })
}

/**
 * 创建会议转录记录
 */
async function createMeetingTranscript(
  prisma: PrismaClient,
  meetingId: string,
  transcriptData: any
) {
  return prisma.meetingTranscript.create({
    data: {
      meetingId,
      ...transcriptData,
    },
  })
}

export async function createMeetings(prisma: PrismaClient, userId?: string): Promise<CreatedMeetings> {
  // 创建平台用户
  const platformUsers = await Promise.all([
    createPlatformUser(prisma, PLATFORM_USER_CONFIGS.host1.platform, PLATFORM_USER_CONFIGS.host1.platformUserId, PLATFORM_USER_CONFIGS.host1.userName, PLATFORM_USER_CONFIGS.host1.userEmail),
    createPlatformUser(prisma, PLATFORM_USER_CONFIGS.host2.platform, PLATFORM_USER_CONFIGS.host2.platformUserId, PLATFORM_USER_CONFIGS.host2.userName, PLATFORM_USER_CONFIGS.host2.userEmail),
    createPlatformUser(prisma, PLATFORM_USER_CONFIGS.host3.platform, PLATFORM_USER_CONFIGS.host3.platformUserId, PLATFORM_USER_CONFIGS.host3.userName, PLATFORM_USER_CONFIGS.host3.userEmail),
    createPlatformUser(prisma, PLATFORM_USER_CONFIGS.host4.platform, PLATFORM_USER_CONFIGS.host4.platformUserId, PLATFORM_USER_CONFIGS.host4.userName, PLATFORM_USER_CONFIGS.host4.userEmail),
    createPlatformUser(prisma, PLATFORM_USER_CONFIGS.participant1.platform, PLATFORM_USER_CONFIGS.participant1.platformUserId, PLATFORM_USER_CONFIGS.participant1.userName, PLATFORM_USER_CONFIGS.participant1.userEmail),
    createPlatformUser(prisma, PLATFORM_USER_CONFIGS.participant2.platform, PLATFORM_USER_CONFIGS.participant2.platformUserId, PLATFORM_USER_CONFIGS.participant2.userName, PLATFORM_USER_CONFIGS.participant2.userEmail),
  ])

  const [
    host1, host2, host3, host4, participant1, participant2
  ] = platformUsers

  // 创建会议记录

  const meetings = await Promise.all([
    createMeeting(prisma, MEETING_CONFIGS.teamMeeting, host1.id, userId),
    createMeeting(prisma, MEETING_CONFIGS.clientMeeting, host2.id, userId),
    createMeeting(prisma, MEETING_CONFIGS.trainingMeeting, host3.id, userId),
    createMeeting(prisma, MEETING_CONFIGS.emergencyMeeting, host4.id, userId),
  ])

  const [teamMeeting, clientMeeting, trainingMeeting, emergencyMeeting] = meetings

  // 创建会议参与记录
  await Promise.all([
    createMeetingParticipation(prisma, teamMeeting.id, participant1.id, userId),
    createMeetingParticipation(prisma, teamMeeting.id, participant2.id, userId),
    createMeetingParticipation(prisma, clientMeeting.id, participant1.id, userId),
    createMeetingParticipation(prisma, trainingMeeting.id, participant1.id, userId),
    createMeetingParticipation(prisma, emergencyMeeting.id, participant2.id, userId),
  ])

  // 创建会议文件
  const meetingFiles = await Promise.all([
    createMeetingFile(prisma, teamMeeting.id, MEETING_FILE_CONFIGS.recording),
    createMeetingFile(prisma, teamMeeting.id, MEETING_FILE_CONFIGS.transcript),
    createMeetingFile(prisma, teamMeeting.id, MEETING_FILE_CONFIGS.summary),
  ])

  const [recording, transcript, summaryFile] = meetingFiles

  // 创建会议转录记录
  await createMeetingTranscript(prisma, teamMeeting.id, {
    platformUserId: host1.id,
    paragraphId: 'para_001',
    speakerName: '张三',
    startTime: BigInt(Date.now() - 7200000), // 2小时前
    endTime: BigInt(Date.now() - 7140000), // 2小时前 + 1分钟
    text: '大家好，欢迎来到今天的周例会。首先我们来同步一下各项目的进展情况。',
  })

  await createMeetingTranscript(prisma, teamMeeting.id, {
    platformUserId: participant1.id,
    paragraphId: 'para_002',
    speakerName: '参与者1',
    startTime: BigInt(Date.now() - 7140000), // 2小时前 + 1分钟
    endTime: BigInt(Date.now() - 7080000), // 2小时前 + 2分钟
    text: '项目A目前进展顺利，预计可以在下周完成开发工作。',
  })

  // 创建会议总结
  const meetingSummaries = await Promise.all([
    createMeetingSummary(prisma, teamMeeting.id, MEETING_SUMMARY_CONFIGS.teamSummary, transcript.id, userId),
  ])

  const [teamSummary] = meetingSummaries

  return {
    meetings: {
      teamMeeting,
      clientMeeting,
      trainingMeeting,
      emergencyMeeting,
    },
    platformUsers: {
      host1,
      host2,
      host3,
      host4,
      participant1,
      participant2,
    },
    meetingFiles: {
      recording,
      transcript,
      summary: summaryFile,
    },
    meetingSummaries: {
      teamSummary,
    },
  }
}