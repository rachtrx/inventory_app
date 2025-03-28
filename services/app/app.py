from dotenv import load_dotenv
env_path = f"/etc/environment"
load_dotenv(dotenv_path=env_path)

import os
from datetime import datetime

from flask import Flask, request, Response
from flask.cli import with_appcontext
import logging
import traceback
from sqlalchemy import inspect, event

from manage import create_app
from extensions import db

from models.users import User
from models.messages.received import MessageReceived
from models.messages.abstract import Message

from tasks import main as create_task

from es.manage import loop_through_files, create_index

from constants import system, PROCESSING, PENDING_USER_REPLY, OK

import os
from sqlalchemy import create_engine
from extensions import init_thread_session

from utilities import log_level

# Configure the root logger
logging.basicConfig(
    filename='/var/log/app.log',  # Log file path
    filemode='a',  # Append mode
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',  # Log message format
    level=log_level  # Log level
)
logging.getLogger('twilio.http_client').setLevel(logging.WARNING)

# logger = logging.getLogger('sqlalchemy.engine.Engine')
# # logger = logging.getLogger('redis')
# logger.setLevel(logging.INFO)
# file_handler = logging.FileHandler('/var/log/sqlalchemy_engine.log')
# formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
# file_handler.setFormatter(formatter)
# logger.addHandler(file_handler)

app = create_app()


@app.cli.command("setup_azure")
@with_appcontext
def setup_azure():
    create_task([system['ACQUIRE_TOKEN'], system['SYNC_USERS'], system['SYNC_LEAVE_RECORDS']])
    # create_task([system['ACQUIRE_TOKEN'], system['SYNC_USERS']])

@app.cli.command("create_new_index")
@with_appcontext
def create_new_index():
    create_index()

@app.cli.command("loop_files")
@with_appcontext
def loop_files():
    with app.app_context():
        temp_url = os.environ.get('TEMP_FOLDER_URL')
        loop_through_files(temp_url)

def log_table_creation(target, connection, **kw):
    logging.info(f"Creating table: {target.name}")

@app.cli.command("remove_db")
@with_appcontext
def remove_db():
    db.drop_all()
    db.session.commit()

@app.cli.command("seed_db")
@with_appcontext
def seed_db():
    user = User("Rachmiel", "12345678", "rach@rach")
    db.session.add(user)
    db.session.commit()

@app.route("/chatbot/sms/", methods=['GET', 'POST'])
def sms_reply():
    """Respond to incoming calls with a simple text message."""

    logging.info("start message")
    for key in request.values:
        logging.info(f"{key}: {request.values[key]}")
    logging.info("end message")

    try:
        from_no = request.form.get("From")
        logging.info(f"FROMNO: {from_no}")
        user_str = MessageReceived.get_message(request)
        sid = MessageReceived.get_sid(request)
            
        new_job_info = {
            "from_no": from_no,
            "user_str": user_str,
            "sid": sid
        }
        
        if request.form.get('OriginalRepliedMessageSid'):
            logging.info(f"User made a decision: {request.form.get('Body')}")
            replied_msg_sid = request.form.get('OriginalRepliedMessageSid')
            new_job_info["replied_msg_sid"] = replied_msg_sid

            # CONFIRM/CANCEL
            if request.form.get('ButtonPayload', None):
                new_job_info["decision"] = request.form.get('ButtonPayload', None)
            elif request.form.get('ListId', None):
                new_job_info["choice"] = request.form.get('ListId', None)
            else:
                raise Exception

        encoded_no = app.hash_identifier(str(from_no))

        job_enqueued = app.redis_client.enqueue_job(user_id=encoded_no, new_job_info=new_job_info)
        
        if job_enqueued:
            logging.info("job enqueued")
            result = app.redis_client.start_next_job(encoded_no)

            if result:
                return result[0], OK  # job started
            else:
                return "job not started", OK  # Accepted but queued
        else:
            logging.info("job not queued")
            return "job not queued", OK
    except Exception:
        logging.error(traceback.format_exc())
        app.twilio_client.messages.create(
            to=from_no,
            from_=os.environ.get('TWILIO_NO'),
            body="Really sorry, you caught error that we did find during development, please let us know!"
        )
    
    

@app.route("/chatbot/sms/callback/", methods=['POST'])
def sms_reply_callback():
    """Respond to incoming text message updates."""

    logging.info("start callback")
    for key in request.values:
        logging.info(f"{key}: {request.values[key]}")
    logging.info("end callback")

    try:
        status = request.form.get('MessageStatus')
        sid = request.values.get('MessageSid')

        logging.info(f"callback received, status: {status}, sid: {sid}")
        
        # check if this is a forwarded message, which would have its own ID
        message = Message.get_message_by_sid(sid)

        if not message:
            logging.info(f"not a message, {sid}")

        else:
            job = message.job
            logging.info(f"callback received, status: {status}, sid: {sid}, message: {message}, Job found: {job}")
            message_pendiing_reply = job.update_with_msg_callback(status, sid, message) # pending callback
            if message_pendiing_reply:
                to_no = request.form.get("To")
                encoded_no = app.hash_identifier(str(to_no))
                app.redis_client.update_job_status(encoded_no, message_pendiing_reply)
                job.commit_status(PENDING_USER_REPLY)

                        
    except Exception as e:
        logging.error(traceback.format_exc())

    return Response(status=200)

if __name__ == "__main__":
    # local development, not for gunicorn
    app.run(debug=True)