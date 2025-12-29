import {
  PrismaClient,
  MeetingPlatform,
  MeetingType,
  ProcessingStatus,
  GenerationMethod,
  Platform,
  StorageProvider,
  Prisma,
} from '@prisma/client';
import { createSimulatedTranscript } from './transcripts';

// Define configuration types derived from Unchecked inputs to allow raw IDs
type MeetingConfig = Omit<
  Prisma.MeetingUncheckedCreateInput,
  'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'platform' | 'type'
> & {
  platform: MeetingPlatform;
  type: MeetingType;
  hostUserName: string; // Used to look up the host in the specific seed logic
  participantCount?: number;
};

type PlatformUserConfig = Omit<
  Prisma.PlatformUserUncheckedCreateInput,
  'id' | 'createdAt' | 'updatedAt' | 'platform'
> & {
  platform: Platform;
};

// 会议配置数据
const MEETING_CONFIGS: Record<string, MeetingConfig> = {
  teamMeeting: {
    title: 'L5项目例会',
    description: 'L5项目周期性例会，讨论项目进度和技术问题',
    platform: MeetingPlatform.TENCENT_MEETING,
    meetingId: '14828776902617556364',
    meetingCode: '148-287-769',
    type: MeetingType.SCHEDULED,
    hostUserName: '杨仕明',
    participantCount: 15,
    tags: ['项目例会', '研发', 'L5'],
    language: 'zh-CN',
  },
  clientMeeting: {
    title: '陈怡瑞会员对接会',
    description: '会员对应接洽与需求沟通',
    platform: MeetingPlatform.TENCENT_MEETING,
    meetingId: '1366034376294456216',
    meetingCode: '136-603-437',
    type: MeetingType.SCHEDULED,
    hostUserName: '张晨',
    participantCount: 5,
    tags: ['会员对接', '需求沟通'],
    language: 'zh-CN',
  },
  trainingMeeting: {
    title: 'AI俱乐部（level2&level1）',
    description: 'AI俱乐部课程培训与交流',
    platform: MeetingPlatform.TENCENT_MEETING,
    meetingId: '11596879021002786213',
    meetingCode: '115-968-790',
    type: MeetingType.WEBINAR,
    hostUserName: '张晨',
    participantCount: 50,
    tags: ['培训', 'AI俱乐部', '教育'],
    language: 'zh-CN',
  },
  emergencyMeeting: {
    title: '杨仕明的快速会议',
    description: '临时快速会议交流',
    platform: MeetingPlatform.TENCENT_MEETING,
    meetingId: '5228964612202836078',
    meetingCode: '522-896-461',
    type: MeetingType.INSTANT,
    hostUserName: '杨仕明',
    participantCount: 3,
    tags: ['快速会议', '临时沟通'],
    language: 'zh-CN',
  },
};

// 平台用户配置
const PLATFORM_USER_CONFIGS: Record<string, PlatformUserConfig> = {
  host1: {
    platform: Platform.TENCENT_MEETING,
    platformUserId: 'user_12345',
    userName: '张三',
    email: 'zhangsan@company.com',
    isActive: true,
  },
  host2: {
    platform: Platform.ZOOM,
    platformUserId: 'user_67890',
    userName: '李四',
    email: 'lisi@company.com',
    isActive: true,
  },
  host3: {
    platform: Platform.TENCENT_MEETING,
    platformUserId: 'user_54321',
    userName: '王五',
    email: 'wangwu@company.com',
    isActive: true,
  },
  host4: {
    platform: Platform.DINGTALK,
    platformUserId: 'user_98765',
    userName: '赵六',
    email: 'zhaoliu@company.com',
    isActive: true,
  },
  participant1: {
    platform: Platform.TENCENT_MEETING,
    platformUserId: 'participant_001',
    userName: '参与者1',
    email: 'participant1@company.com',
    isActive: true,
  },
  participant2: {
    platform: Platform.TENCENT_MEETING,
    platformUserId: 'participant_002',
    userName: '参与者2',
    email: 'participant2@company.com',
    isActive: true,
  },
};

// 会议文件配置
const MEETING_FILE_CONFIGS = {
  recording: {
    // StorageObject fields
    provider: StorageProvider.LOCAL,
    bucket: 'recordings',
    objectKey: '2024/12/15/meeting_recording_20241215.mp4',
    contentType: 'video/mp4',
    sizeBytes: BigInt(524288000), // 500MB

    // MeetingRecordingFile fields
    fileType: 'VIDEO' as any, // 使用枚举值而不是数字
    durationMs: BigInt(3600000), // 1小时
    resolution: '1920x1080',
  },
} as const;

// 会议总结配置
const MEETING_SUMMARY_CONFIGS = {
  teamSummary: {
    title: '周例会总结 - 2024年12月第3周',
    content: '本次会议主要讨论了各项目的进展情况...',
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
      {
        assignee: '李四',
        task: '协调资源解决项目B的技术问题',
        deadline: '2024-12-20',
      },
    ],
    decisions: ['决定采用新的代码审查工具', '调整项目B的开发计划'],
    participants: [
      { name: '张三', role: '项目负责人', attendance: '全程参与' },
      { name: '李四', role: '技术负责人', attendance: '全程参与' },
    ],
    status: ProcessingStatus.COMPLETED,
  },
} as const;

export interface CreatedMeetings {
  meetings: {
    teamMeeting: any;
    clientMeeting: any;
    trainingMeeting: any;
    emergencyMeeting: any;
  };
  platformUsers: {
    host1: any;
    host2: any;
    host3: any;
    host4: any;
    participant1: any;
    participant2: any;
  };
  meetingFiles: {
    recording: any;
  };
  meetingSummaries: {
    teamSummary: any;
  };
}

/**
 * 创建平台用户
 */
async function createPlatformUser(
  prisma: PrismaClient,
  config: PlatformUserConfig,
) {
  // 先查找是否已存在相同的平台用户
  const existingUser = await prisma.platformUser.findFirst({
    where: {
      platform: config.platform,
      platformUserId: config.platformUserId,
    },
  });

  if (existingUser) {
    // 如果存在，更新并返回
    return prisma.platformUser.update({
      where: { id: existingUser.id },
      data: {
        userName: config.userName,
        email: config.email,
        isActive: config.isActive,
        lastSeenAt: new Date(),
      },
    });
  } else {
    // 如果不存在，创建新用户
    return prisma.platformUser.create({
      data: {
        platform: config.platform,
        platformUserId: config.platformUserId,
        userName: config.userName,
        email: config.email,
        isActive: config.isActive,
        lastSeenAt: new Date(),
      },
    });
  }
}

/**
 * 创建会议记录
 */
async function createMeeting(
  prisma: PrismaClient,
  meetingConfig: MeetingConfig,
  hostPlatformUserId?: string,
) {
  const now = new Date();
  const startTime = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2小时前
  const endTime = new Date(now.getTime() - 1 * 60 * 60 * 1000); // 1小时前

  const { hostUserName, meetingId, ...restConfig } = meetingConfig;

  // 根据 model: @@unique([platform, meetingId, subMeetingId])
  // Use upsert with the unique constraint directly
  return prisma.meeting.upsert({
    where: {
      platform_meetingId_subMeetingId: {
        platform: meetingConfig.platform,
        meetingId: meetingId!,
        subMeetingId: '', // Default empty subMeetingId for seed data
      },
    },
    update: {
      ...restConfig,
      hostId: hostPlatformUserId,
      updatedAt: new Date(),
    },
    create: {
      ...restConfig,
      meetingId: meetingId!,
      hostId: hostPlatformUserId,
      scheduledStartAt: startTime,
      scheduledEndAt: endTime,
      startAt: startTime,
      endAt: endTime,
      durationSeconds: 3600, // 1小时
      hasRecording: true,
      recordingStatus: ProcessingStatus.COMPLETED,
      processingStatus: ProcessingStatus.COMPLETED,
      timezone: 'Asia/Shanghai',
      subMeetingId: '', // Explicitly set subMeetingId
    },
  });
}

/**
 * 创建会议录制和相关文件
 */
async function createMeetingRecording(
  prisma: PrismaClient,
  meetingId: string,
  recorderUserId: string | null | undefined,
  fileConfig: typeof MEETING_FILE_CONFIGS.recording,
) {
  // 1. Create StorageObject (Idempotent)
  const storageObject = await prisma.storageObject.upsert({
    where: {
      provider_bucket_objectKey: {
        provider: fileConfig.provider,
        bucket: fileConfig.bucket,
        objectKey: fileConfig.objectKey,
      },
    },
    update: {},
    create: {
      provider: fileConfig.provider,
      bucket: fileConfig.bucket,
      objectKey: fileConfig.objectKey,
      contentType: fileConfig.contentType,
      sizeBytes: fileConfig.sizeBytes,
    },
  });

  // 2. Create MeetingRecording (Idempotent check)
  let meetingRecording = await prisma.meetingRecording.findFirst({
    where: {
      meetingId: meetingId,
      recorderUserId: recorderUserId,
    },
  });

  if (!meetingRecording) {
    meetingRecording = await prisma.meetingRecording.create({
      data: {
        meetingId,
        startAt: new Date(),
        endAt: new Date(),
        status: 'COMPLETED' as any, // 使用类型断言来绕过类型检查
        recorderUserId: recorderUserId, // Link to PlatformUser who recorded
      },
    });
  }

  // 3. Create MeetingRecordingFile linked to StorageObject and Recording (Idempotent check)
  let recordingFile = await prisma.meetingRecordingFile.findFirst({
    where: {
      recordingId: meetingRecording.id,
      fileObjectId: storageObject.id,
    },
  });

  if (!recordingFile) {
    recordingFile = await prisma.meetingRecordingFile.create({
      data: {
        recordingId: meetingRecording.id,
        fileObjectId: storageObject.id,
        fileType: fileConfig.fileType,
        durationMs: fileConfig.durationMs,
        resolution: fileConfig.resolution,
      },
    });
  }

  return { meetingRecording, recordingFile, storageObject };
}

/**
 * 创建会议总结
 */
async function createMeetingSummary(
  prisma: PrismaClient,
  meetingId: string,
  summaryData: any,
  transcriptId?: string,
  creatorPlatformUserId?: string,
) {
  return prisma.meetingSummary.create({
    data: {
      meetingId,
      ...summaryData,
      transcriptId,
      createdBy: creatorPlatformUserId, // MUST be PlatformUser.id
      processingTime: 30000, // 30秒
      status: ProcessingStatus.COMPLETED,
    },
  });
}

/**
 * 创建会议参与记录
 */
async function createMeetingParticipant(
  prisma: PrismaClient,
  meetingId: string,
  platformUserId: string,
) {
  const now = new Date();
  const joinTime = new Date(now.getTime() - 1.5 * 60 * 60 * 1000); // 1.5小时前
  const leftTime = new Date(now.getTime() - 0.5 * 60 * 60 * 1000); // 0.5小时前
  const durationSeconds = Math.floor(
    (leftTime.getTime() - joinTime.getTime()) / 1000,
  );

  return prisma.meetingParticipant.create({
    data: {
      meetingId,
      platformUserId,
      joinTime,
      leftTime,
      durationSeconds,
      userRole: 1, // 普通参与者
    },
  });
}

export async function createMeetings(
  prisma: PrismaClient,
): Promise<CreatedMeetings> {
  // 1. 创建平台用户
  const platformUsersRaw = await Promise.all(
    Object.entries(PLATFORM_USER_CONFIGS).map(async ([key, config]) => {
      const user = await createPlatformUser(prisma, config);
      return { key, user };
    }),
  );

  const platformUsers: any = platformUsersRaw.reduce((acc, { key, user }) => {
    acc[key] = user;
    return acc;
  }, {} as any);

  // 2. 创建会议记录
  const meetingsRaw = await Promise.all(
    Object.entries(MEETING_CONFIGS).map(async ([key, config]) => {
      // Find the corresponding host user based on the config's hostUserName or fallback logic
      // Ideally we should use a more robust lookup. Here we'll stick to the previous mapping logic
      // But notice the original code manually mapped specific hosts:
      // teamMeeting -> host1, clientMeeting -> host2, trainingMeeting -> host3, emergencyMeeting -> host4
      // We'll reproduce this mapping via a simple helper or just map by index if keys align, but keys don't strictly align by name.
      // Let's use a mapping constant for clarity or stick to the concise manual mapping if logic is specific.
      // Actually, we can look up the host by `hostUserName` if we had a map of `userName -> platformUser`.
      // But `host1` name is '张三'.
      // teamMeeting hostUserName is '杨仕明' -> This doesn't match '张三'.
      // The original code was: teamMeeting -> host1
      // host1 userName is '张三'.
      // So there is a disconnect in the original seed data between `MeetingConfig.hostUserName` and `PlatformUserConfig.userName`.
      // To simplify safely, I will keep a manual mapping for host assignment but use the map for storage.

      let hostUser;
      if (key === 'teamMeeting') hostUser = platformUsers.host1;
      else if (key === 'clientMeeting') hostUser = platformUsers.host2;
      else if (key === 'trainingMeeting') hostUser = platformUsers.host3;
      else if (key === 'emergencyMeeting') hostUser = platformUsers.host4;

      const meeting = await createMeeting(prisma, config, hostUser?.id);
      return { key, meeting };
    }),
  );

  const meetings: any = meetingsRaw.reduce((acc, { key, meeting }) => {
    acc[key] = meeting;
    return acc;
  }, {} as any);

  // 3. 创建会议参与记录
  await Promise.all([
    createMeetingParticipant(
      prisma,
      meetings.teamMeeting.id,
      platformUsers.participant1.id,
    ),
    createMeetingParticipant(
      prisma,
      meetings.teamMeeting.id,
      platformUsers.participant2.id,
    ),
    createMeetingParticipant(
      prisma,
      meetings.clientMeeting.id,
      platformUsers.participant1.id,
    ),
    createMeetingParticipant(
      prisma,
      meetings.trainingMeeting.id,
      platformUsers.participant1.id,
    ),
    createMeetingParticipant(
      prisma,
      meetings.emergencyMeeting.id,
      platformUsers.participant2.id,
    ),
  ]);

  // 4. 创建会议文件 (Recording & Files)
  // Use host1 as the recorder for the team meeting
  const { meetingRecording } = await createMeetingRecording(
    prisma,
    meetings.teamMeeting.id,
    platformUsers.host1.id, // Correctly linked to PlatformUser
    MEETING_FILE_CONFIGS.recording,
  );

  // 5. 创建会议转录记录 (Transcript)
  const transcript1 = await createSimulatedTranscript(
    prisma,
    meetingRecording.id,
    platformUsers.host1.id, // 使用 host1 的 ID 作为 speakerId
  );

  // 6. 创建会议总结
  const meetingSummaries = await Promise.all([
    createMeetingSummary(
      prisma,
      meetings.teamMeeting.id,
      MEETING_SUMMARY_CONFIGS.teamSummary,
      transcript1.id, // associating with the first transcript for now
      platformUsers.host1.id, // Correctly using PlatformUser.id (host1) as creator
    ),
  ]);

  const [teamSummary] = meetingSummaries;

  return {
    meetings: meetings,
    platformUsers: platformUsers,
    // Simplified return structure as we have complex file objects now
    meetingFiles: {
      recording: meetingRecording,
    } as any,
    meetingSummaries: {
      teamSummary,
    },
  };
}
