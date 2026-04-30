from fastapi import FastAPI

app = FastAPI(title="Auditchain API")

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "auditchain-backend"}

# The Claude AI Pipeline (Phase 4) handlers will go here.
# including pdfplumber integrations.
