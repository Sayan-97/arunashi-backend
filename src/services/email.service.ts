import nodemailer from "nodemailer";
import { env } from "@/configs/env";

const transporter = nodemailer.createTransport({
	service: "gmail",
	auth: {
		user: env.GMAIL_USER,
		pass: env.GMAIL_APP_PASSWORD,
	},
});

export async function sendActivationEmail(email: string, token: string) {
	const activationLink = `${env.FRONTEND_URL}/activate?token=${token}`;

	await transporter.sendMail({
		from: `"Arunashi System" <${env.GMAIL_USER}>`,
		to: email,
		subject: "Activate your account",
		html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color: #111;">Welcome to Arunashi</h2>
        <p>Dear Retailer,</p>
        <p>Your registration request has been approved by the admin. Please click the button below to activate your account and set up your password:</p>
        <div style="margin: 25px 0;">
          <a href="${activationLink}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 4px; display: inline-block;">
            Activate Account
          </a>
        </div>
        <p style="font-size: 13px; color: #666;">If the button above does not work, you can copy and paste the following link into your browser:</p>
        <p style="font-size: 13px; color: #666; word-break: break-all;">${activationLink}</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin-top: 30px;" />
        <p style="font-size: 12px; color: #999;">Best Regards,<br/><strong>Arunashi System</strong></p>
      </div>
    `,
	});
}
