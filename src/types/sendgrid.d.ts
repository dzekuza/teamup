declare module '@sendgrid/mail' {
  interface MailData {
    to: string;
    from: string;
    subject: string;
    text?: string;
    html?: string;
  }

  interface SendGridMail {
    send(data: MailData): Promise<[any, {}]>;
    setApiKey(apiKey: string): void;
  }

  const mail: SendGridMail;
  export default mail;
} 