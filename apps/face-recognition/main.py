import os
import json
import base64
import numpy as np
import cv2
import face_recognition
from fastapi import FastAPI, HTTPException, Body
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI(title="Face Recognition Servce", version="1.0.0")

ENCODINGS_FILE = "encodings.json"
students_data = {}

# Load encodings on startup
def load_encodings():
    global students_data
    if os.path.exists(ENCODINGS_FILE):
        try:
            with open(ENCODINGS_FILE, "r") as f:
                data = json.load(f)
                # Convert lists back to numpy arrays
                for student_id, encoding_list in data.items():
                    students_data[student_id] = np.array(encoding_list)
            print(f"Loaded {len(students_data)} face encodings.")
        except Exception as e:
            print(f"Error loading encodings: {e}")

# Save encodings to disk
def save_encodings():
    try:
        data_to_save = {}
        for student_id, encoding_array in students_data.items():
            data_to_save[student_id] = encoding_array.tolist()
        with open(ENCODINGS_FILE, "w") as f:
            json.dump(data_to_save, f)
    except Exception as e:
        print(f"Error saving encodings: {e}")

load_encodings()

def base64_to_image(base64_string: str) -> np.ndarray:
    try:
        if "," in base64_string:
            base64_string = base64_string.split(",")[1]
        img_data = base64.b64decode(base64_string)
        np_arr = np.frombuffer(img_data, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        return img
    except Exception as e:
        raise ValueError(f"Invalid base64 image data: {e}")

class RegisterRequest(BaseModel):
    student_id: str
    image_base64: str

class RecognizeRequest(BaseModel):
    image_base64: str

@app.post("/register")
async def register_student(req: RegisterRequest):
    try:
        img = base64_to_image(req.image_base64)
        
        # dlib works with RGB, OpenCV loads BGR
        rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        
        # Find faces
        face_locations = face_recognition.face_locations(rgb_img)
        
        if len(face_locations) == 0:
            raise HTTPException(status_code=400, detail="No face detected in the image.")
        if len(face_locations) > 1:
            raise HTTPException(status_code=400, detail="Multiple faces detected. Please upload a clear photo of only one person.")
            
        # Get face encoding for the single face found
        face_encodings = face_recognition.face_encodings(rgb_img, face_locations)
        encoding = face_encodings[0]
        
        # Save encoding
        students_data[req.student_id] = encoding
        save_encodings()
        
        return {"success": True, "message": f"Successfully registered face for student: {req.student_id}"}
        
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/recognize")
async def recognize_faces(req: RecognizeRequest):
    if not students_data:
        return {"recognized_students": [], "message": "No students registered yet in the system."}
        
    try:
        img = base64_to_image(req.image_base64)
        rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        
        face_locations = face_recognition.face_locations(rgb_img)
        if len(face_locations) == 0:
            return {"recognized_students": [], "message": "No faces detected in the image."}
            
        face_encodings = face_recognition.face_encodings(rgb_img, face_locations)
        
        recognized_student_ids = set()
        
        known_face_ids = list(students_data.keys())
        known_face_encodings = list(students_data.values())
        
        # Compare each face found in the image to the known database
        for face_encoding in face_encodings:
            matches = face_recognition.compare_faces(known_face_encodings, face_encoding, tolerance=0.5)
            # Use facial distance to find the BEST match
            face_distances = face_recognition.face_distance(known_face_encodings, face_encoding)
            
            if len(face_distances) > 0:
                best_match_index = np.argmin(face_distances)
                if matches[best_match_index]:
                    recognized_student_ids.add(known_face_ids[best_match_index])
                    
        return {
            "success": True, 
            "recognized_students": list(recognized_student_ids),
            "faces_detected": len(face_locations)
        }
        
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    # Make sure this runs on port 8000
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
