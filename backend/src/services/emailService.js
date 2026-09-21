const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

// Gmail SMTP Transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Send OTP Email
const sendOTPEmail = async (email, otp, name) => {
  const mailOptions = {
    from: `"CRPC, XYZ" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "CRPC, Placement Portal - Email Verification OTP",
    html: `
      <div style="font-family: Arial, sans-serif; padding:20px;">
        <h2 style="color:#2563eb;">XYZ Group of Institutions Placement Portal</h2>

        <p>Hello <strong>${name}</strong>,</p>

        <p>Your email verification OTP is:</p>

        <h1 style="letter-spacing:5px; color:#16a34a;">
          ${otp}
        </h1>

        <p>This OTP is valid for <strong>10 minutes</strong>.</p>

        <p>If you did not request this OTP, please ignore this email.</p>

        <hr/>

        <p style="font-size:12px; color:gray;">
          XYZ Group of Institutions • Campus Placement Portal
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

const sendPasswordResetEmail = async (email, name, resetLink) => {
  const mailOptions = {
    from: `"Campus Placement Portal" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Campus Placement Portal - Password Reset",
    html: `
      <div style="font-family: Arial, sans-serif; padding:20px;">
        <h2 style="color:#2563eb;">Campus Placement Portal</h2>

        <p>Hello <strong>${name}</strong>,</p>

        <p>
          We received a request to reset your password.
        </p>

        <p>
          Click the button below to create a new password:
        </p>

        <div style="margin:25px 0;">
          <a
            href="${resetLink}"
            style="
              background:#2563eb;
              color:white;
              padding:12px 20px;
              text-decoration:none;
              border-radius:6px;
              display:inline-block;
            "
          >
            Reset Password
          </a>
        </div>

        <p>
          This link is valid for <strong>15 minutes</strong>.
        </p>

        <p>
          If you did not request a password reset, please ignore this email.
        </p>

        <hr/>

        <p style="font-size:12px; color:gray;">
          XYZ Group of Institutions • Campus Placement Portal
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

// Send Welcome Email to Newly Registered Student
const sendWelcomeEmail = async (email, name, studentData = {}) => {
  const { rollNumber, course, branch, college } = studentData;
  const loginUrl = process.env.FRONTEND_URL || "http://localhost:5173/login";

  const mailOptions = {
    from: `"XYZ CRPC Placement Cell" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "🎓 Welcome to XYZ Campus Placement Portal!",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to XYZ CRPC</title>
      </head>
      <body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f6f9; margin: 0; padding: 0; color: #1e293b;">
        <div style="max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;">
          <div style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 30px 24px; text-align: center; color: #ffffff;">
            <div style="font-size: 36px; margin-bottom: 8px;">🎓</div>
            <h1 style="margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 0.5px;">XYZ Group of Institutions</h1>
            <p style="margin: 6px 0 0; font-size: 14px; opacity: 0.92;">Corporate Relations & Placement Centre (CRPC)</p>
          </div>

          <div style="padding: 28px 24px;">
            <div style="display: inline-block; background: #dbeafe; color: #1e40af; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; margin-bottom: 16px;">
              ✓ Account Verified & Activated
            </div>

            <h2 style="margin: 0 0 10px; font-size: 18px; color: #0f172a;">Welcome, ${name}!</h2>
            <p style="margin: 0 0 16px; font-size: 14px; color: #475569; line-height: 1.6;">
              Your student registration on the <strong>XYZ Campus Placement Portal</strong> has been successfully verified. You now have full access to view placement drives, upload your resume, apply for internships, and participate in TPO hackathons.
            </p>

            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin: 18px 0;">
              <div style="font-size: 11px; font-weight: 800; color: #2563eb; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px;">
                Verified Student Profile Credentials
              </div>
              <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px;">
                <span style="color: #64748b;">Roll Number:</span>
                <strong style="color: #0f172a;">${rollNumber || "Not Assigned"}</strong>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px;">
                <span style="color: #64748b;">Course & Branch:</span>
                <strong style="color: #0f172a;">${course || "B.Tech"} - ${branch || "General"}</strong>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px;">
                <span style="color: #64748b;">College:</span>
                <strong style="color: #0f172a;">${college || "XYZ Group of Institutions"}</strong>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px;">
                <span style="color: #64748b;">Registered Email:</span>
                <strong style="color: #0f172a;">${email}</strong>
              </div>
            </div>

            <h3 style="margin: 22px 0 12px; font-size: 15px; color: #0f172a;">3 Easy Steps to Get Placement Ready:</h3>
            <div style="margin: 14px 0;">
              <div style="display: flex; align-items: flex-start; margin-bottom: 12px;">
                <div style="width: 24px; height: 24px; border-radius: 50%; background: #2563eb; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; margin-right: 12px; flex-shrink: 0;">1</div>
                <div style="font-size: 13px; color: #334155; line-height: 1.4;">
                  <strong>Complete Academic Profile:</strong> Enter your CGPA, 10th & 12th marks, and technical skills to qualify for campus drive cutoffs.
                </div>
              </div>
              <div style="display: flex; align-items: flex-start; margin-bottom: 12px;">
                <div style="width: 24px; height: 24px; border-radius: 50%; background: #2563eb; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; margin-right: 12px; flex-shrink: 0;">2</div>
                <div style="font-size: 13px; color: #334155; line-height: 1.4;">
                  <strong>Upload Primary Resume:</strong> Upload your PDF resume so recruiting companies can review your profile.
                </div>
              </div>
              <div style="display: flex; align-items: flex-start; margin-bottom: 12px;">
                <div style="width: 24px; height: 24px; border-radius: 50%; background: #2563eb; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; margin-right: 12px; flex-shrink: 0;">3</div>
                <div style="font-size: 13px; color: #334155; line-height: 1.4;">
                  <strong>Apply for Live Drives:</strong> Explore Regular, Dream (6 - 10 LPA), and Super Dream (≥ 10 LPA) drives posted by TPO.
                </div>
              </div>
            </div>

            <div style="text-align: center; margin: 28px 0 16px;">
              <a href="${loginUrl}" style="background: #2563eb; color: #ffffff; padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 700; text-decoration: none; display: inline-block; box-shadow: 0 3px 10px rgba(37,99,235,0.3);">
                Sign In to Career Cockpit →
              </a>
            </div>
          </div>

          <div style="background: #0f172a; color: #94a3b8; padding: 20px 24px; text-align: center; font-size: 12px; line-height: 1.6;">
            <strong>Corporate Relations & Placement Centre (CRPC)</strong><br/>
            XYZ Group of Institutions • Delhi-NCR<br/>
            This is an automated institutional message. Please do not reply directly to this email.
          </div>
        </div>
      </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
};

// Send Offer Release Email to Selected Candidate
const sendOfferReleaseEmail = async (email, name, offerDetails = {}) => {
  const {
    jobTitle,
    companyName,
    packageAmount,
    baseSalary,
    joiningDate,
    offerLetterUrl,
  } = offerDetails;

  const pkg = Number(packageAmount) || 0;
  const isSuperDream = pkg >= 10;
  const isDream = pkg >= 6 && pkg < 10;
  const tier = isSuperDream ? "🔥 Super Dream Tier" : isDream ? "⭐ Dream Tier" : "Regular Placement";
  const tierBg = isSuperDream ? "#ede9fe" : isDream ? "#fef3c7" : "#e0f2fe";
  const tierColor = isSuperDream ? "#7c3aed" : isDream ? "#b45309" : "#0369a1";

  const formattedJoining = joiningDate && !isNaN(new Date(joiningDate).getTime())
    ? new Date(joiningDate).toLocaleDateString("en-IN", { dateStyle: "long" })
    : "To be communicated by HR";

  const loginUrl = process.env.FRONTEND_URL || "http://localhost:5173/login";

  let attachments = [];
  const safeFilename = `Offer_Letter_${(companyName || "Company").replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;

  if (offerDetails.localPdfPath && fs.existsSync(offerDetails.localPdfPath)) {
    attachments.push({
      filename: safeFilename,
      path: offerDetails.localPdfPath,
    });
  } else if (offerLetterUrl && typeof offerLetterUrl === "string") {
    const trimmed = offerLetterUrl.trim();
    if (trimmed.startsWith("http")) {
      attachments.push({
        filename: safeFilename,
        path: trimmed,
      });
    } else if (trimmed.startsWith("/uploads/")) {
      const localPath = path.join(__dirname, "../../", trimmed);
      if (fs.existsSync(localPath)) {
        attachments.push({
          filename: safeFilename,
          path: localPath,
        });
      }
    }
  }

  const backendBase = process.env.BACKEND_URL || "http://localhost:5000";
  const fullOfferLetterUrl = offerLetterUrl
    ? (offerLetterUrl.startsWith("http") ? offerLetterUrl : `${backendBase}${offerLetterUrl}`)
    : null;

  const mailOptions = {
    from: `"XYZ CRPC Placement Cell" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `🎉 Congratulations! Campus Placement Offer from ${companyName || "Visiting Company"}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Campus Placement Offer</title>
      </head>
      <body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; color: #1e293b;">
        <div style="max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 6px 20px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;">
          <div style="background: linear-gradient(135deg, #065f46 0%, #059669 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
            <div style="font-size: 42px; margin-bottom: 6px;">🎉</div>
            <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 0.5px;">Job Offer Released!</h1>
            <p style="margin: 6px 0 0; font-size: 14px; opacity: 0.95;">XYZ Corporate Relations & Placement Centre</p>
          </div>

          <div style="padding: 28px 24px;">
            <p style="margin: 0 0 12px; font-size: 15px; color: #334155;">
              Dear <strong>${name}</strong>,
            </p>
            <p style="margin: 0 0 18px; font-size: 14px; color: #475569; line-height: 1.6;">
              Heartiest congratulations! We take great pleasure in notifying you that <strong>${companyName || "The Recruiting Company"}</strong> has rolled out an official campus placement offer for you through the XYZ CRPC placement drive.
            </p>

            <div style="background: #f0fdf4; border: 2px solid #86efac; border-radius: 10px; padding: 20px; margin: 20px 0;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <span style="font-size: 12px; font-weight: 800; color: #15803d; text-transform: uppercase;">Offer Snapshot</span>
                <span style="background: ${tierBg}; color: ${tierColor}; padding: 3px 10px; border-radius: 6px; font-size: 11px; font-weight: 700;">
                  ${tier}
                </span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #dcfce7; font-size: 13px;">
                <span style="color: #166534;">Company:</span>
                <strong style="color: #14532d;">${companyName}</strong>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #dcfce7; font-size: 13px;">
                <span style="color: #166534;">Role / Designation:</span>
                <strong style="color: #14532d;">${jobTitle}</strong>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #dcfce7; font-size: 13px;">
                <span style="color: #166534;">Total CTC Package:</span>
                <strong style="color: #047857; font-size: 16px;">₹${packageAmount} LPA</strong>
              </div>
              ${baseSalary ? `
              <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #dcfce7; font-size: 13px;">
                <span style="color: #166534;">Base Salary:</span>
                <strong style="color: #14532d;">₹${baseSalary} LPA</strong>
              </div>` : ""}
              <div style="display: flex; justify-content: space-between; padding: 8px 0; font-size: 13px;">
                <span style="color: #166534;">Tentative Joining:</span>
                <strong style="color: #14532d;">${formattedJoining}</strong>
              </div>
            </div>

            <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 14px 16px; margin: 20px 0; font-size: 12px; color: #1e40af; line-height: 1.6;">
              <strong>📌 XYZ Placement Policy Guidance:</strong><br/>
              Please log in to your student dashboard to review the complete offer terms and submit your acceptance response.<br/>
              ${pkg < 6
                ? "As per policy, Regular drives (< 6 LPA) are locked under the 1-Offer rule, but you are <strong>fully eligible to apply for Dream (6 - 10 LPA) and Super Dream (≥ 10 LPA)</strong> drives to upgrade your CTC!"
                : "🌟 Congratulations on securing an elite Dream tier placement! You have set a commendable benchmark."}
            </div>

            <div style="text-align: center; margin: 26px 0 16px;">
              <a href="${loginUrl}" style="background: #059669; color: #ffffff; padding: 12px 26px; border-radius: 8px; font-size: 14px; font-weight: 700; text-decoration: none; display: inline-block; box-shadow: 0 3px 10px rgba(5,150,105,0.3); margin: 6px;">
                ✓ View & Accept Offer in Dashboard →
              </a>
              ${fullOfferLetterUrl ? `
              <a href="${fullOfferLetterUrl}" target="_blank" rel="noreferrer" style="background: #ffffff; color: #0284c7; border: 1px solid #0284c7; padding: 11px 22px; border-radius: 8px; font-size: 14px; font-weight: 700; text-decoration: none; display: inline-block; margin: 6px;">
                📄 Download Offer Letter PDF
              </a>` : ""}
            </div>

            ${offerLetterUrl && attachments.length > 0 ? `
            <p style="font-size: 12px; color: #64748b; text-align: center; margin-top: 10px;">
              📎 The official offer letter has also been attached to this email.
            </p>` : ""}
          </div>

          <div style="background: #0f172a; color: #94a3b8; padding: 20px 24px; text-align: center; font-size: 12px; line-height: 1.6;">
            <strong>Corporate Relations & Placement Centre (CRPC)</strong><br/>
            XYZ Group of Institutions • Delhi-NCR<br/>
            Wishing you outstanding success in your upcoming professional career!
          </div>
        </div>
      </body>
      </html>
    `,
    attachments,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (err) {
    if (attachments.length > 0) {
      console.warn("Retrying offer email without remote attachment:", err.message);
      mailOptions.attachments = [];
      await transporter.sendMail(mailOptions);
    } else {
      throw err;
    }
  }
};

// Send Workshop Registration Confirmation Email (Free or Paid via Razorpay)
const sendWorkshopRegistrationEmail = async (student, workshop, paymentDetails = {}) => {
  const isPaid = workshop.isPaid && (workshop.fee || 0) > 0;
  const feeText = isPaid ? `₹${workshop.fee}` : "Free (Sponsored)";
  const paymentStatus = paymentDetails.paymentStatus || (isPaid ? "Completed" : "Complimentary");
  const paymentId = paymentDetails.paymentId || (isPaid ? "N/A" : "FREE_TIER");
  const orderId = paymentDetails.orderId || "N/A";
  const portalUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/student/dashboard`;

  const startFormatted = workshop.startDate
    ? new Date(workshop.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "TBA";
  const endFormatted = workshop.endDate
    ? new Date(workshop.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "TBA";

  const registeredAtFormatted = paymentDetails.registeredAt
    ? new Date(paymentDetails.registeredAt).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : new Date().toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });

  const subject = isPaid
    ? `🧾 Payment Receipt & Workshop Pass: ${workshop.title} (₹${workshop.fee}) | XYZ CRPC`
    : `🎓 Workshop Registration Confirmed: ${workshop.title} | XYZ CRPC`;

  const mailOptions = {
    from: `"CRPC Placement Cell, XYZ" <${process.env.EMAIL_USER}>`,
    to: student.email,
    subject,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #1e293b;">
        <div style="max-width: 620px; margin: 30px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;">
          
          <!-- Header Banner -->
          <div style="background: linear-gradient(135deg, #0b132b 0%, #1e3a8a 55%, #0284c7 100%); padding: 36px 28px 30px; text-align: center; color: #ffffff;">
            <div style="display: inline-block; background: rgba(255,255,255,0.14); border: 1px solid rgba(255,255,255,0.25); padding: 6px 16px; border-radius: 9999px; font-size: 11px; font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase; margin-bottom: 16px;">
              🏛️ XYZ CRPC • SKILL DEVELOPMENT
            </div>
            
            <!-- Big Success Check Badge -->
            <div style="width: 58px; height: 58px; background: #10b981; border: 4px solid rgba(255,255,255,0.25); border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(16,185,129,0.4);">
              <span style="font-size: 30px; line-height: 58px; color: #ffffff; font-weight: 900;">✓</span>
            </div>

            <h1 style="margin: 0 0 8px; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">
              ${isPaid ? "Payment Successful & Seat Reserved!" : "Seat Confirmed!"}
            </h1>
            <p style="margin: 0; font-size: 14px; opacity: 0.92; line-height: 1.5;">
              ${isPaid ? "Your payment has been processed and your workshop pass is ready." : "Your complimentary registration has been reserved."}
            </p>
          </div>

          <!-- Content Body -->
          <div style="padding: 28px 24px;">
            <p style="font-size: 15px; margin: 0 0 16px; color: #334155; line-height: 1.6;">
              Dear <strong>${student.name || "Student"}</strong>,
            </p>
            <p style="font-size: 14px; margin: 0 0 22px; color: #64748b; line-height: 1.6;">
              Congratulations! Your enrolment for <strong>"${workshop.title}"</strong> has been successfully confirmed. Below are your official receipt and workshop admission credentials.
            </p>

            ${isPaid ? `
            <!-- Payment Receipt Card -->
            <div style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px; box-shadow: 0 2px 6px rgba(0,0,0,0.02);">
              <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1.5px dashed #cbd5e1; padding-bottom: 14px; margin-bottom: 14px;">
                <div>
                  <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 700; color: #64748b;">Official Tax Invoice / Receipt</span>
                  <div style="font-size: 26px; font-weight: 900; color: #0f172a; margin-top: 4px;">
                    ₹${workshop.fee} <span style="font-size: 13px; font-weight: 600; color: #64748b;">INR</span>
                  </div>
                </div>
                <div style="text-align: right;">
                  <span style="display: inline-block; background: #ecfdf5; border: 1px solid #6ee7b7; color: #065f46; font-size: 11px; font-weight: 800; padding: 5px 12px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.5px;">
                    ✓ Paid via Razorpay
                  </span>
                </div>
              </div>

              <table style="width: 100%; font-size: 13px; line-height: 1.9; color: #334155;">
                <tr>
                  <td style="width: 45%; color: #64748b;">Payment Gateway:</td>
                  <td style="font-weight: 600; color: #0f172a;">Razorpay Test / Production</td>
                </tr>
                <tr>
                  <td style="color: #64748b;">Razorpay Payment ID:</td>
                  <td style="font-weight: 700; font-family: monospace; color: #0284c7; word-break: break-all;">${paymentId}</td>
                </tr>
                <tr>
                  <td style="color: #64748b;">Razorpay Order ID:</td>
                  <td style="font-weight: 600; font-family: monospace; color: #475569; word-break: break-all;">${orderId}</td>
                </tr>
                <tr>
                  <td style="color: #64748b;">Transaction Date & Time:</td>
                  <td style="font-weight: 600; color: #0f172a;">${registeredAtFormatted}</td>
                </tr>
                <tr>
                  <td style="color: #64748b;">Payment Status:</td>
                  <td style="font-weight: 800; color: #16a34a;">CAPTURED & VERIFIED</td>
                </tr>
              </table>
            </div>
            ` : `
            <!-- Free Workshop Complimentary Box -->
            <div style="background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 12px; padding: 18px 20px; margin-bottom: 24px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 700; color: #166534;">Enrolment Category</span>
                  <div style="font-size: 20px; font-weight: 800; color: #15803d; margin-top: 4px;">
                    Complimentary (100% Sponsored)
                  </div>
                </div>
                <span style="background: #dcfce7; color: #166534; font-size: 12px; font-weight: 800; padding: 6px 12px; border-radius: 9999px;">
                  ✓ Confirmed
                </span>
              </div>
            </div>
            `}

            <!-- Workshop Pass / Event Details Card -->
            <div style="background: #ffffff; border: 2px dashed #94a3b8; border-radius: 14px; padding: 22px; margin-bottom: 24px; position: relative;">
              <div style="border-bottom: 1px solid #f1f5f9; padding-bottom: 12px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <span style="font-size: 10px; font-weight: 800; color: #2563eb; text-transform: uppercase; letter-spacing: 1px;">DIGITAL ADMISSION PASS</span>
                  <h3 style="margin: 4px 0 0; font-size: 17px; font-weight: 800; color: #0f172a;">${workshop.title}</h3>
                </div>
                <span style="background: #eff6ff; color: #1d4ed8; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 6px;">
                  ${workshop.mode || "Online"}
                </span>
              </div>

              <table style="width: 100%; font-size: 13px; line-height: 1.9; color: #334155;">
                <tr>
                  <td style="width: 35%; color: #64748b;">👨‍🏫 Instructor:</td>
                  <td style="font-weight: 700; color: #0f172a;">${workshop.instructor || "Industry Expert"}</td>
                </tr>
                <tr>
                  <td style="color: #64748b;">⏱️ Duration:</td>
                  <td style="font-weight: 600; color: #0f172a;">${workshop.duration || "3 Days"}</td>
                </tr>
                <tr>
                  <td style="color: #64748b;">📅 Workshop Dates:</td>
                  <td style="font-weight: 700; color: #0f172a;">${startFormatted} – ${endFormatted}</td>
                </tr>
                <tr>
                  <td style="color: #64748b;">📍 Venue / Platform:</td>
                  <td style="font-weight: 600; color: #0284c7;">${workshop.venue || "Virtual Meeting Arena"}</td>
                </tr>
              </table>

              <!-- Candidate Verification Strip -->
              <div style="background: #f8fafc; border-radius: 8px; padding: 12px 14px; margin-top: 14px; border: 1px solid #e2e8f0;">
                <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">
                  Registered Attendee Details
                </div>
                <div style="display: flex; flex-wrap: wrap; justify-content: space-between; font-size: 12px; color: #334155;">
                  <span><strong>Student:</strong> ${student.name || "Student"}</span>
                  <span><strong>Roll No:</strong> ${student.rollNumber || "N/A"}</span>
                  <span><strong>Branch:</strong> ${student.branch || "Engineering"}</span>
                </div>
              </div>
            </div>

            <!-- Important Instructions -->
            <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 14px 16px; margin-bottom: 24px;">
              <div style="font-size: 12px; font-weight: 800; color: #92400e; margin-bottom: 6px;">
                📌 Important Guidelines for Attendees:
              </div>
              <ul style="margin: 0; padding-left: 18px; font-size: 12px; color: #78350f; line-height: 1.6;">
                <li>Please carry your College ID Card / keep this digital pass accessible during the workshop.</li>
                <li>Online session links (or lab room allotment) will also be displayed directly in your student dashboard.</li>
                <li>A verified institutional certificate will be awarded upon 100% session attendance and project submission.</li>
              </ul>
            </div>

            <!-- Action Button CTA -->
            <div style="text-align: center; margin: 28px 0 12px;">
              <a href="${portalUrl}" style="background: linear-gradient(135deg, #1d4ed8 0%, #0284c7 100%); color: #ffffff; padding: 14px 32px; border-radius: 10px; font-size: 14px; font-weight: 800; text-decoration: none; display: inline-block; box-shadow: 0 4px 15px rgba(2,132,199,0.35); letter-spacing: 0.3px;">
                🎫 Open Student Dashboard & View Pass →
              </a>
            </div>

            <p style="text-align: center; font-size: 12px; color: #94a3b8; margin-top: 14px;">
              Have questions? Contact your department placement representative or reply to CRPC Support.
            </p>
          </div>

          <!-- Footer -->
          <div style="background: #0f172a; color: #94a3b8; padding: 22px 24px; text-align: center; font-size: 11px; line-height: 1.7; border-top: 1px solid #1e293b;">
            <strong style="color: #f1f5f9; font-size: 12px;">Corporate Relations & Placement Centre (CRPC)</strong><br/>
            XYZ Group of Institutions • Delhi-NCR<br/>
            This is an automated transaction receipt and confirmation slip. Retain this email for your records.
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✓ Workshop confirmation email dispatched to ${student.email} (MessageID: ${info.messageId})`);
    return info;
  } catch (err) {
    console.error("Failed to send workshop confirmation email:", err.message);
    throw err;
  }
};

module.exports = {
  sendOTPEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendOfferReleaseEmail,
  sendWorkshopRegistrationEmail,
};