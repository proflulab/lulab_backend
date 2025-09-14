import {
  buildVerificationEmail,
  buildWelcomeEmail,
  buildPasswordResetNotificationEmail,
} from '@libs/common/email-templates';

describe('email-templates', () => {
  describe('buildVerificationEmail', () => {
    const cases: Array<[Parameters<typeof buildVerificationEmail>[0], string]> =
      [
        ['register', '注册'],
        ['login', '登录'],
        ['reset_password', '重置密码'],
      ];

    it.each(cases)('builds subject and html for %s', (type, zh) => {
      const code = '123456';
      const { subject, html } = buildVerificationEmail(type, code);
      expect(subject).toBe(`LuLab ${zh}验证码`);
      expect(html).toContain('LuLab');
      expect(html).toContain(zh);
      expect(html).toContain(code);
      // Basic structure hints
      expect(html).toContain('<div');
      expect(html).toContain('</div>');
    });
  });

  describe('buildWelcomeEmail', () => {
    it('builds subject and html including username', () => {
      const username = 'Alice';
      const { subject, html } = buildWelcomeEmail(username);
      expect(subject).toBe('欢迎加入 LuLab！');
      expect(html).toContain('LuLab');
      expect(html).toContain(username);
      expect(html).toContain('<div');
      expect(html).toContain('</div>');
    });
  });

  describe('buildPasswordResetNotificationEmail', () => {
    it('builds subject and html including name and time', () => {
      const username = 'Bob';
      const fixedDate = new Date('2024-01-02T03:04:05Z');
      const { subject, html } = buildPasswordResetNotificationEmail(
        username,
        fixedDate,
      );
      expect(subject).toBe('LuLab 密码重置通知');
      expect(html).toContain('LuLab');
      expect(html).toContain('密码重置通知');
      expect(html).toContain(username);
      expect(html).toContain('<div');
      expect(html).toContain('</div>');
    });
  });
});
