from datetime import datetime, timedelta, date
from extensions import db, get_session
from constants import errors, OK, NONE, UPDATED, LATE, OVERLAP, DECISIONS, intents, MC_DECISIONS, leave_issues
from dateutil.relativedelta import relativedelta
import os
import logging
import json
import threading
from utilities import current_sg_time, print_all_dates, join_with_commas_and, get_latest_date_past_9am, combine_with_key_increment
from overrides import overrides

from logs.config import setup_logger

from models.users import User
from models.exceptions import ReplyError, DurationError
from models.jobs.user.abstract import JobUser
from models.leave_records import LeaveRecord

from constants import leave_keywords, leave_types
import re
import traceback
from .utils_leave import dates

class JobLeave(JobUser):
    __tablename__ = "job_leave"
    job_no = db.Column(db.ForeignKey("job_user.job_no"), primary_key=True) # TODO on delete cascade?
    forwards_status = db.Column(db.Integer, default=None, nullable=True)
    local_db_updated = db.Column(db.Boolean(), nullable=False)
    leave_type = db.Column(db.String(20), nullable=True)
    
    __mapper_args__ = {
        "polymorphic_identity": "job_leave"
    }

    logger = setup_logger('models.job_leave')
    cancel_msg = errors['WRONG_DATE']
    cancel_after_fail_msg = errors['JOB_FAILED_MSG']
    timeout_msg = errors['TIMEOUT_MSG']
    confirm_after_cancel_msg = errors['CONFIRMING_CANCELLED_MSG']
    not_replying_to_last_msg = errors['NOT_LAST_MSG']

    def __init__(self, name):
        super().__init__(name)
        self.local_db_updated = False
        self.duplicate_dates = []
        

    def get_cache_data(self):
        if getattr(self, 'is_expecting_user_reply', False) and getattr(self, 'dates_to_update'):
            return {
                # actual job information
                # created by generate base
                "dates": [date.strftime("%d-%m-%Y") for date in self.dates_to_update],
                "duplicate_dates": [date.strftime("%d-%m-%Y") for date in self.duplicate_dates],
                # returned by generate base
                "validation_status": self.validation_status,
                # can be blank after genenrate base
                "leave_type": getattr(self, 'leave_type'),

                # job identifiers in cache upon callback
                "status": self.status, # passed to redis, which updates to PENDING_USER_REPLY once callback is received
                "job_no": self.job_no, # passed to redis, which is used when updating status to PENDING_USER_REPLY once callback is received
                
                "sent_sid": self.sent_msg.sid # passed to redis, which is used to check that the last message sent out is the message that is being replied to, when updating status to PENDING_USER_REPLY once callback is received. Also used to ensure that in general_workflow, the sent_sid matches the replied to of the new message
            }
        else:
            return None

    @overrides
    def bypass_validation(self, decision):
        if self.local_db_updated and decision == DECISIONS['CANCEL']:
            return True
        return False

    @overrides
    def is_cancel_job(self, decision):
        if decision == DECISIONS['CANCEL']:
            return True
        return False
    
    def update_info(self, job_information):
        self.dates_to_update = [datetime.strptime(date_str, "%d-%m-%Y").date() for date_str in job_information['dates']]
        self.duplicate_dates = [datetime.strptime(date_str, "%d-%m-%Y").date() for date_str in job_information['duplicate_dates']]
        self.validation_status = job_information.get('validation_status')
        self.leave_type = job_information.get('leave_type')

    
    def handle_request(self):
        from models.messages.received import MessageConfirm
        self.logger.info("job set with expects")

        # self.background_tasks = []

        # if it has the user string, its the first msg, or a retry message. user_str attribute it set either in update_info or during job initialisation
        if getattr(self, "leave_type", None) and isinstance(self.received_msg, MessageConfirm):

            self.logger.info(f"Checking for decision in handle request with user string: {self.received_msg.decision}")

            # these 2 functions are implemented with method overriding
            decision = self.received_msg.decision
            if decision != DECISIONS['CONFIRM']:
                logging.error(f"UNCAUGHT DECISION {decision}")
                raise ReplyError(errors['UNKNOWN_ERROR'])
            self.validate_confirm_message() # checks for ReplyErrors based on state

            updated_db_msg = LeaveRecord.insert_local_db(self)
            self.content_sid = os.environ.get("LEAVE_NOTIFY_SID")
            self.forward_messages()
            self.received_msg.reply = f"{updated_db_msg}, messages have been forwarded. Pending success..."

        else:
            self.is_expecting_user_reply = True # important for getting cached data when catching no leave type error; otherwise no data returned

            if isinstance(self.received_msg, MessageConfirm): # retry message
                self.leave_type = MC_DECISIONS.get(self.received_msg.decision, None) # previously had bus sometimes when not using str()
                if not self.leave_type:
                    raise ReplyError(errors['UNKNOWN_ERROR'])

            else: # first message
                self.validation_status = self.generate_base()
                # CATCH LEAVE TYPE ERRORS
                self.leave_type = self.set_leave_type()

            self.is_expecting_user_reply = True
            self.get_leave_confirmation_sid_and_cv()
            self.received_msg.reply = (self.content_sid, self.cv)

    @overrides
    def validate_confirm_message(self):
        pass
    
    def set_leave_type(self):
        leave_keyword_patterns = re.compile(leave_keywords, re.IGNORECASE)
        leave_match = leave_keyword_patterns.search(self.user_str)

        if leave_match:
            matched_term = leave_match.group(0) if leave_match else None
            for leave_type, phrases in leave_types.items():
                if matched_term.lower() in [phrase.lower() for phrase in phrases]:
                    return leave_type
            # UNKNOWN ERROR... keyword found but couldnt lookup
        
        content_sid = os.environ.get('SELECT_LEAVE_TYPE_SID')
        cv = None
        raise ReplyError(err_message=(content_sid, cv), job_status=None)

    @overrides
    def forward_messages(self):
        self.set_dates_str()
        self.cv_list = self.get_forward_leave_cv()
        super().forward_messages()

        if len(self.successful_forwards) > 0:
            return f"messages have been successfully forwarded to {join_with_commas_and(self.successful_forwards)}. Pending delivery success..."
        else:
            return f"All messages failed to send. You might have to update them manually, sorry about that"
    
    @overrides
    def validate_complete(self):
        self.logger.info(f"user: {self.user.name}, messages: {self.messages}")
        
        if self.local_db_updated and self.forwards_status == OK:
            last_message_replied = self.all_messages_successful() # IMPT check for any double decisions before unblocking
            if last_message_replied:
                self.logger.info("all messages successful")
                return True
        self.logger.info("all messages not successful")
        return False

    ########
    # ENTRY
    ########

    def generate_base(self):
        '''Generates the basic details of the MC, including the start, end and duration of MC'''

        self.start_date = self.end_date = self.duration = None

        self.logger.info(f"User string in generate base: {self.user_str}")

        try:

            # self.duration is extracted duration
            if dates.duration_extraction(self.user_str):
                self.duration = int(dates.duration_extraction(self.user_str))

            duration_c = self.set_start_end_date() # checks for conflicts and sets the dates

            self.logger.info("start generate_base")
            
            if duration_c:
                # if there are specified dates and no duration
                self.logger.info(f"{self.end_date}, {self.duration}, {duration_c}, {self.start_date}")
                if self.duration == None:
                    self.duration = duration_c
                # if there are specified dates and duration is wrong
                elif self.duration and self.duration != duration_c:

                    body = f'The duration from {datetime.strftime(self.start_date, "%d/%m/%Y")} to {datetime.strftime(self.end_date, "%d/%m/%Y")} ({duration_c}) days) do not match with {self.duration} days. Please send another message with the form "from dd/mm to dd/mm" to indicate the MC dates. Thank you!'

                    raise DurationError(body)
                
            # if there is only 1 specified date and duration_e
            elif self.duration and self.start_date:
                self.end_date = self.start_date + timedelta(days=max(int(self.duration) - 1, 0))

            #note: if end date and duration, start date is assumed to be today and duration error would have been flagged out
            elif self.start_date:
                self.end_date = self.start_date
                self.duration = 1

            # only duration e and no dates
            else: 
                try: # duration specified
                    self.start_date, self.end_date = dates.calc_start_end_date(self.duration) # sets self.start_date, self.end_date
                except Exception: # start, end dates and duration not specified
                    raise DurationError(errors['DATES_NOT_FOUND'])
            
            self.logger.info(f"{self.end_date}, {self.duration}, {duration_c}, {self.start_date}")
        
            start_date_status = self.validate_start_date()
        
            overlap_status = self.validate_overlap()

            if overlap_status == OVERLAP and (start_date_status == LATE + UPDATED or start_date_status == LATE):
                if current_sg_time().date() in self.duplicate_dates:
                    start_date_status -= LATE

            self.logger.info(f"STATUSES: {start_date_status}, {overlap_status}")
            
            return start_date_status + overlap_status
                
        except DurationError as e:
            logging.error(f"error message is {e.message}")
            raise ReplyError(e.message)
        
    def duration_calc(self):
        '''ran when start_date and end_date is True, returns duration between self.start_time and self.end_time. 
        if duration is negative, it adds 1 to the year. also need to +1 to duration since today is included as well'''

        # if current month > start month
        if self.start_date.month < current_sg_time().month:
            self.start_date += relativedelta(years=1)

        duration = (self.end_date - self.start_date).days + 1
        while duration < 0:
            self.end_date += relativedelta(years=1)
            duration = (self.end_date - self.start_date).days + 1

        logging.info(f'duration: {duration}')

        return duration

        
    def set_start_end_date(self):
        '''This function uses self.user_str and returns True or False, at the same time setting start and end dates where possible and resolving possible conflicts. Checks if can do something about start date, end date and duration'''

        named_month_start, named_month_end = dates.named_month_extraction(self.user_str)
        ddmm_start, ddmm_end = dates.named_ddmm_extraction(self.user_str)
        day_start, day_end = dates.named_day_extraction(self.user_str)
        
        start_dates = [date for date in [named_month_start, ddmm_start, day_start] if date is not None]
        end_dates = [date for date in [named_month_end, ddmm_end, day_end] if date is not None]

        self.logger.info(f"{start_dates}, {end_dates}")

        if len(start_dates) > 1:

            body = f'Conflicting start dates {join_with_commas_and(datetime.strptime(date, "%d/%m/%Y") for date in start_dates)}. Please send another message with the form "from dd/mm to dd/mm" to indicate the MC dates. Thank you!'

            raise DurationError(body)
        if len(end_dates) > 1:
            
            body = f'Conflicting end dates {join_with_commas_and(datetime.strptime(date, "%d/%m/%Y") for date in end_dates)}. Please send another message with the form "from dd/mm to dd/mm" to indicate the MC dates. Thank you!'

            raise DurationError(body)
        
        if len(start_dates) == 1:
            self.start_date = start_dates[0]
        if len(end_dates) == 1:
            self.end_date = end_dates[0]
        
        if self.start_date and self.end_date:
            self.logger.info(f"{type(self.start_date)} {type(self.end_date)}")
            # try:
            # TODO SET NEW DATES IF ITS 2024

            return self.duration_calc() # returns duration_c
            # except:
            #     return False
        
        return None
        
    def validate_start_date(self):
        '''Checks if start date is valid, otherwise tries to set the start date and duration'''
        status = NONE
        session = get_session()
        cur_sg_date = current_sg_time().date()
        earliest_possible_date = get_latest_date_past_9am()
        
        self.logger.info(earliest_possible_date)
        self.logger.info(f"{self.start_date}, {self.end_date}")
        # if end date is earlier than today, immediately reject
        if self.end_date < cur_sg_date:
            self.logger.info("date is too early cannot be fixed")
            body = f"Hi {self.user.alias}, I am no longer able to add your leave if you take it before today, sorry about the inconvenience."
            raise DurationError(body)
        # the start date is before today, but end date is at least today
        elif self.start_date < earliest_possible_date:
            # if start date is before today, definitely need to reset it to at least today
            if self.start_date < cur_sg_date:
                self.logger.info("date is too early but can be fixed")
                self.start_date = cur_sg_date
                self.duration = (self.end_date - self.start_date).days + 1
                session.commit()
                logging.info(f"committed in validate_start_date in session {id(session)}")
                status += UPDATED

            # the start date is now at least today, but we need to inform the user if it is already past 9am
            if earliest_possible_date > cur_sg_date:
                status += LATE
        
        return status

        
    def validate_overlap(self):
        '''
        checks if the dates overlap, sets self.duplicate_dates, self.dates_to_update, and self.duration
        '''
        # IMPT This is the very last validation. If the user confirms, it bypasses another validation check!
        status = NONE
        
        self.check_for_duplicates() # sets the duplicate dates

        if len(self.duplicate_dates) != 0 and len(self.dates_to_update) != 0:
            self.logger.info("duplicates but can be fixed")
            status += OVERLAP
        elif len(self.duplicate_dates) != 0:
            self.logger.info("duplicates cannot be fixed")
            raise DurationError(errors["ALL_DUPLICATE_DATES"])
        else:
            pass
        
        return status

    def check_for_duplicates(self):

        session = get_session()

        logging.info(f"in check_for_duplicates: {self.start_date}, {self.end_date}")
        start_date, duration = self.start_date, self.duration # these are actually functions

        def daterange():
            for n in range(duration):
                yield start_date + timedelta(n)

        all_dates_set = set(daterange())
        duplicate_records = LeaveRecord.get_duplicates(self)
        duplicate_dates_set = set([record.date for record in duplicate_records])
        logging.info(f"Duplicate dates set: {duplicate_dates_set}")

        non_duplicate_dates_set = all_dates_set - duplicate_dates_set

        self.duplicate_dates = sorted(list(duplicate_dates_set))
        self.dates_to_update = sorted(list(non_duplicate_dates_set))
        # logging.info(f"Type of date: {type(self.dates_to_update[0])}")

        self.duration = len(self.dates_to_update)

        logging.info(f"committed in check_for_duplicates in session {id(session)}")

        session.commit()
    
    def create_cancel_job(self, user_str):
        return self.create_job(intents['CANCEL_LEAVE'], user_str, self.user.name, self.job_no, self.leave_type)

    #################################
    # CV TEMPLATES FOR MANY MESSAGES
    #################################
        
    def set_dates_str(self):
        dates_str = print_all_dates(self.dates_to_update, date_obj=True)
        cur_date = current_sg_time().date()
        cur_date_str = cur_date.strftime('%d/%m/%Y')

        if get_latest_date_past_9am() > cur_date:
            dates_str = re.sub(cur_date_str, cur_date_str + ' (*LATE*)', dates_str)

        return dates_str

    def get_leave_confirmation_sid_and_cv(self):

        status = self.validation_status

        base_cv = {
            1: self.user.alias,
            2: self.leave_type.lower(),
            3: self.set_dates_str(),
            4: str(len(self.dates_to_update)),
            5: self.print_relations_list(),
            6: str(DECISIONS['CONFIRM']),
            7: str(DECISIONS['CANCEL'])
        }

        if status == OVERLAP + UPDATED + LATE:
            issues = {
                2: self.print_overlap_dates(),
                3: leave_issues['updated'],
                4: leave_issues['late']
            }
            self.content_sid = os.environ.get("LEAVE_CONFIRMATION_CHECK_3_ISSUES_SID")
        elif status == OVERLAP + UPDATED or status == OVERLAP + LATE:
            issues = {
                2: self.print_overlap_dates(),
                3: leave_issues['updated'] if status == OVERLAP + UPDATED else leave_issues['late'],
            }
            self.content_sid = os.environ.get("LEAVE_CONFIRMATION_CHECK_2_ISSUES_SID")
        elif status == UPDATED + LATE:
            issues = {
                2: leave_issues['updated'],
                3: leave_issues['late']
            }
            self.content_sid = os.environ.get("LEAVE_CONFIRMATION_CHECK_2_ISSUES_SID")
        elif status == OVERLAP or status == UPDATED or status == LATE:
            issues = {
                2: self.print_overlap_dates() if status == OVERLAP else leave_issues['updated'] if status == UPDATED else leave_issues['late'],
            }
            self.content_sid = os.environ.get("LEAVE_CONFIRMATION_CHECK_1_ISSUE_SID")
        elif status == NONE:
            issues = {}
            self.content_sid = os.environ.get("LEAVE_CONFIRMATION_CHECK_SID")
        else:
            self.logger.error(f"UNCAUGHT STATUS IN CV: {status}")
            raise ReplyError(errors['UNKNOWN_ERROR'])
        
        self.cv = json.dumps(combine_with_key_increment(base_cv, issues))
    
    def print_overlap_dates(self):
        return leave_issues['overlap'] + print_all_dates(self.duplicate_dates, date_obj=True)

    @JobUser.loop_relations # just need to pass in the user when calling get_forward_leave_cv
    def get_forward_leave_cv(self, relation):
        '''LEAVE_NOTIFY_SID; The decorator is for SENDING MESSAGES TO ALL RELATIONS OF ONE PERSON'''
        duration = len(self.dates_to_update)
        return {
            '1': relation.alias,
            '2': self.user.alias,
            '3': self.leave_type.lower(),
            '4': f"{str(duration)} {'day' if duration == 1 else 'days'}",
            '5': self.set_dates_str()
        }

class JobLeaveCancel(JobLeave):
    __tablename__ = "job_leave_cancel"
    job_no = db.Column(db.ForeignKey("job_leave.job_no"), primary_key=True) # TODO on delete cascade?
    initial_job_no = db.Column(db.ForeignKey("job_leave.job_no"), unique=True, nullable=False)

    original_job = db.relationship('JobLeave', foreign_keys=[initial_job_no], backref=db.backref('cancelled_job', uselist=False, remote_side=[JobLeave.job_no]), lazy='select')

    __mapper_args__ = {
        "polymorphic_identity": "job_leave_cancel",
        'inherit_condition': (job_no == JobLeave.job_no),
    }

    def __init__(self, name, initial_job_no, leave_type):
        super().__init__(name)
        self.initial_job_no = initial_job_no
        self.local_db_updated = False
        self.leave_type = leave_type

    def validate_confirm_message(self):        
        self.logger.info(f"original job status: {self.original_job.status}")
        
        if self.original_job.local_db_updated != True:
            raise ReplyError(errors['job_leave_FAILED'])
        
    def handle_request(self):
        from models.messages.received import MessageConfirm
        self.logger.info("job set with expects")

        # if it has the user string, its the first msg, or a retry message. user_str attribute it set either in update_info or during job initialisation
        
        decision = self.received_msg.decision
        if decision != DECISIONS['CANCEL']:
            logging.error(f"UNCAUGHT DECISION {decision}")
            raise ReplyError(errors['UNKNOWN_ERROR'])
        self.validate_confirm_message() # checks for ReplyErrors based on state
        self.received_msg.reply = self.handle_user_reply_action()
        
    @overrides
    def forward_messages(self):
        self.cv_list = self.get_forward_cancel_leave_cv()
        super().forward_messages()

        if len(self.successful_forwards) > 0:
            return f"messages have been successfully forwarded to {join_with_commas_and(self.successful_forwards)}. Pending delivery success..."
        else:
            return f"All messages failed to send. You might have to update them manually, sorry about that"

    @overrides
    def handle_user_reply_action(self):
        updated_db_msg = LeaveRecord.update_local_db(self)
        if updated_db_msg == None:
            raise ReplyError(errors['NO_DEL_DATE'])
        self.content_sid = os.environ.get("LEAVE_NOTIFY_CANCEL_SID")
        self.forward_messages()
        return f"{updated_db_msg}, messages have been forwarded. Pending success..."
    
    @JobUser.loop_relations # just need to pass in the user when calling get_forward_leave_cv
    def get_forward_cancel_leave_cv(self, relation):
        '''LEAVE_NOTIFY_CANCEL_SID'''

        return {
            '1': relation.alias,
            '2': self.user.alias,
            '3': self.original_job.leave_type.lower(),
            '4': f"{str(self.duration)} {'day' if self.duration == 1 else 'days'}",
            '5': print_all_dates(self.dates_to_update, date_obj=True)
        }
    
    # inherit
    # def handle_replied_future_results(self, future_results):

    # inherit
    # @overrides
    # def validate_complete(self):