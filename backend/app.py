from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import csv
import io
import random
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
import os
from supabase import create_client
import base64
from datetime import datetime
import pytz

load_dotenv()

app = Flask(__name__)
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:5173", "https://*.vercel.app"], 
        "methods": ["GET", "POST"],
        "allow_headers": ["Content-Type", "Cache-Control"]
    }
})

SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SENDER_EMAIL = os.getenv('SENDER_EMAIL')
APP_PASSWORD = os.getenv('APP_PASSWORD')

supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_KEY')
)

def validate_csv_format(headers):
    required_headers = ["name", "email"]
    return all(header in headers for header in required_headers)

def send_target_emails(chain, host_email):
    try:
        context = ssl.create_default_context()
        with smtplib.SMTP_SSL(SMTP_SERVER, 465, context=context) as server:
            server.login(SENDER_EMAIL, APP_PASSWORD)
        
            for player_name, target_info in chain.items():
                msg = MIMEMultipart('alternative')
                msg['From'] = SENDER_EMAIL
                msg['To'] = target_info['player_email']
                msg['Subject'] = 'Your SYDE Assassin Target'
                msg['Reply-To'] = host_email

                html = f"""
                <p>Hi {player_name}. Your SYDE assassin mission starts in T-3 days (thursday).</p>
                <p> You were assigned to assassinate </p>
                <span style="color: #0066cc; font-weight: bold; font-style: italic;">{target_info['target']}</span></p>
                <p> May the best assassin win, and the odds be ever in your favour. </p>
                """
                part = MIMEText(html, 'html')
                msg.attach(part)
                
                server.send_message(msg)
            
        return True, "Emails sent successfully"
        
    except Exception as e:
        return False, "Error sending email: {}".format(e)

def create_chain(players) -> dict:
    """ 
    shuffles the players and then creates a chain of players.
    """
    # Create a copy of players to shuffle
    shuffled_players = players.copy()
    # Shuffle in-place
    random.shuffle(shuffled_players)
    
    # create the chain with both names and emails
    chain = {}
    for i in range(len(shuffled_players)):
        current = shuffled_players[i]
        next_player = shuffled_players[(i + 1) % len(shuffled_players)]
        chain[current['name']] = {
            'target': next_player['name'],
            'target_email': next_player['email'],
            'player_email': current['email'] 
        }
    
    return chain

@app.route('/api/check-in', methods=['POST'])
def check_in():
    try:
        data = request.form
        name = data.get('name')
        if not name:
            return jsonify({'error': 'Name is required'}), 400

        if 'selfie' not in request.files:
            return jsonify({'error': 'No selfie uploaded'}), 400

        file = request.files['selfie']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400

        est = pytz.timezone('America/New_York')
        timestamp = datetime.now(est).isoformat()
        filename = f"{name}_{timestamp}.jpg"

        file_data = file.read()
        try:
            storage_response = supabase.storage \
                .from_('checkins') \
                .upload(
                    path=filename,
                    file=file_data,
                    file_options={"content-type": "image/jpeg"}
                )
            
            # Create database entry with EST timestamp
            db_response = supabase.table('checkins').insert({
                'name': name,
                'image_url': filename,
                'submitted_at': timestamp
            }).execute()

            return jsonify({
                'message': 'Check-in successful',
                'data': db_response.data
            }), 200

        except Exception as upload_error:
            raise Exception(f"Upload failed: {str(upload_error)}")

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/generate-chain', methods=['POST'])
def generate_chain():
    try:
        
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400
        
        file = request.files['file']
        host_email = request.form.get('host_email')
        
        print(f"Received file: {file.filename}, host email: {host_email}")
        
        if not host_email:
            return jsonify({'error': 'Host email is required'}), 400
        
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400
        
        if file and file.filename.endswith('.csv'):
            try:
                stream = io.StringIO(file.stream.read().decode("UTF8"))
                csv_reader = csv.DictReader(stream)
                
                headers = csv_reader.fieldnames
                print(f"CSV headers: {headers}")
                
                if not validate_csv_format(headers):
                    return jsonify({'error': 'CSV must have "name" and "email" columns'}), 400
                
                players = [{
                    'name': (p['name']),
                    'email': (p['email'])
                } for p in list(csv_reader)]
                
                print(f"Number of players: {len(players)}")
                
                if len(players) < 2:
                    return jsonify({'error': 'Need at least 2 players'}), 400
                
                # Use create_chain instead of generate_chain
                chain = create_chain(players)
                
                return jsonify({
                    'message': 'Chain generated successfully',
                    'chain': chain
                }), 200
                
            except Exception as e:
                print(f"Error processing CSV: {str(e)}")
                error_message = e.args[0] if e.args else "Unknown error"
                if isinstance(error_message, bytes):
                    error_message = error_message.decode('utf-8')
                return jsonify({'error': f'Error processing request: {error_message}'}), 400
        
        return jsonify({'error': 'Invalid file type'}), 400
        
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return jsonify({
            'error': 'An unexpected error occurred',
            'details': str(e)
        }), 500

@app.route('/api/send-emails', methods=['POST'])
def send_emails():
    data = request.json
    if not data or 'chain' not in data or 'host_email' not in data:
        return jsonify({'error': 'Missing required data'}), 400
    
    chain = data['chain']
    host_email = data['host_email']
    
    try:
        # Send emails to all players
        success, message = send_target_emails(chain, host_email)
        if not success:
            return jsonify({'error': message}), 500

        return jsonify({
            'message': 'Emails sent successfully'
        }), 200
        
    except Exception as e:
        error_message = e.args[0] if e.args else "Unknown error"
        if isinstance(error_message, bytes):
            error_message = error_message.decode('utf-8')
        return jsonify({'error': f'Error sending emails: {error_message}'}), 400

@app.route('/api', methods=['GET'])
def index():
    return jsonify({
        'message': 'API is running',
        'timestamp': datetime.now().isoformat()
    }), 200

@app.route('/api/check-ins', methods=['GET'])
def get_check_ins():
    try:
        est = pytz.timezone('America/New_York')
        
        response = supabase.table('checkins') \
            .select('name, submitted_at, image_url') \
            .order('submitted_at', desc=True) \
            .execute()

        return jsonify({
            'checkIns': response.data
        }), 200

    except Exception as e:
        print(f"Error getting check-ins: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Add a new endpoint to serve images
@app.route('/api/image/<path:filename>')
def serve_image(filename):
    try:
        # Get the image data from Supabase storage
        response = supabase.storage \
            .from_('checkins') \
            .download(filename)
        
        return send_file(
            io.BytesIO(response),
            mimetype='image/jpeg'
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 404

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True) 