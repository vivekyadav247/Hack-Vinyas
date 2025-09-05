const nodemailer = require("nodemailer");

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  async initializeTransporter() {
    try {
      // Check if email credentials are provided
      if (
        !process.env.EMAIL_USER ||
        !process.env.EMAIL_PASS ||
        process.env.EMAIL_USER === "your_email@gmail.com" ||
        process.env.EMAIL_PASS === "your_app_password"
      ) {
        console.log(
          "⚠️  Email service skipped - No valid credentials provided"
        );
        console.log(
          "   Please configure EMAIL_USER and EMAIL_PASS in .env file for email functionality"
        );
        return;
      }

      this.transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
        secure: true,
        tls: {
          rejectUnauthorized: false,
        },
      });

      // Verify connection
      await this.transporter.verify();
      console.log("✅ Email service initialized successfully");
    } catch (error) {
      console.error("❌ Email service initialization failed:", error.message);
      console.log("⚠️  Email service will be unavailable");
      console.log("   Please check your email credentials in .env file");
      this.transporter = null;
    }
  }

  async sendOTP(email, otp, purpose = "admin_login", recipientName = "") {
    try {
      if (!this.transporter) {
        console.log("⚠️  Email service not available - OTP cannot be sent");
        return {
          success: false,
          message: "Email service not configured",
        };
      }

      const subject = this.getOTPSubject(purpose);
      const html = this.getOTPTemplate(otp, purpose, recipientName);

      const mailOptions = {
        from: {
          name: "Hack Vinyas 2K25",
          address: process.env.EMAIL_USER,
        },
        to: email,
        subject: subject,
        html: html,
        priority: "high",
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ OTP sent successfully to ${email}`);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error("❌ Failed to send OTP:", error.message);
      return { success: false, error: error.message };
    }
  }

  async sendWelcomeEmail(email, teamName, leaderName, customMessage) {
    try {
      if (!this.transporter) {
        console.log(
          "⚠️  Email service not available - Welcome email cannot be sent"
        );
        return {
          success: false,
          message: "Email service not configured",
        };
      }

      const subject = `Welcome to Hack Vinyas Hackathon 2025 - Team ${teamName}`;
      const html = this.getWelcomeTemplate(teamName, leaderName, customMessage);

      const mailOptions = {
        from: {
          name: "Hack Vinyas Hackathon",
          address: process.env.EMAIL_USER,
        },
        to: email,
        subject: subject,
        html: html,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Welcome email sent successfully to ${email}`);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error("❌ Failed to send welcome email:", error.message);
      return { success: false, error: error.message };
    }
  }

  async sendRegistrationSuccess(teamData) {
    try {
      if (!this.transporter) {
        console.log(
          "⚠️  Email service not available - Registration success email cannot be sent"
        );
        return {
          success: false,
          message: "Email service not configured",
        };
      }

      const subject = `🎉 Registration Confirmed - Team ${teamData.teamName} | Hack Vinyas Hackathon 2025`;
      const html = this.getRegistrationSuccessTemplate(teamData);

      const mailOptions = {
        from: {
          name: "Hack Vinyas Hackathon",
          address: process.env.EMAIL_USER,
        },
        to: teamData.leaderEmail,
        subject: subject,
        html: html,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(
        `✅ Registration success email sent to ${teamData.leaderEmail}`
      );
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error(
        "❌ Failed to send registration success email:",
        error.message
      );
      return { success: false, error: error.message };
    }
  }

  async sendTeamNotification(email, teamName, subject, message, type = "info") {
    try {
      const html = this.getTeamNotificationTemplate(teamName, message, type);

      const mailOptions = {
        from: {
          name: "Hack Vinyas Hackathon",
          address: process.env.EMAIL_USER,
        },
        to: email,
        subject: subject,
        html: html,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Team notification sent successfully to ${email}`);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error("❌ Failed to send team notification:", error.message);
      return { success: false, error: error.message };
    }
  }

  async sendBulkEmails(emailList, subject, message, type = "info") {
    const results = [];

    for (const emailData of emailList) {
      try {
        const result = await this.sendTeamNotification(
          emailData.email,
          emailData.teamName,
          subject,
          message,
          type
        );
        results.push({
          email: emailData.email,
          teamName: emailData.teamName,
          success: result.success,
          messageId: result.messageId,
        });

        // Add delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        results.push({
          email: emailData.email,
          teamName: emailData.teamName,
          success: false,
          error: error.message,
        });
      }
    }

    return results;
  }

  getOTPSubject(purpose) {
    const subjects = {
      admin_login: "Hack Vinyas Hackathon - Admin Login OTP",
      password_reset: "Hack Vinyas Hackathon - Password Reset OTP",
      email_verification: "Hack Vinyas Hackathon - Email Verification OTP",
    };
    return subjects[purpose] || "Hack Vinyas Hackathon - Verification OTP";
  }

  getOTPTemplate(otp, purpose, recipientName = "") {
    const purposeText = {
      admin_login: "admin login",
      password_reset: "password reset",
      email_verification: "email verification",
      team_registration: "team registration",
    };

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>OTP Verification - Hack Vinyas Hackathon</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { 
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                    line-height: 1.6; 
                    color: #333; 
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    padding: 20px; 
                }
                .container { 
                    max-width: 600px; 
                    margin: 0 auto; 
                    background: white; 
                    border-radius: 20px; 
                    overflow: hidden;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.1); 
                }
                .header { 
                    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); 
                    color: white; 
                    padding: 40px 30px; 
                    text-align: center; 
                }
                .logo { 
                    font-size: 32px; 
                    font-weight: bold; 
                    margin-bottom: 10px; 
                    text-shadow: 0 2px 4px rgba(0,0,0,0.2);
                }
                .header-subtitle { 
                    font-size: 16px; 
                    opacity: 0.9; 
                }
                .content { 
                    padding: 40px 30px; 
                }
                .greeting { 
                    font-size: 20px; 
                    color: #2563eb; 
                    margin-bottom: 20px; 
                    font-weight: 600;
                }
                .otp-section { 
                    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); 
                    border: 3px dashed #2563eb; 
                    border-radius: 15px; 
                    padding: 30px; 
                    text-align: center; 
                    margin: 30px 0; 
                }
                .otp-label { 
                    font-size: 16px; 
                    color: #64748b; 
                    margin-bottom: 15px; 
                }
                .otp-code { 
                    font-size: 42px; 
                    font-weight: bold; 
                    color: #2563eb; 
                    letter-spacing: 8px; 
                    background: white;
                    padding: 15px 25px;
                    border-radius: 10px;
                    display: inline-block;
                    box-shadow: 0 4px 15px rgba(37, 99, 235, 0.2);
                }
                .info-box { 
                    background: #f0f9ff; 
                    border-left: 5px solid #0ea5e9; 
                    padding: 20px; 
                    margin: 25px 0; 
                    border-radius: 0 10px 10px 0;
                }
                .info-box h3 { 
                    color: #0369a1; 
                    margin-bottom: 10px; 
                }
                .info-list { 
                    list-style: none; 
                    padding: 0; 
                }
                .info-list li { 
                    padding: 5px 0; 
                    color: #0c4a6e; 
                    position: relative;
                    padding-left: 25px;
                }
                .info-list li:before { 
                    content: "✓"; 
                    position: absolute; 
                    left: 0; 
                    color: #10b981; 
                    font-weight: bold; 
                }
                .warning { 
                    background: #fef2f2; 
                    border-left: 5px solid #ef4444; 
                    padding: 20px; 
                    margin: 25px 0; 
                    border-radius: 0 10px 10px 0;
                }
                .warning h3 { 
                    color: #dc2626; 
                    margin-bottom: 10px; 
                }
                .footer { 
                    background: #f8fafc; 
                    padding: 30px; 
                    text-align: center; 
                    color: #64748b; 
                    border-top: 1px solid #e2e8f0;
                }
                .footer-logo { 
                    font-size: 18px; 
                    font-weight: bold; 
                    color: #2563eb; 
                    margin-bottom: 10px; 
                }
                .social-links { 
                    margin: 20px 0; 
                }
                .social-links a { 
                    display: inline-block; 
                    margin: 0 10px; 
                    color: #64748b; 
                    text-decoration: none; 
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">⚡ HACK VINYAS HACKATHON</div>
                    <div class="header-subtitle">Secure OTP Verification</div>
                </div>
                
                <div class="content">
                    <div class="greeting">
                        Hello ${recipientName || "there"}! 👋
                    </div>
                    
                    <p>You have requested an OTP for <strong>${
                      purposeText[purpose] || "verification"
                    }</strong>. Please use the code below to proceed:</p>
                    
                    <div class="otp-section">
                        <div class="otp-label">Your verification code is:</div>
                        <div class="otp-code">${otp}</div>
                    </div>
                    
                    <div class="info-box">
                        <h3>📋 Important Instructions:</h3>
                        <ul class="info-list">
                            <li>This OTP is valid for <strong>10 minutes</strong> only</li>
                            <li>Use this code to complete your ${
                              purposeText[purpose] || "verification"
                            }</li>
                            <li>Do not share this OTP with anyone</li>
                            <li>If you didn't request this, please ignore this email</li>
                        </ul>
                    </div>
                    
                    <div class="warning">
                        <h3>🔒 Security Notice</h3>
                        <p>If you did not request this OTP, please ignore this email and contact our support team immediately at <strong>vivekyad240706@gmail.com</strong></p>
                    </div>
                </div>
                
                <div class="footer">
                    <div class="footer-logo">HACK VINYAS HACKATHON 2025</div>
                    <p>© 2025 Hack Vinyas Hackathon. All rights reserved.</p>
                    <div class="social-links">
                        <a href="#">Website</a> | 
                        <a href="#">Instagram</a> | 
                        <a href="#">LinkedIn</a>
                    </div>
                    <p style="font-size: 12px; margin-top: 15px;">This is an automated email. Please do not reply to this message.</p>
                </div>
            </div>
        </body>
        </html>
        `;
  }

  getWelcomeTemplate(teamName, leaderName, customMessage) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Welcome to Hack Vinyas Hackathon</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { 
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                    line-height: 1.6; 
                    color: #333; 
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    padding: 20px; 
                }
                .container { 
                    max-width: 600px; 
                    margin: 0 auto; 
                    background: white; 
                    border-radius: 20px; 
                    overflow: hidden;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.1); 
                }
                .header { 
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
                    color: white; 
                    padding: 40px 30px; 
                    text-align: center; 
                }
                .logo { 
                    font-size: 32px; 
                    font-weight: bold; 
                    margin-bottom: 10px; 
                    text-shadow: 0 2px 4px rgba(0,0,0,0.2);
                }
                .header-subtitle { 
                    font-size: 16px; 
                    opacity: 0.9; 
                }
                .content { 
                    padding: 40px 30px; 
                }
                .greeting { 
                    font-size: 24px; 
                    color: #059669; 
                    margin-bottom: 20px; 
                    font-weight: 600;
                }
                .team-info { 
                    background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); 
                    border: 2px solid #10b981; 
                    border-radius: 15px; 
                    padding: 25px; 
                    margin: 25px 0; 
                    text-align: center;
                }
                .team-name { 
                    font-size: 24px; 
                    font-weight: bold; 
                    color: #065f46; 
                    margin-bottom: 10px; 
                }
                .leader-name { 
                    font-size: 18px; 
                    color: #047857; 
                }
                .message-box { 
                    background: #f0f9ff; 
                    border-left: 5px solid #0ea5e9; 
                    padding: 25px; 
                    margin: 25px 0; 
                    border-radius: 0 15px 15px 0;
                    font-size: 16px;
                    line-height: 1.8;
                }
                .cta-section { 
                    text-align: center; 
                    margin: 30px 0; 
                }
                .cta-button { 
                    display: inline-block; 
                    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); 
                    color: white; 
                    padding: 15px 30px; 
                    text-decoration: none; 
                    border-radius: 25px; 
                    font-weight: bold; 
                    font-size: 16px;
                    box-shadow: 0 4px 15px rgba(37, 99, 235, 0.3);
                    transition: transform 0.2s;
                }
                .cta-button:hover { 
                    transform: translateY(-2px); 
                }
                .info-grid { 
                    display: grid; 
                    grid-template-columns: 1fr 1fr; 
                    gap: 20px; 
                    margin: 30px 0; 
                }
                .info-card { 
                    background: #f8fafc; 
                    padding: 20px; 
                    border-radius: 10px; 
                    text-align: center; 
                    border: 1px solid #e2e8f0;
                }
                .info-card h3 { 
                    color: #1e40af; 
                    margin-bottom: 10px; 
                    font-size: 16px;
                }
                .footer { 
                    background: #f8fafc; 
                    padding: 30px; 
                    text-align: center; 
                    color: #64748b; 
                    border-top: 1px solid #e2e8f0;
                }
                @media (max-width: 600px) {
                    .info-grid { grid-template-columns: 1fr; }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">⚡ HACK VINYAS HACKATHON</div>
                    <div class="header-subtitle">Welcome Message</div>
                </div>
                
                <div class="content">
                    <div class="greeting">
                        🎉 Welcome to Hack Vinyas Hackathon 2025!
                    </div>
                    
                    <div class="team-info">
                        <div class="team-name">Team: ${teamName}</div>
                        <div class="leader-name">Leader: ${leaderName}</div>
                    </div>
                    
                    <div class="message-box">
                        ${customMessage.replace(/\n/g, "<br>")}
                    </div>
                    
                    <div class="info-grid">
                        <div class="info-card">
                            <h3>📅 Event Date</h3>
                            <p>TBA - Stay tuned!</p>
                        </div>
                        <div class="info-card">
                            <h3>🏆 Prize Pool</h3>
                            <p>Exciting rewards await!</p>
                        </div>
                        <div class="info-card">
                            <h3>👥 Team Size</h3>
                            <p>1-4 members per team</p>
                        </div>
                        <div class="info-card">
                            <h3>💻 Format</h3>
                            <p>Hybrid Event</p>
                        </div>
                    </div>
                    
                    <div style="background: #fffbeb; border-left: 5px solid #f59e0b; padding: 20px; margin: 25px 0; border-radius: 0 10px 10px 0;">
                        <h3 style="color: #92400e; margin-bottom: 15px;">📢 Important Updates</h3>
                        <p style="color: #78350f;">Keep checking your email for important announcements, schedule updates, and submission guidelines. Follow our social media for real-time updates!</p>
                    </div>
                </div>
                
                <div class="footer">
                    <div style="font-size: 18px; font-weight: bold; color: #10b981; margin-bottom: 10px;">HACK VINYAS HACKATHON 2025</div>
                    <p>© 2025 Hack Vinyas Hackathon. All rights reserved.</p>
                    <div style="margin: 20px 0;">
                        <a href="#" style="margin: 0 10px; color: #64748b; text-decoration: none;">Website</a> | 
                        <a href="#" style="margin: 0 10px; color: #64748b; text-decoration: none;">Instagram</a> | 
                        <a href="#" style="margin: 0 10px; color: #64748b; text-decoration: none;">LinkedIn</a>
                    </div>
                    <p style="font-size: 12px; margin-top: 15px;">This message was sent by the Hack Vinyas Hackathon admin team.</p>
                </div>
            </div>
        </body>
        </html>
        `;
  }

  getRegistrationSuccessTemplate(teamData) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Registration Successful - Hack Vinyas Hackathon</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { 
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                    line-height: 1.6; 
                    color: #333; 
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    padding: 20px; 
                }
                .container { 
                    max-width: 600px; 
                    margin: 0 auto; 
                    background: white; 
                    border-radius: 20px; 
                    overflow: hidden;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.1); 
                }
                .header { 
                    background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%); 
                    color: white; 
                    padding: 40px 30px; 
                    text-align: center; 
                }
                .logo { 
                    font-size: 32px; 
                    font-weight: bold; 
                    margin-bottom: 10px; 
                    text-shadow: 0 2px 4px rgba(0,0,0,0.2);
                }
                .header-subtitle { 
                    font-size: 16px; 
                    opacity: 0.9; 
                }
                .success-icon { 
                    font-size: 60px; 
                    margin: 20px 0; 
                }
                .content { 
                    padding: 40px 30px; 
                }
                .greeting { 
                    font-size: 24px; 
                    color: #7c3aed; 
                    margin-bottom: 20px; 
                    font-weight: 600;
                    text-align: center;
                }
                .team-details { 
                    background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%); 
                    border: 2px solid #7c3aed; 
                    border-radius: 15px; 
                    padding: 25px; 
                    margin: 25px 0; 
                }
                .team-name { 
                    font-size: 24px; 
                    font-weight: bold; 
                    color: #581c87; 
                    margin-bottom: 15px; 
                    text-align: center;
                }
                .detail-row { 
                    display: flex; 
                    justify-content: space-between; 
                    padding: 8px 0; 
                    border-bottom: 1px solid #e9d5ff;
                }
                .detail-row:last-child { 
                    border-bottom: none; 
                }
                .detail-label { 
                    font-weight: 600; 
                    color: #6b21a8; 
                }
                .detail-value { 
                    color: #581c87; 
                }
                .next-steps { 
                    background: #f0f9ff; 
                    border-left: 5px solid #0ea5e9; 
                    padding: 25px; 
                    margin: 25px 0; 
                    border-radius: 0 15px 15px 0;
                }
                .next-steps h3 { 
                    color: #0369a1; 
                    margin-bottom: 15px; 
                }
                .steps-list { 
                    list-style: none; 
                    padding: 0; 
                }
                .steps-list li { 
                    padding: 8px 0; 
                    color: #0c4a6e; 
                    position: relative;
                    padding-left: 30px;
                }
                .steps-list li:before { 
                    content: counter(step-counter); 
                    counter-increment: step-counter;
                    position: absolute; 
                    left: 0; 
                    background: #0ea5e9;
                    color: white;
                    border-radius: 50%;
                    width: 20px;
                    height: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 12px;
                    font-weight: bold;
                }
                .steps-list { 
                    counter-reset: step-counter; 
                }
                .cta-section { 
                    text-align: center; 
                    margin: 30px 0; 
                    padding: 25px;
                    background: linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%);
                    border-radius: 15px;
                }
                .cta-title { 
                    color: #92400e; 
                    font-size: 20px; 
                    font-weight: bold; 
                    margin-bottom: 15px; 
                }
                .cta-button { 
                    display: inline-block; 
                    background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%); 
                    color: white; 
                    padding: 15px 30px; 
                    text-decoration: none; 
                    border-radius: 25px; 
                    font-weight: bold; 
                    font-size: 16px;
                    box-shadow: 0 4px 15px rgba(234, 88, 12, 0.3);
                    transition: transform 0.2s;
                    margin-top: 10px;
                }
                .cta-button:hover { 
                    transform: translateY(-2px); 
                }
                .payment-info { 
                    background: #fef2f2; 
                    border-left: 5px solid #ef4444; 
                    padding: 20px; 
                    margin: 25px 0; 
                    border-radius: 0 10px 10px 0;
                }
                .payment-info h3 { 
                    color: #dc2626; 
                    margin-bottom: 10px; 
                }
                .footer { 
                    background: #f8fafc; 
                    padding: 30px; 
                    text-align: center; 
                    color: #64748b; 
                    border-top: 1px solid #e2e8f0;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">⚡ HACK VINYAS HACKATHON</div>
                    <div class="header-subtitle">Registration Confirmation</div>
                    <div class="success-icon">🎉</div>
                </div>
                
                <div class="content">
                    <div class="greeting">
                        Congratulations! Your registration is complete! 🚀
                    </div>
                    
                    <div class="team-details">
                        <div class="team-name">${teamData.teamName}</div>
                        <div class="detail-row">
                            <span class="detail-label">Team Leader:</span>
                            <span class="detail-value">${
                              teamData.leaderName
                            }</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Email:</span>
                            <span class="detail-value">${
                              teamData.leaderEmail
                            }</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Team Size:</span>
                            <span class="detail-value">${
                              teamData.teamSize
                            } member${teamData.teamSize > 1 ? "s" : ""}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Registration Fee:</span>
                            <span class="detail-value">₹${
                              teamData.registrationFee
                            }</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Registration Date:</span>
                            <span class="detail-value">${new Date(
                              teamData.registrationDate
                            ).toLocaleDateString("en-IN")}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Team ID:</span>
                            <span class="detail-value">${teamData.id}</span>
                        </div>
                    </div>
                    
                    <div class="next-steps">
                        <h3>📋 Next Steps:</h3>
                        <ol class="steps-list">
                            <li>Complete payment of ₹${
                              teamData.registrationFee
                            } using the payment details provided</li>
                            <li>Upload payment screenshot through the payment verification portal</li>
                            <li>Wait for payment verification (usually within 24 hours)</li>
                            <li>Once verified, prepare your presentation and submit via PPT portal</li>
                            <li>Stay tuned for event schedule and further instructions</li>
                        </ol>
                    </div>
                    
                    <div class="cta-section">
                        <div class="cta-title">Ready to Submit Your Presentation? 📊</div>
                        <p style="margin-bottom: 15px; color: #78350f;">Upload your PPT once your payment is verified!</p>
                        <a href="${
                          process.env.FRONTEND_URL || "http://localhost:3000"
                        }/ppt-submission" class="cta-button">
                            📎 Submit PPT Presentation
                        </a>
                    </div>
                    
                    <div class="payment-info">
                        <h3>💳 Payment Information</h3>
                        <p><strong>Amount:</strong> ₹${
                          teamData.registrationFee
                        }</p>
                        <p><strong>Payment Method:</strong> UPI/Bank Transfer</p>
                        <p><strong>Note:</strong> After payment, upload your screenshot through the payment portal for verification.</p>
                    </div>
                    
                    <div style="background: #ecfdf5; border-left: 5px solid #10b981; padding: 20px; margin: 25px 0; border-radius: 0 10px 10px 0;">
                        <h3 style="color: #065f46; margin-bottom: 10px;">📞 Need Help?</h3>
                        <p style="color: #047857;">Contact our support team at <strong>vivekyad240706@gmail.com</strong> or reach out through our social media channels.</p>
                    </div>
                </div>
                
                <div class="footer">
                    <div style="font-size: 18px; font-weight: bold; color: #7c3aed; margin-bottom: 10px;">HACK VINYAS HACKATHON 2025</div>
                    <p>© 2025 Hack Vinyas Hackathon. All rights reserved.</p>
                    <div style="margin: 20px 0;">
                        <a href="#" style="margin: 0 10px; color: #64748b; text-decoration: none;">Website</a> | 
                        <a href="#" style="margin: 0 10px; color: #64748b; text-decoration: none;">Instagram</a> | 
                        <a href="#" style="margin: 0 10px; color: #64748b; text-decoration: none;">LinkedIn</a>
                    </div>
                    <p style="font-size: 12px; margin-top: 15px;">This is an automated confirmation email.</p>
                </div>
            </div>
        </body>
        </html>
        `;
  }

  getTeamNotificationTemplate(teamName, message, type) {
    const typeStyles = {
      success: {
        color: "#065f46",
        bg: "#ecfdf5",
        border: "#10b981",
        icon: "✅",
      },
      warning: {
        color: "#92400e",
        bg: "#fffbeb",
        border: "#f59e0b",
        icon: "⚠️",
      },
      error: { color: "#991b1b", bg: "#fef2f2", border: "#ef4444", icon: "❌" },
      info: { color: "#1e40af", bg: "#eff6ff", border: "#3b82f6", icon: "ℹ️" },
    };

    const style = typeStyles[type] || typeStyles["info"];

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Team Notification - Hack Vinyas Hackathon</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { 
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                    line-height: 1.6; 
                    color: #333; 
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    padding: 20px; 
                }
                .container { 
                    max-width: 600px; 
                    margin: 0 auto; 
                    background: white; 
                    border-radius: 20px; 
                    overflow: hidden;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.1); 
                }
                .header { 
                    background: linear-gradient(135deg, ${style.border} 0%, ${
      style.border
    }dd 100%); 
                    color: white; 
                    padding: 40px 30px; 
                    text-align: center; 
                }
                .logo { 
                    font-size: 32px; 
                    font-weight: bold; 
                    margin-bottom: 10px; 
                    text-shadow: 0 2px 4px rgba(0,0,0,0.2);
                }
                .header-subtitle { 
                    font-size: 16px; 
                    opacity: 0.9; 
                }
                .content { 
                    padding: 40px 30px; 
                }
                .team-info { 
                    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); 
                    border: 2px solid #64748b; 
                    border-radius: 15px; 
                    padding: 20px; 
                    margin: 25px 0; 
                    text-align: center;
                }
                .team-name { 
                    font-size: 20px; 
                    font-weight: bold; 
                    color: #334155; 
                }
                .message-box { 
                    background: ${style.bg}; 
                    border-left: 5px solid ${style.border}; 
                    padding: 25px; 
                    margin: 25px 0; 
                    color: ${style.color}; 
                    border-radius: 0 15px 15px 0;
                    font-size: 16px;
                    line-height: 1.8;
                }
                .message-icon { 
                    font-size: 24px; 
                    margin-bottom: 15px; 
                    display: block;
                }
                .footer { 
                    background: #f8fafc; 
                    padding: 30px; 
                    text-align: center; 
                    color: #64748b; 
                    border-top: 1px solid #e2e8f0;
                }
                .support-box { 
                    background: #f0f9ff; 
                    border-left: 5px solid #0ea5e9; 
                    padding: 20px; 
                    margin: 25px 0; 
                    border-radius: 0 10px 10px 0;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">⚡ HACK VINYAS HACKATHON</div>
                    <div class="header-subtitle">Team Notification</div>
                </div>
                
                <div class="content">
                    <div class="team-info">
                        <div class="team-name">Team: ${teamName}</div>
                    </div>
                    
                    <div class="message-box">
                        <span class="message-icon">${style.icon}</span>
                        ${message.replace(/\n/g, "<br>")}
                    </div>
                    
                    <div class="support-box">
                        <h3 style="color: #0369a1; margin-bottom: 10px;">📞 Need Help?</h3>
                        <p style="color: #0c4a6e;">If you have any questions or concerns, please don't hesitate to contact our support team at <strong>vivekyad240706@gmail.com</strong></p>
                    </div>
                </div>
                
                <div class="footer">
                    <div style="font-size: 18px; font-weight: bold; color: ${
                      style.border
                    }; margin-bottom: 10px;">HACK VINYAS HACKATHON 2025</div>
                    <p>© 2025 Hack Vinyas Hackathon. All rights reserved.</p>
                    <div style="margin: 20px 0;">
                        <a href="#" style="margin: 0 10px; color: #64748b; text-decoration: none;">Website</a> | 
                        <a href="#" style="margin: 0 10px; color: #64748b; text-decoration: none;">Instagram</a> | 
                        <a href="#" style="margin: 0 10px; color: #64748b; text-decoration: none;">LinkedIn</a>
                    </div>
                    <p style="font-size: 12px; margin-top: 15px;">This is an automated email from the admin team.</p>
                </div>
            </div>
        </body>
        </html>
        `;
  }

  // Send Verification Mail for Team Approval
  async sendVerificationMail(email, teamName, leaderName = "Team Leader") {
    try {
      if (!this.transporter) {
        console.log(
          "⚠️  Email service not available - Verification mail cannot be sent"
        );
        return false;
      }

      const subject = `🎉 Team Verified - Welcome to Hack Vinyas 2K25!`;

      const message = `Dear ${leaderName},

Congratulations! 🎉

We are excited to inform you that your team "${teamName}" has been successfully verified for Hack Vinyas 2K25!

🚀 NEXT STEPS:
• Your team is now officially registered for the hackathon
• Please ensure all team members are prepared for the event
• Keep checking your email for further updates and event details
• Join our official WhatsApp group for real-time updates (link will be shared soon)

📅 EVENT DETAILS:
• Hack Vinyas 2K25
• Venue: Our College Campus
• Duration: 19 September to 20 September 2025
• Problem statements will be released soon

We can't wait to see the innovative solutions your team will create! Get ready for an amazing hackathon experience filled with coding, creativity, and collaboration.

Best of luck to Team ${teamName}!

Warm regards,
The Hack Vinyas 2K25 Organizing Team`;

      const htmlContent = this.generateVerificationEmailHTML(
        teamName,
        leaderName,
        message
      );

      const mailOptions = {
        from: {
          name: "Hack Vinyas 2K25",
          address: process.env.EMAIL_USER,
        },
        to: email,
        subject: subject,
        text: message,
        html: htmlContent,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Verification email sent successfully to ${email}`);
      return true;
    } catch (error) {
      console.error("❌ Error sending verification email:", error);
      return false;
    }
  }

  // Generate Verification Email HTML Template
  generateVerificationEmailHTML(teamName, leaderName, message) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Team Verified - Hack Vinyas 2K25</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { 
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                    line-height: 1.6; 
                    color: #333; 
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    padding: 20px; 
                }
                .container { 
                    max-width: 600px; 
                    margin: 0 auto; 
                    background: white; 
                    border-radius: 20px; 
                    overflow: hidden;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.1); 
                }
                .header { 
                    background: linear-gradient(135deg, #10b981 0%, #34d399 100%); 
                    color: white; 
                    padding: 40px 30px; 
                    text-align: center; 
                }
                .logo { 
                    font-size: 32px; 
                    font-weight: bold; 
                    margin-bottom: 10px; 
                    text-shadow: 0 2px 4px rgba(0,0,0,0.2);
                }
                .header-subtitle { 
                    font-size: 18px; 
                    opacity: 0.9; 
                    margin-bottom: 0; 
                }
                .content { 
                    padding: 40px 30px; 
                }
                .footer { 
                    background: #f8f9fa; 
                    padding: 30px; 
                    text-align: center; 
                    color: #6c757d; 
                    font-size: 14px; 
                }
                .verification-header {
                    background: linear-gradient(135deg, #10b981, #34d399);
                    color: white;
                    padding: 30px;
                    text-align: center;
                    border-radius: 10px 10px 0 0;
                }
                .verification-icon {
                    font-size: 48px;
                    margin-bottom: 15px;
                }
                .success-badge {
                    background: #10b981;
                    color: white;
                    padding: 8px 20px;
                    border-radius: 25px;
                    display: inline-block;
                    font-weight: bold;
                    margin: 20px 0;
                }
                .event-details {
                    background: #f0f9ff;
                    border-left: 4px solid #0ea5e9;
                    padding: 20px;
                    margin: 20px 0;
                    border-radius: 0 8px 8px 0;
                }
                .next-steps {
                    background: #fef3c7;
                    border-left: 4px solid #f59e0b;
                    padding: 20px;
                    margin: 20px 0;
                    border-radius: 0 8px 8px 0;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="verification-header">
                    <div class="verification-icon">🎉</div>
                    <h1 style="margin: 0; font-size: 28px;">TEAM VERIFIED!</h1>
                    <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Welcome to Hack Vinyas 2K25</p>
                </div>
                
                <div class="content">
                    <div class="success-badge">✅ Verification Complete</div>
                    
                    <h2 style="color: #0369a1; margin-bottom: 10px;">Dear ${leaderName},</h2>
                    
                    <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                        Congratulations! We are excited to inform you that your team 
                        <strong style="color: #0ea5e9;">"${teamName}"</strong> has been successfully verified for 
                        <strong>Hack Vinyas 2K25!</strong>
                    </p>
                    
                    <div class="next-steps">
                        <h3 style="color: #92400e; margin-bottom: 15px;">🚀 NEXT STEPS:</h3>
                        <ul style="color: #78350f; line-height: 1.8;">
                            <li>Your team is now officially registered for the hackathon</li>
                            <li>Please ensure all team members are prepared for the event</li>
                            <li>Keep checking your email for further updates and event details</li>
                            <li>Join our official WhatsApp group for real-time updates (link will be shared soon)</li>
                        </ul>
                    </div>
                    
                    <div class="event-details">
                        <h3 style="color: #0369a1; margin-bottom: 15px;">📅 EVENT DETAILS:</h3>
                        <ul style="color: #0c4a6e; line-height: 1.8;">
                            <li><strong>Event:</strong> Hack Vinyas 2K25</li>
                            <li><strong>Venue:</strong> Our College Campus</li>
                            <li><strong>Duration:</strong> 19 September to 20 September 2025</li>
                            <li><strong>Problem Statements:</strong> Will be released soon</li>
                        </ul>
                    </div>
                    
                    <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                        <h3 style="color: #1e293b; margin-bottom: 10px;">🔥 Get Ready!</h3>
                        <p style="color: #475569; line-height: 1.6;">
                            We can't wait to see the innovative solutions your team will create! 
                            Get ready for an amazing hackathon experience filled with coding, creativity, and collaboration.
                        </p>
                        <p style="color: #0ea5e9; font-weight: bold; font-size: 18px; margin-top: 15px;">
                            Best of luck to Team ${teamName}! 🚀
                        </p>
                    </div>
                </div>
                
                <div class="footer">
                    <div style="font-size: 18px; font-weight: bold; color: #10b981; margin-bottom: 10px;">HACK VINYAS 2K25</div>
                    <p>© 2025 Hack Vinyas. All rights reserved.</p>
                    <div style="margin: 20px 0;">
                        <a href="#" style="margin: 0 10px; color: #64748b; text-decoration: none;">Website</a> | 
                        <a href="#" style="margin: 0 10px; color: #64748b; text-decoration: none;">Instagram</a> | 
                        <a href="#" style="margin: 0 10px; color: #64748b; text-decoration: none;">LinkedIn</a>
                    </div>
                    <p style="font-size: 12px; margin-top: 15px;">This is an automated verification email from the Hack Vinyas organizing team.</p>
                </div>
            </div>
        </body>
        </html>
        `;
  }
}

module.exports = new EmailService();
