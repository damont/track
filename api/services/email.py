import aiosmtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from api.config import get_settings


async def send_password_reset_email(to_email: str, reset_url: str) -> None:
    settings = get_settings()

    if not settings.smtp_email or not settings.smtp_app_password:
        raise RuntimeError("SMTP settings not configured")

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Track - Reset Your Password"
    msg["From"] = settings.smtp_email
    msg["To"] = to_email

    plain = (
        f"Reset your Track password by visiting this link:\n\n"
        f"{reset_url}\n\n"
        f"This link expires in 1 hour. If you didn't request this, you can ignore this email."
    )

    html = f"""\
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta name="x-apple-disable-message-reformatting"></head>
<body style="margin:0; padding:20px; font-family:Arial, sans-serif; background-color:#f5f5f5;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px; margin:0 auto; background:#ffffff; border-radius:8px; padding:32px;">
<tr><td>
<h2 style="margin:0 0 16px 0; color:#333;">Reset Your Password</h2>
<p style="color:#555; line-height:1.5;">Click the button below to reset your Track password:</p>
<p style="text-align:center; margin:24px 0;">
<a href="{reset_url}" target="_blank" style="display:inline-block; padding:12px 24px; background-color:#4f46e5; color:#ffffff; text-decoration:none; border-radius:6px; font-weight:bold;">Reset Password</a>
</p>
<p style="color:#888; font-size:13px; line-height:1.5;">If the button doesn't work, copy and paste this link into your browser:</p>
<p style="font-size:13px; word-break:break-all;"><a href="{reset_url}" target="_blank" style="color:#4f46e5; text-decoration:underline;">{reset_url}</a></p>
<p style="color:#888; font-size:13px; margin-top:24px;">This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>
</td></tr>
</table>
</body>
</html>"""

    msg.attach(MIMEText(plain, "plain", _charset="utf-8"))
    msg.attach(MIMEText(html, "html", _charset="utf-8"))

    await aiosmtplib.send(
        msg,
        hostname=settings.smtp_host,
        port=settings.smtp_port,
        start_tls=True,
        username=settings.smtp_email,
        password=settings.smtp_app_password,
    )
