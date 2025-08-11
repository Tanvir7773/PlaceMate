from bson import ObjectId
import random
import datetime
import os
from dotenv import load_dotenv
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Load environment variables
load_dotenv()

def convert_objectid_to_str(data):
    """
    Recursively convert ObjectId to string in a dictionary or list
    """
    if isinstance(data, dict):
        for key, value in data.items():
            if isinstance(value, ObjectId):
                data[key] = str(value)
            elif isinstance(value, (dict, list)):
                data[key] = convert_objectid_to_str(value)
    elif isinstance(data, list):
        for i, item in enumerate(data):
            if isinstance(item, ObjectId):
                data[i] = str(item)
            elif isinstance(item, (dict, list)):
                data[i] = convert_objectid_to_str(item)
    return data

def generate_otp():
    """
    Generate a 6-digit numeric OTP
    """
    return str(random.randint(100000, 999999))

def get_otp_expiry():
    """
    Get OTP expiry time (5 minutes from now)
    """
    return datetime.datetime.utcnow() + datetime.timedelta(minutes=5)

async def send_otp_email(email: str, otp: str, user_name: str = None):
    """
    Send OTP email to user
    """
    try:
        # Email configuration from environment variables
        smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        smtp_port = int(os.getenv("SMTP_PORT", "587"))
        smtp_username = os.getenv("SMTP_USERNAME")
        smtp_password = os.getenv("SMTP_PASSWORD")
        
        if not smtp_username or not smtp_password:
            raise Exception("SMTP credentials not configured")
        
        # Create message
        msg = MIMEMultipart("alternative")
        msg['From'] = smtp_username
        msg['To'] = email
        msg['Subject'] = "Password Reset OTP - Placement Info Portal"
        
        # HTML email body with bold tags
        html_body = f"""
        <html>
            <body>
                <p>Hello {user_name or 'User'},</p>
                <p>You have requested to reset your password for the <b>Placement Info Portal</b>.</p>
                <p>Your <b>OTP (One-Time Password)</b> is: <b>{otp}</b></p>
                <p><i>This OTP will expire in 5 minutes.</i></p>
                <p>If you did not request this password reset, please <i>ignore this email.</i></p>
                <br>
                <p>Best regards,<br><b>Placement Info Portal Team</b></p>
            </body>
        </html>
        """
        
        # Attach HTML body
        msg.attach(MIMEText(html_body, 'html'))
        
        # Send email
        await aiosmtplib.send(
            msg,
            hostname=smtp_server,
            port=smtp_port,
            username=smtp_username,
            password=smtp_password,
            start_tls=True
        )
        
        return True
    except Exception as e:
        print(f"Error sending email: {str(e)}")
        return False

async def send_feedback_email(feedback: str, user_email: str = None, user_name: str = None):
    """
    Send feedback email
    """
    try:
        # Email configuration from environment variables
        smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        smtp_port = int(os.getenv("SMTP_PORT", "587"))
        smtp_username = os.getenv("SMTP_USERNAME")
        smtp_password = os.getenv("SMTP_PASSWORD")
        
        if not smtp_username or not smtp_password:
            raise Exception("SMTP credentials not configured")
        
        # Create message
        msg = MIMEMultipart("alternative")
        msg['From'] = smtp_username
        msg['To'] = smtp_username  # Send to admin email (same as from)
        msg['Subject'] = "New Feedback - Placement Info Portal"
        
        if user_email:
            msg.add_header('Reply-To', user_email)

        # HTML email body
        html_body = f"""
        <html>
            <body>
                <h2>New Feedback Received</h2>
                <p><strong>From:</strong> {user_name or 'Anonymous User'}</p>
                <p><strong>Email:</strong> {user_email or 'Not provided'}</p>
                <p><strong>Feedback:</strong></p>
                <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0;">
                    <p style="margin: 0; white-space: pre-wrap;">{feedback}</p>
                </div>
                <p><i>This feedback was submitted through the Placement Info Portal.</i></p>
                <br>
                <p>Best regards,<br><b>Placement Info Portal System</b></p>
            </body>
        </html>
        """
        
        # Attach HTML body
        msg.attach(MIMEText(html_body, 'html'))
        
        # Send email
        await aiosmtplib.send(
            msg,
            hostname=smtp_server,
            port=smtp_port,
            username=smtp_username,
            password=smtp_password,
            start_tls=True
        )
        
        return True
    except Exception as e:
        print(f"Error sending feedback email: {str(e)}")
        return False
