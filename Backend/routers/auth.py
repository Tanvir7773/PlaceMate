from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, EmailStr
from datetime import timedelta
import datetime
from bson import ObjectId

from database.connection import users_collection  # only import users_collection
from core.security import hash_password, verify_password, create_access_token, decode_token
from utils import convert_objectid_to_str, generate_otp, get_otp_expiry, send_otp_email

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


# ---------- SCHEMAS ----------
class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    branch: str
    section: str
    year_of_passout: int


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class GrantPCAccess(BaseModel):
    email: EmailStr

class ChangePassword(BaseModel):
    current_password: str
    new_password: str

class ForgotPassword(BaseModel):
    email: EmailStr

class ResetPassword(BaseModel):
    email: EmailStr
    otp: str
    new_password: str

class VerifyOTP(BaseModel):
    email: EmailStr
    otp: str

class Feedback(BaseModel):
    feedback: str


# ---------- REGISTER ----------
@router.post("/register")
async def register(user: UserRegister):
    # Convert email to lowercase
    email = user.email.lower()
    
    # Validate email domain
    if not (email.endswith("@bmsce.ac.in") or email.endswith("@gmail.com")):
        raise HTTPException(
            status_code=400,
            detail="Only Gmail (@gmail.com) or BMS College (@bmsce.ac.in) addresses are allowed"
        )
    
    existing = await users_collection.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="User already exists")

    hashed_pw = hash_password(user.password)
    user_data = user.dict()
    user_data["email"] = email  # Store lowercase email
    user_data["password"] = hashed_pw
    user_data["is_pc"] = False  # default role (only BMS emails can become PCs)

    result = await users_collection.insert_one(user_data)
    return {"message": "User registered successfully", "id": str(result.inserted_id)}


# ---------- LOGIN ----------
@router.post("/login")
async def login(user: UserLogin):
    # Convert email to lowercase
    email = user.email.lower()
       
    db_user = await users_collection.find_one({"email": email})
    if not db_user or not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=400, detail="Invalid email or password")

    token_data = {"sub": str(db_user["_id"])}
    access_token = create_access_token(token_data, timedelta(days=1))

    return {"access_token": access_token, "token_type": "bearer"}


# ---------- GET CURRENT USER ----------
@router.get("/me")
async def get_me(token: str = Depends(oauth2_scheme)):
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")

    user_id = payload.get("sub")
    user = await users_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Convert ObjectId to string for JSON serialization
    user = convert_objectid_to_str(user)
    del user["password"]
    return user


# ---------- GET USER DATA FOR DASHBOARD ----------
@router.get("/user")
async def get_user_data(token: str = Depends(oauth2_scheme)):
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")

    user_id = payload.get("sub")
    user = await users_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "name": user.get("name", "Unknown User"),
        "email": user.get("email", ""),
        "branch": user.get("branch", ""),
        "section": user.get("section", ""),
        "year_of_passout": user.get("year_of_passout", 0),
        "is_pc": user.get("is_pc", False)
    }


# ---------- GRANT PC ACCESS ----------
@router.post("/grant-pc-access")
async def grant_pc_access(pc_data: GrantPCAccess, token: str = Depends(oauth2_scheme)):
    try:
        # Verify current user is a PC
        payload = decode_token(token)
        if not payload:
            raise HTTPException(status_code=401, detail="Invalid token")

        current_user_id = payload.get("sub")
        current_user = await users_collection.find_one({"_id": ObjectId(current_user_id)})
        
        if not current_user or not current_user.get("is_pc", False):
            raise HTTPException(status_code=403, detail="Only Placement Coordinators can grant PC access")

        # Check if email is from BMS College
        if not pc_data.email.endswith("@bmsce.ac.in"):
            raise HTTPException(status_code=400, detail="Only BMS College email addresses (@bmsce.ac.in) are allowed")

        # Check if user exists
        existing_user = await users_collection.find_one({"email": pc_data.email})
        if not existing_user:
            raise HTTPException(status_code=404, detail="User with this email does not exist. Only existing BMS College students can be granted PC access")

        # Check if user is already a PC
        if existing_user.get("is_pc", False):
            raise HTTPException(status_code=400, detail="User is already a Placement Coordinator")

        # Update user to grant PC access
        update_result = await users_collection.update_one(
            {"email": pc_data.email},
            {
                "$set": {
                    "is_pc": True,
                    "access_granted_by": current_user.get("email", ""),
                    "access_granted_by_name": current_user.get("name", ""),
                    "access_granted_at": datetime.datetime.utcnow()
                }
            }
        )
        
        if update_result.modified_count == 0:
            raise HTTPException(status_code=500, detail="Failed to grant PC access")
        
        return {
            "message": "PC access granted successfully",
            "name": existing_user.get("name", "Unknown User"),
            "email": pc_data.email,
            "access_granted_by": current_user.get("name", "")
        }
    except Exception as e:
        print(f"Error in grant_pc_access: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


# ---------- CHANGE PASSWORD ----------
@router.post("/change-password")
async def change_password(password_data: ChangePassword, token: str = Depends(oauth2_scheme)):
    try:
        # Verify current user
        payload = decode_token(token)
        if not payload:
            raise HTTPException(status_code=401, detail="Invalid token")

        user_id = payload.get("sub")
        user = await users_collection.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Verify current password
        if not verify_password(password_data.current_password, user["password"]):
            raise HTTPException(status_code=400, detail="Current password is incorrect")

        # Hash new password
        hashed_new_password = hash_password(password_data.new_password)

        # Update password in database
        update_result = await users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"password": hashed_new_password}}
        )

        if update_result.modified_count == 0:
            raise HTTPException(status_code=500, detail="Failed to update password")

        return {"message": "Password changed successfully"}

    except Exception as e:
        print(f"Error in change_password: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# ---------- FORGOT PASSWORD ----------
@router.post("/forgot-password")
async def forgot_password(forgot_data: ForgotPassword):
    try:
        # Check if user exists
        user = await users_collection.find_one({"email": forgot_data.email})
        if not user:
            # Return error message if email doesn't exist
            raise HTTPException(status_code=404, detail="Email not found in our database")

        # Check if there's already an unused OTP
        if (user.get("otp_code") and 
            user.get("otp_expiry") and 
            user.get("otp_expiry") > datetime.datetime.utcnow() and 
            not user.get("otp_used", False)):
            
            # Rate limiting: check attempts
            otp_attempts = user.get("otp_attempts", 0)
            if otp_attempts >= 3:
                return {"message": "Too many OTP requests. Please wait before trying again."}

        # Generate new OTP
        otp = generate_otp()
        expiry = get_otp_expiry()
        
        # Update user with OTP data
        update_result = await users_collection.update_one(
            {"email": forgot_data.email},
            {
                "$set": {
                    "otp_code": otp,
                    "otp_expiry": expiry,
                    "otp_used": False,
                    "otp_attempts": user.get("otp_attempts", 0) + 1
                }
            }
        )

        if update_result.modified_count == 0:
            raise HTTPException(status_code=500, detail="Failed to generate OTP")

        # Send OTP email
        email_sent = await send_otp_email(
            email=forgot_data.email,
            otp=otp,
            user_name=user.get("name")
        )

        if not email_sent:
            raise HTTPException(status_code=500, detail="Failed to send OTP email")

        return {"message": "OTP sent to your email address"}

    except Exception as e:
        print(f"Error in forgot_password: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# ---------- VERIFY OTP ----------
@router.post("/verify-otp")
async def verify_otp(verify_data: VerifyOTP):
    try:
        # Find user by email
        user = await users_collection.find_one({"email": verify_data.email})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Check if OTP exists and is valid
        if not user.get("otp_code"):
            raise HTTPException(status_code=400, detail="No OTP found. Please request a new one.")

        # Check if OTP is expired
        if not user.get("otp_expiry") or user.get("otp_expiry") <= datetime.datetime.utcnow():
            raise HTTPException(status_code=400, detail="OTP has expired. Please request a new one.")

        # Check if OTP is already used
        if user.get("otp_used", False):
            raise HTTPException(status_code=400, detail="OTP has already been used. Please request a new one.")

        # Check if OTP matches
        if user.get("otp_code") != verify_data.otp:
            raise HTTPException(status_code=400, detail="Invalid OTP")

        return {"message": "OTP verified successfully"}

    except Exception as e:
        print(f"Error in verify_otp: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# ---------- RESET PASSWORD ----------
@router.post("/reset-password")
async def reset_password(reset_data: ResetPassword):
    try:
        # Find user by email
        user = await users_collection.find_one({"email": reset_data.email})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Check if OTP exists and is valid
        if not user.get("otp_code"):
            raise HTTPException(status_code=400, detail="No OTP found. Please request a new one.")

        # Check if OTP is expired
        if not user.get("otp_expiry") or user.get("otp_expiry") <= datetime.datetime.utcnow():
            raise HTTPException(status_code=400, detail="OTP has expired. Please request a new one.")

        # Check if OTP is already used
        if user.get("otp_used", False):
            raise HTTPException(status_code=400, detail="OTP has already been used. Please request a new one.")

        # Check if OTP matches
        if user.get("otp_code") != reset_data.otp:
            raise HTTPException(status_code=400, detail="Invalid OTP")

        # Hash new password
        hashed_new_password = hash_password(reset_data.new_password)

        # Update password and mark OTP as used
        update_result = await users_collection.update_one(
            {"email": reset_data.email},
            {
                "$set": {
                    "password": hashed_new_password,
                    "otp_used": True
                },
                "$unset": {
                    "otp_code": "",
                    "otp_expiry": "",
                    "otp_attempts": ""
                }
            }
        )

        if update_result.modified_count == 0:
            raise HTTPException(status_code=500, detail="Failed to reset password")

        return {"message": "Password reset successfully"}

    except Exception as e:
        print(f"Error in reset_password: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# ---------- LOGOUT ----------
@router.post("/logout")
async def logout(token: str = Depends(oauth2_scheme)):
    # In a real application, you might want to blacklist the token
    # For now, we'll just return a success message
    # The frontend will handle clearing the token from localStorage
    return {"message": "Logged out successfully"}



