from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.encoders import jsonable_encoder
from bson import ObjectId
from routers import auth, companies
import json
from utils import send_feedback_email

# Custom JSON encoder to handle ObjectId
class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        return super().default(obj)

app = FastAPI(title="Placement Info Portal")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(companies.router, prefix="/api", tags=["Companies"])

# Serve static files from frontend directory
app.mount("/static", StaticFiles(directory="../Frontend"), name="static")
app.mount("/pages", StaticFiles(directory="../Frontend/pages"), name="pages")

@app.get("/")
async def read_index():
    return FileResponse("../Frontend/index.html")

@app.get("/test")
async def test_route():
    return {"message": "Server is working!"}

@app.get("/pages/dashboard")
async def read_dashboard():
    return FileResponse("../Frontend/pages/dashboard.html")

@app.get("/pages/dashboard.html")
async def read_dashboard_html():
    return FileResponse("../Frontend/pages/dashboard.html")

@app.get("/pages/year")
async def read_year():
    return FileResponse("../Frontend/pages/year.html")

@app.get("/pages/year.html")
async def read_year_html():
    return FileResponse("../Frontend/pages/year.html")

@app.get("/pages/pc-management")
async def read_pc_management():
    return FileResponse("../Frontend/pages/pc-management.html")

@app.get("/pages/pc-management.html")
async def read_pc_management_html():
    return FileResponse("../Frontend/pages/pc-management.html")

@app.get("/pages/about")
async def read_about():
    return FileResponse("../Frontend/pages/about.html")

@app.get("/pages/feedback")
async def read_feedback():
    return FileResponse("../Frontend/pages/feedback.html")

@app.get("/pages/forgot-password")
async def read_forgot_password():
    return FileResponse("../Frontend/pages/forgot-password.html")

@app.get("/pages/forgot-password.html")
async def read_forgot_password_html():
    return FileResponse("../Frontend/pages/forgot-password.html")

# Dummy function to simulate sending feedback to PCs
async def send_feedback_to_pcs(feedback: str):
    # In a real app, you would store in DB or notify PCs
    print(f"Feedback received for PCs: {feedback}")
    return True

@app.post("/api/feedback")
async def receive_feedback(request: Request):
    try:
        data = await request.json()
        feedback = data.get("feedback", "").strip()
        
        # Validation: Check if feedback is empty
        if not feedback:
            return JSONResponse(
                status_code=400, 
                content={"detail": "Feedback cannot be empty. Please provide your feedback."}
            )
        
        # Validation: Check minimum length (50 characters)
        if len(feedback) < 50:
            return JSONResponse(
                status_code=400, 
                content={"detail": "Feedback must be at least 50 characters long."}
            )
        
        # Validation: Check maximum length (2000 characters)
        if len(feedback) > 2000:
            return JSONResponse(
                status_code=400, 
                content={"detail": "Feedback cannot exceed 2000 characters."}
            )
        
        # Send email to placement coordinators
        email_sent = await send_feedback_email(feedback=feedback)
        
        if email_sent:
            return {"message": "Feedback sent successfully."}
        else:
            return JSONResponse(
                status_code=500, 
                content={"detail": "Failed to send feedback. Please try again later."}
            )
            
    except Exception as e:
        print(f"Error in receive_feedback: {str(e)}")
        return JSONResponse(
            status_code=500, 
            content={"detail": "Internal server error. Please try again later."}
        )

@app.get("/api/live-trends")
async def get_live_trends():
    # Mock data for live placement trends
    return JSONResponse({
        "placed_today": 7,
        "placed_this_week": 42,
        "new_companies": 3,
        "highest_package_week": "₹18 LPA",
        "recent_offers": [
            {"student": "A. Sharma", "company": "Google", "package": "₹18 LPA"},
            {"student": "R. Kumar", "company": "Amazon", "package": "₹15 LPA"},
            {"student": "S. Patel", "company": "TCS", "package": "₹8 LPA"}
        ],
        "live_status": "Live"
    })

