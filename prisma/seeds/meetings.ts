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

// Define configuration types derived from Unchecked inputs to allow raw IDs
type MeetingConfig = Omit<Prisma.MeetingUncheckedCreateInput, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'platform' | 'type'> & {
  platform: MeetingPlatform;
  type: MeetingType;
  hostUserName: string; // Used to look up the host in the specific seed logic
  participantCount?: number;
};

type PlatformUserConfig = Omit<Prisma.PlatformUserUncheckedCreateInput, 'id' | 'createdAt' | 'updatedAt' | 'platform'> & {
  platform: Platform;
};

// 会议配置数据
const MEETING_CONFIGS: Record<string, MeetingConfig> = {
  teamMeeting: {
    title: '周例会 - 项目进度同步',
    description: '团队周例会，同步各项目进度和讨论下周计划',
    platform: MeetingPlatform.TENCENT_MEETING,
    meetingId: '123456789',
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
    meetingId: '987654321',
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
    meetingId: '555666777',
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
    meetingId: '111222333',
    type: MeetingType.INSTANT,
    hostUserName: '赵六',
    participantCount: 6,
    tags: ['紧急', '问题处理', '生产环境'],
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
    fileType: 0, // 假设0是某种类型
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
  config: PlatformUserConfig
) {
  return prisma.platformUser.upsert({
    where: {
      platform_platformUserId: {
        platform: config.platform,
        platformUserId: config.platformUserId,
      },
    },
    update: {},
    create: {
      platform: config.platform,
      platformUserId: config.platformUserId,
      userName: config.userName,
      email: config.email,
      isActive: config.isActive,
      lastSeenAt: new Date(),
    },
  });
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

  // 根据 model: @@unique([platform, meetingId])
  return prisma.meeting.upsert({
    where: {
      platform_meetingId: {
        platform: meetingConfig.platform,
        meetingId: meetingId!,
      },
    },
    update: {
      hostPlatformUserId,
      updatedAt: new Date(),
    },
    create: {
      ...restConfig,
      meetingId: meetingId!,
      hostPlatformUserId,
      scheduledStartAt: startTime,
      scheduledEndAt: endTime,
      startAt: startTime,
      endAt: endTime,
      durationSeconds: 3600, // 1小时
      hasRecording: true,
      recordingStatus: ProcessingStatus.COMPLETED,
      processingStatus: ProcessingStatus.COMPLETED,
      timezone: 'Asia/Shanghai',
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
  fileConfig: typeof MEETING_FILE_CONFIGS.recording
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
    }
  });

  // 2. Create MeetingRecording (Idempotent check)
  let meetingRecording = await prisma.meetingRecording.findFirst({
    where: {
      meetingId: meetingId,
      recorderUserId: recorderUserId,
    }
  });

  if (!meetingRecording) {
    meetingRecording = await prisma.meetingRecording.create({
      data: {
        meetingId,
        tenantId: '00000000-0000-0000-0000-000000000000', // Random or valid UUID
        startAt: new Date(),
        endAt: new Date(),
        status: 1, // 0=recording?, 1=completed? assuming specific integer status
        recorderUserId: recorderUserId, // Link to PlatformUser who recorded
      }
    });
  }

  // 3. Create MeetingRecordingFile linked to StorageObject and Recording (Idempotent check)
  let recordingFile = await prisma.meetingRecordingFile.findFirst({
    where: {
      recordingId: meetingRecording.id,
      fileObjectId: storageObject.id,
    }
  });

  if (!recordingFile) {
    recordingFile = await prisma.meetingRecordingFile.create({
      data: {
        tenantId: '00000000-0000-0000-0000-000000000000',
        recordingId: meetingRecording.id,
        fileObjectId: storageObject.id,
        fileType: fileConfig.fileType,
        durationMs: fileConfig.durationMs,
        resolution: fileConfig.resolution,
      }
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

/**
 * 创建转录记录 (Transcript -> Paragraph -> Sentence)
 */
/**
 * 创建模拟转录记录 (Transcript -> Paragraph -> Sentence -> Word)
 */
async function createSimulatedTranscript(
  prisma: PrismaClient,
  meetingRecordingId: string,
  speakers: { host: string; participant: string }
) {
  // 模拟对话数据 (参考真实 JSON 结构)
  const dialogue = [
    {
      role: 'host',
      text: '大家好，能听到我说话吗？',
      startTime: 5301,
      duration: 1000,
    },
    {
      role: 'participant',
      text: '嗯，老师也来了。',
      startTime: 8470,
      duration: 1350,
    },
    {
      role: 'host',
      text: 'Ok 我们待会儿那个八点钟开始啊！',
      startTime: 9206,
      duration: 2130,
    },
    {
      role: 'host',
      text: '声音，声音可以吗？声音？',
      startTime: 12000,
      duration: 1470,
    },
    {
      role: 'participant',
      text: 'Ok 可以，能听到的哈！',
      startTime: 14000,
      duration: 1890,
    },
    {
      role: 'host',
      text: '大家好，欢迎来到今天的周例会。首先我们来同步一下各项目的进展情况。',
      startTime: 18000,
      duration: 5000,
    },
    {
      role: 'participant',
      text: '项目A目前进展顺利，预计可以在下周完成开发工作。',
      startTime: 24000,
      duration: 4000,
    }
  ];

  // 1. Create Transcript
  const transcript = await prisma.transcript.create({
    data: {
      recordingId: meetingRecordingId,
      language: 'zh-CN',
      status: 1, // completed
    }
  });

  // 2. Process Dialogue
  let pidCounter = 0;
  for (const line of dialogue) {
    const speakerId = line.role === 'host' ? speakers.host : speakers.participant;
    const pid = String(pidCounter++);
    const startTimeMs = BigInt(line.startTime);
    const endTimeMs = BigInt(line.startTime + line.duration);

    // Create Paragraph
    const paragraph = await prisma.paragraph.create({
      data: {
        transcriptId: transcript.id,
        pid: pid,
        startTimeMs,
        endTimeMs,
        speakerId: speakerId,
      }
    });

    // Create Sentence (Assume 1 sentence per paragraph for simulation)
    const sid = pid + '_s0';
    const sentence = await prisma.sentence.create({
      data: {
        paragraphId: paragraph.id,
        sid: sid,
        startTimeMs,
        endTimeMs,
        text: line.text,
      }
    });

    // Create Words (Simple Tokenization: Split by characters for Chinese)
    // In a real scenario, this would use proper segmentation.
    // We distribute time evenly across characters effectively.
    // Filtering out spaces from the textArray to create Word entries, 
    // but preserving the original text in the sentence.
    const chars = line.text.split('').filter(c => c.trim() !== '');
    const charDuration = Math.floor(line.duration / Math.max(chars.length, 1));

    let currentWordStart = line.startTime;

    // Use promote createMany if valid, but here loop is safer for simple seed logic with small data
    const wordsData = chars.map((char, idx) => {
      const wid = sid + '_w' + idx;
      const wStart = currentWordStart;
      const wEnd = wStart + charDuration;
      currentWordStart = wEnd;

      return {
        sentenceId: sentence.id,
        wid: wid,
        order: idx,
        startTimeMs: BigInt(wStart),
        endTimeMs: BigInt(wEnd),
        text: char,
      };
    });

    await prisma.word.createMany({
      data: wordsData
    });
  }

  return transcript;
}

export async function createMeetings(
  prisma: PrismaClient,
): Promise<CreatedMeetings> {

  // 1. 创建平台用户
  const platformUsers = await Promise.all([
    createPlatformUser(prisma, PLATFORM_USER_CONFIGS.host1),
    createPlatformUser(prisma, PLATFORM_USER_CONFIGS.host2),
    createPlatformUser(prisma, PLATFORM_USER_CONFIGS.host3),
    createPlatformUser(prisma, PLATFORM_USER_CONFIGS.host4),
    createPlatformUser(prisma, PLATFORM_USER_CONFIGS.participant1),
    createPlatformUser(prisma, PLATFORM_USER_CONFIGS.participant2),
  ]);

  const [host1, host2, host3, host4, participant1, participant2] = platformUsers;

  // 2. 创建会议记录
  const meetings = await Promise.all([
    createMeeting(prisma, MEETING_CONFIGS.teamMeeting, host1.id),
    createMeeting(prisma, MEETING_CONFIGS.clientMeeting, host2.id),
    createMeeting(prisma, MEETING_CONFIGS.trainingMeeting, host3.id),
    createMeeting(prisma, MEETING_CONFIGS.emergencyMeeting, host4.id),
  ]);

  const [teamMeeting, clientMeeting, trainingMeeting, emergencyMeeting] = meetings;

  // 3. 创建会议参与记录
  await Promise.all([
    createMeetingParticipant(prisma, teamMeeting.id, participant1.id),
    createMeetingParticipant(prisma, teamMeeting.id, participant2.id),
    createMeetingParticipant(prisma, clientMeeting.id, participant1.id),
    createMeetingParticipant(prisma, trainingMeeting.id, participant1.id),
    createMeetingParticipant(prisma, emergencyMeeting.id, participant2.id),
  ]);

  // 4. 创建会议文件 (Recording & Files)
  // Use host1 as the recorder for the team meeting
  const { meetingRecording } = await createMeetingRecording(
    prisma,
    teamMeeting.id,
    host1.id, // Correctly linked to PlatformUser
    MEETING_FILE_CONFIGS.recording
  );

  // 5. 创建会议转录记录 (Transcript)
  const transcript1 = await createSimulatedTranscript(
    prisma,
    meetingRecording.id,
    {
      host: host1.id,
      participant: participant1.id,
    }
  );


  // 6. 创建会议总结
  const meetingSummaries = await Promise.all([
    createMeetingSummary(
      prisma,
      teamMeeting.id,
      MEETING_SUMMARY_CONFIGS.teamSummary,
      transcript1.id, // associating with the first transcript for now
      host1.id,       // Correctly using PlatformUser.id (host1) as creator
    ),
  ]);

  const [teamSummary] = meetingSummaries;

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
    // Simplified return structure as we have complex file objects now
    meetingFiles: {
      recording: meetingRecording
    } as any,
    meetingSummaries: {
      teamSummary,
    },
  };
}
