from app import app

# This is for Vercel serverless functions
def handler(event, context):
    return app 