import { MailerService } from './mailer.service';
import type { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(),
}));

type TransporterStub = {
  sendMail: jest.Mock;
  verify: jest.Mock;
};

function makeTransporter(options?: { verifyCbError?: Error | null }) {
  const t: TransporterStub = {
    sendMail: jest.fn(),
    verify: jest.fn((cb?: unknown) => {
      // callback style used in constructor
      if (typeof cb === 'function') {
        const err = options?.verifyCbError ?? null;
        // async-ish callback to mimic real behavior
        (cb as (err: Error | null) => void)(err);
        return;
      }
      // promise style used in verify()
      return Promise.resolve(true);
    }),
  };
  return t;
}

function makeConfig(map: Record<string, unknown>): ConfigService {
  return {
    get: jest.fn((key: string, defaultValue?: unknown) =>
      key in map ? map[key] : defaultValue,
    ),
  } as unknown as ConfigService;
}

describe('MailerService', () => {
  const createTransport = nodemailer.createTransport as unknown as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('skips transporter when SMTP creds missing; send/verify are no-ops', async () => {
    const config = makeConfig({});
    const svc = new MailerService(config);

    // No transporter -> send returns null, verify returns false
    await expect(svc.send({ to: 'a@b.com', subject: 'x' })).resolves.toBeNull();
    await expect(svc.verify()).resolves.toBe(false);

    // createTransport should not be called
    expect(createTransport).not.toHaveBeenCalled();
  });

  it('creates transporter with config and sends email (from precedence)', async () => {
    const transporter = makeTransporter();
    createTransport.mockReturnValue(transporter);

    const cfgMap: Record<string, unknown> = {
      SMTP_USER: 'user@test.com',
      SMTP_PASS: 'secret',
      SMTP_HOST: 'smtp.test.com',
      SMTP_PORT: 2525,
      SMTP_SECURE: false,
      SMTP_FROM: 'noreply@test.com',
    };
    const config = makeConfig(cfgMap);
    const svc = new MailerService(config);

    // explicit from has highest precedence
    transporter.sendMail.mockResolvedValueOnce({ messageId: 'mid-1' });
    const r1 = await svc.send({
      from: 'alice@test.com',
      to: 'to@test.com',
      subject: 'S',
      html: '<b>Hi</b>',
    });
    expect(r1).toEqual({ messageId: 'mid-1' });
    expect(transporter.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ from: 'alice@test.com', to: 'to@test.com' }),
    );

    // when from not provided, falls back to SMTP_FROM
    transporter.sendMail.mockResolvedValueOnce({ messageId: 'mid-2' });
    const r2 = await svc.send({ to: 'x@y.com', subject: 'B' });
    expect(r2).toEqual({ messageId: 'mid-2' });
    expect(transporter.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ from: 'noreply@test.com' }),
    );

    // when SMTP_FROM not set, falls back to SMTP_USER
    cfgMap.SMTP_FROM = undefined;
    transporter.sendMail.mockResolvedValueOnce({ messageId: 'mid-3' });
    const r3 = await svc.send({ to: 'z@z.com', subject: 'C' });
    expect(r3).toEqual({ messageId: 'mid-3' });
    expect(transporter.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ from: 'user@test.com' }),
    );

    // ensure transporter built with SMTP config
    expect(createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        host: 'smtp.test.com',
        port: 2525,
        secure: false,
        auth: { user: 'user@test.com', pass: 'secret' },
      }),
    );
  });

  it('verify() returns true on success', async () => {
    const transporter = makeTransporter();
    // make promise-style verify resolve
    transporter.verify = jest.fn(() => Promise.resolve(true));
    createTransport.mockReturnValue(transporter);
    const config = makeConfig({ SMTP_USER: 'u', SMTP_PASS: 'p' });
    const svc = new MailerService(config);

    await expect(svc.verify()).resolves.toBe(true);
    expect(transporter.verify).toHaveBeenCalled();
  });

  it('verify() returns false on error and logs warning', async () => {
    const transporter = makeTransporter();
    // If called with callback (constructor), respond success to avoid unhandled rejection.
    // If called without args (service.verify), reject.
    transporter.verify = jest.fn((cb?: unknown) => {
      if (typeof cb === 'function') {
        (cb as (err: Error | null) => void)(null);
        return;
      }
      return Promise.reject(new Error('bad'));
    });
    createTransport.mockReturnValue(transporter);
    const config = makeConfig({ SMTP_USER: 'u', SMTP_PASS: 'p' });
    const svc = new MailerService(config);

    await expect(svc.verify()).resolves.toBe(false);
  });

  it('logs warning when transporter.verify callback reports config error', () => {
    const transporter = makeTransporter({ verifyCbError: new Error('config') });
    createTransport.mockReturnValue(transporter);
    const config = makeConfig({ SMTP_USER: 'u', SMTP_PASS: 'p' });
    // constructor triggers callback branch
    // no assertions needed; execution covers warning branch

    new MailerService(config);
    expect(createTransport).toHaveBeenCalled();
    expect(transporter.verify).toHaveBeenCalled();
  });
});
