#!/bin/bash
cd Backend
uvicorn main:app --host 0.0.0.0 --port $PORT 