from fastapi import APIRouter, HTTPException, Response
from database.connection import companies_collection
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
from utils import convert_objectid_to_str
import pandas as pd
import io

router = APIRouter()

@router.get("/companies/{year}")
async def get_companies_by_year(year: str):
    """
    Get all companies for a specific year
    """
    try:
        # Query companies for the specified year
        cursor = companies_collection.find({"year": year})
        companies = await cursor.to_list(length=None)
        
        # Convert ObjectId to string for JSON serialization
        companies = convert_objectid_to_str(companies)
        
        return {
            "success": True,
            "year": year,
            "companies": companies,
            "total_companies": len(companies)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching companies: {str(e)}")

@router.get("/companies/{year}/stats")
async def get_year_statistics(year: str):
    """
    Get aggregated statistics for a specific year
    """
    try:
        # Get all companies for the year
        cursor = companies_collection.find({"year": year})
        companies = await cursor.to_list(length=None)
        
        if not companies:
            return {
                "success": True,
                "year": year,
                "companies_visited": 0,
                "total_offers": 0,
                "avg_ctc": 0,
                "highest_ctc": 0,
                "companies": []
            }
        
        # Convert ObjectId to string for JSON serialization
        companies = convert_objectid_to_str(companies)
        
        # Calculate statistics
        total_companies = len(companies)
        total_offers = sum(company.get("offers", 0) for company in companies)
        
        # Calculate average and highest CTC
        ctc_values = []
        for company in companies:
            ctc = company.get("ctc", 0)
            if ctc and ctc > 0:
                ctc_values.append(ctc)
        
        avg_ctc = sum(ctc_values) / len(ctc_values) if ctc_values else 0
        highest_ctc = max(ctc_values) if ctc_values else 0
        
        return {
            "success": True,
            "year": year,
            "companies_visited": total_companies,
            "total_offers": total_offers,
            "avg_ctc": round(avg_ctc, 1),
            "highest_ctc": highest_ctc,
            "companies": companies
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating statistics: {str(e)}")

@router.get("/years")
async def get_available_years():
    """
    Get all available years in the database
    """
    try:
        # Get distinct years from companies collection
        years = await companies_collection.distinct("year")
        years.sort(reverse=True)  # Sort in descending order (newest first)
        
        return {
            "success": True,
            "years": years
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching years: {str(e)}")

@router.post("/companies")
async def add_company(company_data: dict):
    """
    Add a new company to the database
    """
    try:
        # Validate required fields (treat 0 as valid, only disallow None or empty strings)
        required_fields = ["name", "role", "offers", "date_of_visit", "year"]
        for field in required_fields:
            if field not in company_data:
                raise HTTPException(status_code=400, detail=f"Missing required field: {field}")
            value = company_data[field]
            if field == "offers":
                if value is None:
                    raise HTTPException(status_code=400, detail=f"Missing required field: {field}")
            else:
                if value is None or (isinstance(value, str) and value.strip() == ""):
                    raise HTTPException(status_code=400, detail=f"Missing required field: {field}")

        # Coerce numeric fields to proper types
        try:
            company_data["offers"] = int(company_data.get("offers", 0))
        except Exception:
            raise HTTPException(status_code=400, detail="Offers must be an integer")

        if "ctc" in company_data and company_data["ctc"] is not None:
            try:
                company_data["ctc"] = float(company_data["ctc"])
            except Exception:
                raise HTTPException(status_code=400, detail="CTC must be a number")
        if "stipend" in company_data and company_data["stipend"] is not None:
            try:
                company_data["stipend"] = float(company_data["stipend"])
            except Exception:
                raise HTTPException(status_code=400, detail="Stipend must be a number")

        # Role-based validation for CTC and stipend (allow 0; disallow negatives; require not None when applicable)
        role = company_data.get("role")
        ctc = company_data.get("ctc")
        stipend = company_data.get("stipend")

        if role == "IT":
            if stipend is None or stipend < 0:
                raise HTTPException(status_code=400, detail="Stipend is required for IT role and cannot be negative")
        elif role == "IT + PBC":
            if ctc is None or ctc < 0:
                raise HTTPException(status_code=400, detail="CTC is required for IT + PBC role and cannot be negative")
            if stipend is None or stipend < 0:
                raise HTTPException(status_code=400, detail="Stipend is required for IT + PBC role and cannot be negative")
        elif role == "FT":
            if ctc is None or ctc < 0:
                raise HTTPException(status_code=400, detail="CTC is required for FT role and cannot be negative")

        # Add timestamp
        company_data["created_at"] = datetime.utcnow()
        company_data["updated_at"] = datetime.utcnow()
        
        # Insert into database
        result = await companies_collection.insert_one(company_data)
        
        # Get the inserted document
        inserted_company = await companies_collection.find_one({"_id": result.inserted_id})
        
        # Convert ObjectId to string for JSON serialization
        inserted_company = convert_objectid_to_str(inserted_company)
        
        return {
            "success": True,
            "message": "Company added successfully",
            "company": inserted_company
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adding company: {str(e)}")

@router.put("/companies/{company_id}")
async def update_company(company_id: str, company_data: dict):
    """
    Update an existing company in the database
    """
    try:
        # Validate required fields (treat 0 as valid, only disallow None or empty strings)
        required_fields = ["name", "role", "offers", "date_of_visit", "year"]
        for field in required_fields:
            if field not in company_data:
                raise HTTPException(status_code=400, detail=f"Missing required field: {field}")
            value = company_data[field]
            if field == "offers":
                if value is None:
                    raise HTTPException(status_code=400, detail=f"Missing required field: {field}")
            else:
                if value is None or (isinstance(value, str) and value.strip() == ""):
                    raise HTTPException(status_code=400, detail=f"Missing required field: {field}")

        # Coerce numeric fields to proper types
        try:
            company_data["offers"] = int(company_data.get("offers", 0))
        except Exception:
            raise HTTPException(status_code=400, detail="Offers must be an integer")

        if "ctc" in company_data and company_data["ctc"] is not None:
            try:
                company_data["ctc"] = float(company_data["ctc"])
            except Exception:
                raise HTTPException(status_code=400, detail="CTC must be a number")
        if "stipend" in company_data and company_data["stipend"] is not None:
            try:
                company_data["stipend"] = float(company_data["stipend"])
            except Exception:
                raise HTTPException(status_code=400, detail="Stipend must be a number")

        # Role-based validation for CTC and stipend (allow 0; disallow negatives; require not None when applicable)
        role = company_data.get("role")
        ctc = company_data.get("ctc")
        stipend = company_data.get("stipend")

        if role == "IT":
            if stipend is None or stipend < 0:
                raise HTTPException(status_code=400, detail="Stipend is required for IT role and cannot be negative")
        elif role == "IT + PBC":
            if ctc is None or ctc < 0:
                raise HTTPException(status_code=400, detail="CTC is required for IT + PBC role and cannot be negative")
            if stipend is None or stipend < 0:
                raise HTTPException(status_code=400, detail="Stipend is required for IT + PBC role and cannot be negative")
        elif role == "FT":
            if ctc is None or ctc < 0:
                raise HTTPException(status_code=400, detail="CTC is required for FT role and cannot be negative")

        # Validate ObjectId format
        try:
            object_id = ObjectId(company_id)
        except:
            raise HTTPException(status_code=400, detail="Invalid company ID format")
        
        # Check if company exists
        existing_company = await companies_collection.find_one({"_id": object_id})
        if not existing_company:
            raise HTTPException(status_code=404, detail="Company not found")
        
        # Update timestamp
        company_data["updated_at"] = datetime.utcnow()
        
        # Update the company
        result = await companies_collection.update_one(
            {"_id": object_id},
            {"$set": company_data}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=500, detail="Failed to update company")
        
        # Get the updated document
        updated_company = await companies_collection.find_one({"_id": object_id})
        
        # Convert ObjectId to string for JSON serialization
        updated_company = convert_objectid_to_str(updated_company)
        
        return {
            "success": True,
            "message": "Company updated successfully",
            "company": updated_company
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating company: {str(e)}")

@router.delete("/companies/{company_id}")
async def delete_company(company_id: str):
    """
    Delete a company from the database
    """
    try:
        # Validate ObjectId format
        try:
            object_id = ObjectId(company_id)
        except:
            raise HTTPException(status_code=400, detail="Invalid company ID format")
        
        # Check if company exists
        existing_company = await companies_collection.find_one({"_id": object_id})
        if not existing_company:
            raise HTTPException(status_code=404, detail="Company not found")
        
        # Delete the company
        result = await companies_collection.delete_one({"_id": object_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=500, detail="Failed to delete company")
        
        return {
            "success": True,
            "message": "Company deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting company: {str(e)}")

@router.get("/companies/{company_id}")
async def get_company_by_id(company_id: str):
    """
    Get a specific company by ID
    """
    try:
        # Validate ObjectId format
        try:
            object_id = ObjectId(company_id)
        except:
            raise HTTPException(status_code=400, detail="Invalid company ID format")
        
        # Get the company
        company = await companies_collection.find_one({"_id": object_id})
        if not company:
            raise HTTPException(status_code=404, detail="Company not found")
        
        # Convert ObjectId to string for JSON serialization
        company = convert_objectid_to_str(company)
        
        return {
            "success": True,
            "company": company
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching company: {str(e)}")

@router.get("/companies/{year}/download")
async def download_year_report(year: str):
    """
    Download Excel report for a specific year
    """
    try:
        # Query companies for the specified year
        cursor = companies_collection.find({"year": year})
        companies = await cursor.to_list(length=None)
        
        if not companies:
            raise HTTPException(status_code=404, detail=f"No data found for year {year}")
        
        # Convert ObjectId to string for DataFrame
        companies = convert_objectid_to_str(companies)
        
        # Create DataFrame
        df = pd.DataFrame(companies)
        
        # Reorder columns for better presentation
        column_order = [
            'name', 'ctc', 'stipend', 'role', 'offers', 'date_of_visit', 
            'allowed_branches', 'interview_details'
        ]
        
        # Only include columns that exist in the data
        existing_columns = [col for col in column_order if col in df.columns]
        df = df[existing_columns]
        
        # Rename columns for better readability
        column_mapping = {
            'name': 'Company Name',
            'ctc': 'CTC (LPA)',
            'stipend': 'Stipend (KPM)',
            'role': 'Role',
            'offers': 'Number of Offers',
            'date_of_visit': 'Date of Visit',
            'allowed_branches': 'Allowed Branches',
            'interview_details': 'Interview Details'
        }
        
        df = df.rename(columns=column_mapping)
        
        # Create Excel file in memory
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name=f'Placement Report {year}', index=False)
            
            # Auto-adjust column widths
            worksheet = writer.sheets[f'Placement Report {year}']
            for column in worksheet.columns:
                max_length = 0
                column_letter = column[0].column_letter
                for cell in column:
                    try:
                        if len(str(cell.value)) > max_length:
                            max_length = len(str(cell.value))
                    except:
                        pass
                adjusted_width = min(max_length + 2, 50)
                worksheet.column_dimensions[column_letter].width = adjusted_width
        
        output.seek(0)
        
        # Return Excel file
        return Response(
            content=output.getvalue(),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={
                "Content-Disposition": f"attachment; filename=placement_report_{year}.xlsx"
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating report: {str(e)}") 