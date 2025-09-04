/**
 * Mock services and providers for testing
 */

/**
 * Mock PrismaService for testing
 */
export const mockPrismaService = {
    user: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
    meetingRecord: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
    verificationCode: {
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
    $transaction: jest.fn(),
    $connect: jest.fn(),
    $disconnect: jest.fn(),
};

/**
 * Mock AuthService for testing
 */
export const mockAuthService = {
    validateUser: jest.fn(),
    login: jest.fn(),
    register: jest.fn(),
    sendVerificationCode: jest.fn(),
    verifyCode: jest.fn(),
    refreshToken: jest.fn(),
};

/**
 * Mock EmailService for testing
 */
export const mockEmailService = {
    sendEmail: jest.fn(),
    sendVerificationEmail: jest.fn(),
    sendWelcomeEmail: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
};

/**
 * Mock UserService for testing
 */
export const mockUserService = {
    create: jest.fn(),
    findById: jest.fn(),
    findByEmail: jest.fn(),
    findByUsername: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    verifyUser: jest.fn(),
};

/**
 * Mock MeetingService for testing
 */
export const mockMeetingService = {
    createMeetingRecord: jest.fn(),
    findMeetingRecord: jest.fn(),
    updateMeetingRecord: jest.fn(),
    deleteMeetingRecord: jest.fn(),
    getMeetingRecords: jest.fn(),
};

/**
 * Mock TencentApiService for testing
 */
export const mockTencentApiService = {
    getRecordingFileDetail: jest.fn(),
    getCorpRecords: jest.fn(),
    createMeeting: jest.fn(),
    updateMeeting: jest.fn(),
    deleteMeeting: jest.fn(),
};

/**
 * Mock VerificationService for testing
 */
export const mockVerificationService = {
    sendSmsCode: jest.fn(),
    sendEmailCode: jest.fn(),
    verifyCode: jest.fn(),
    generateCode: jest.fn(),
};

/**
 * Helper to create mock providers array for testing modules
 */
export const createMockProviders = (customMocks: Record<string, any> = {}) => [
    { provide: 'PrismaService', useValue: { ...mockPrismaService, ...customMocks.prisma } },
    { provide: 'AuthService', useValue: { ...mockAuthService, ...customMocks.auth } },
    { provide: 'EmailService', useValue: { ...mockEmailService, ...customMocks.email } },
    { provide: 'UserService', useValue: { ...mockUserService, ...customMocks.user } },
    { provide: 'MeetingService', useValue: { ...mockMeetingService, ...customMocks.meeting } },
    { provide: 'TencentApiService', useValue: { ...mockTencentApiService, ...customMocks.tencent } },
    { provide: 'VerificationService', useValue: { ...mockVerificationService, ...customMocks.verification } },
];