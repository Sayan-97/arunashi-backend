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
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; padding: 25px; border: 1px solid #eee; border-radius: 8px; background-color: #ffffff;">
        <div style="text-align: center; border-bottom: 2px solid #627426; padding-bottom: 15px; margin-bottom: 20px;">
          <h2 style="color: #627426; margin: 0; font-size: 22px; text-transform: uppercase; letter-spacing: 1px;">Account Approved</h2>
        </div>

        <p style="font-size: 15px; color: #333;">Dear Retailer,</p>
        <p style="font-size: 15px; color: #333;">We are pleased to inform you that your registration request for the Arunashi Retailer Portal has been approved by the administrator.</p>
        <p style="font-size: 15px; color: #333;">Please click the button below to activate your account and set up your password:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${activationLink}" style="background-color: #627426; color: #ffffff; padding: 12px 28px; text-decoration: none; font-weight: bold; border-radius: 4px; display: inline-block; font-size: 14px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            Activate Account
          </a>
        </div>

        <div style="background-color: #faf9f6; border: 1px solid #eeeeee; border-radius: 6px; padding: 15px; margin: 20px 0; font-size: 13px; color: #666;">
          <p style="margin: 0 0 8px 0; font-weight: bold; color: #627426;">Having trouble with the button?</p>
          <p style="margin: 0; word-break: break-all;">Copy and paste the following link into your browser:<br/>
            <a href="${activationLink}" style="color: #627426; text-decoration: underline;">${activationLink}</a>
          </p>
        </div>

        <hr style="border: 0; border-top: 1px solid #eee; margin-top: 30px;" />
        <p style="font-size: 12px; color: #999; text-align: center; margin-top: 15px;">Best Regards,<br/><strong>Arunashi System</strong></p>
      </div>
    `,
	});
}

export async function sendProductRequestEmail(request: {
	id: string;
	items: any;
	user: {
		name: string;
		email: string;
		company: string | null;
	};
}) {
	const requestIdShort = request.id.split("-")[0].toUpperCase();
	const adminUrl =
		env.NODE_ENV === "production"
			? `https://arunashi-admin.vercel.app/requests/pending-requests?open=${request.id}`
			: `http://localhost:3001/requests/pending-requests?open=${request.id}`;

	const items = Array.isArray(request.items) ? request.items : [];

	// Generate product items HTML rows
	let productsHtml = "";
	for (const item of items) {
		const notesSection =
			item.notes && item.notes.trim().length > 0
				? `<div style="margin-top: 5px; padding: 8px; background-color: #faf9f6; border-left: 2px solid #bec36c; font-size: 12px; font-style: italic; color: #555;">
					<strong>Notes:</strong> "${item.notes.trim()}"
			   </div>`
				: "";

		productsHtml += `
			<tr style="border-bottom: 1px solid #eee;">
				<td style="padding: 12px 8px; vertical-align: top; width: 60px;">
					${
						item.image
							? `<img src="${item.image}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: contain; border: 1px solid #eee; border-radius: 4px;" />`
							: `<div style="width: 50px; height: 50px; background-color: #faf9f6; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #999; border: 1px solid #eee; border-radius: 4px;">No Image</div>`
					}
				</td>
				<td style="padding: 12px 8px; vertical-align: top; text-align: left;">
					<div style="font-weight: bold; font-size: 14px; color: #111;">${item.name}</div>
					<div style="font-size: 12px; color: #666; margin-top: 2px;">Item No: ${item.itemNo || "N/A"}</div>
					${notesSection}
				</td>
				<td style="padding: 12px 8px; vertical-align: top; text-align: right; font-weight: bold; font-size: 14px; color: #333; font-family: monospace;">
					${item.msrp}
				</td>
				<td style="padding: 12px 8px; vertical-align: top; text-align: right; font-size: 13px; font-weight: 600; color: ${item.stockStatus === "In Stock" ? "#487E3E" : "#ef4444"};">
					${item.stockStatus || "Out of Stock"}
				</td>
			</tr>
		`;
	}

	const emailHtml = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; padding: 25px; border: 1px solid #eee; border-radius: 8px; background-color: #ffffff;">
        <div style="text-align: center; border-bottom: 2px solid #627426; padding-bottom: 15px; margin-bottom: 20px;">
          <h2 style="color: #627426; margin: 0; font-size: 22px; text-transform: uppercase; letter-spacing: 1px;">New Product Request</h2>
          <p style="color: #888; margin: 5px 0 0 0; font-size: 12px; font-family: monospace;">REQUEST ID: REQ-${requestIdShort}</p>
        </div>

        <p style="font-size: 15px; color: #333;">Hello Admin,</p>
        <p style="font-size: 15px; color: #333;">A new product request has been submitted by a retailer. Please review the details below:</p>

        <!-- Retailer Details Box -->
        <div style="background-color: #faf9f6; border: 1px solid #eeeeee; border-radius: 6px; padding: 15px; margin: 20px 0;">
          <h3 style="color: #627426; margin-top: 0; margin-bottom: 10px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; text-align: left;">Retailer Details</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 4px 0; color: #666; width: 120px; text-align: left;"><strong>Company:</strong></td>
              <td style="padding: 4px 0; color: #111; text-align: left;">${request.user.company || "N/A"}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #666; text-align: left;"><strong>Contact:</strong></td>
              <td style="padding: 4px 0; color: #111; text-align: left;">${request.user.name}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #666; text-align: left;"><strong>Email:</strong></td>
              <td style="padding: 4px 0; color: #111; text-align: left;"><a href="mailto:${request.user.email}" style="color: #627426; text-decoration: none;">${request.user.email}</a></td>
            </tr>
          </table>
        </div>

        <!-- Products Table -->
        <h3 style="color: #627426; border-bottom: 1px solid #eee; padding-bottom: 8px; margin-top: 25px; margin-bottom: 10px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; text-align: left;">Requested Items (${items.length})</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
          <thead>
            <tr style="border-bottom: 2px solid #eee; background-color: #faf9f6; text-align: left; font-size: 12px; color: #666; text-transform: uppercase;">
              <th style="padding: 8px; font-weight: bold; width: 60px; text-align: left;">Image</th>
              <th style="padding: 8px; font-weight: bold; text-align: left;">Product</th>
              <th style="padding: 8px; font-weight: bold; text-align: right;">MSRP</th>
              <th style="padding: 8px; font-weight: bold; text-align: right;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${productsHtml}
          </tbody>
        </table>

        <!-- Call to action -->
        <div style="text-align: center; margin: 30px 0;">
          <a href="${adminUrl}" style="background-color: #627426; color: #ffffff; padding: 12px 28px; text-decoration: none; font-weight: bold; border-radius: 4px; display: inline-block; font-size: 14px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            Review Request in Admin
          </a>
        </div>

        <hr style="border: 0; border-top: 1px solid #eee; margin-top: 30px;" />
        <p style="font-size: 12px; color: #999; text-align: center; margin-top: 15px;">Best Regards,<br/><strong>Arunashi System</strong></p>
      </div>
    `;

	await transporter.sendMail({
		from: `"Arunashi System" <${env.GMAIL_USER}>`,
		to: env.ADMIN_EMAIL, // Send notification to the admin mailbox
		subject: `New Product Request [REQ-${requestIdShort}] from ${request.user.company || request.user.name}`,
		html: emailHtml,
	});
}
