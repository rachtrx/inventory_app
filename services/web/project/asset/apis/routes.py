import os

from flask import render_template, request, jsonify, send_file, redirect, url_for, current_app
from flask_login import login_required
from project.asset.apis import bp
from project.extensions import db
from project.asset.models import Model, Device, User, Event, Vendor, DeviceType, Dept
from sqlalchemy import and_, func, text, desc, extract, cast, Float, asc, case, exists
from io import BytesIO
from markupsafe import escape
from werkzeug.utils import secure_filename

if not os.getenv("DATABASE_URL"):
    device_age_exp = func.floor((func.strftime('%s', 'now') - func.strftime('%s', Device.registered_date)) / 31577600)
else:
    device_age_exp = func.floor((func.extract('epoch', func.now() - Device.registered_date) / 31556952))

# SECTION APIS


@bp.route('/upload_pdf', methods=["POST"])
@login_required
def upload_pdf():
    if request.method == "POST":
        # Get the PDF file from the request
        pdf_file = request.files['pdf_file']
        print(pdf_file)

        # Now you can access the JSON data and the PDF file as needed
        # For example, you can save the PDF file to a folder on the server
        pdf_file.save(os.path.join(current_app.config["UPLOADS_FOLDER"], pdf_file.filename))

        return jsonify({'message': 'success'}), 200

# FOR RETURN AND SHOW PAGES


@bp.route('/download_pdf', methods=["POST"])
@login_required
def download_pdf():
    eventId = request.get_json()

    event = Event.query.get(eventId)
    if not event:
        return 'File not found.'

    file_path = os.path.join(current_app.config["UPLOADS_FOLDER"], event.filepath)
    print(file_path)

    return send_file(file_path, as_attachment=True, mimetype='application/pdf', download_name=event.filepath)

# FOR SHOW PAGES


@bp.route('/get_filename', methods=["POST"])
@login_required
def get_file_name():
    eventId = request.get_json()
    event = Event.query.get(eventId)

    file = event.filepath
    file_name = os.path.basename(file)

    return jsonify(file_name)


@bp.route('/all_devices', methods=["GET"])
@login_required
def generate_all_devices():
    if not db.session.query(exists().where(Device.id.isnot(None))).scalar() or not db.session.query(exists().where(User.id.isnot(None))).scalar():
        return jsonify({'message': 'no data'}), 200

    query = db.session.query(
        Device.id.label('asset_id'),
        Device.serial_number,
        Device.asset_tag,
        Model.model_name,
        Device.bookmarked.label('device_bookmarked'),
        Device.status,
        Device.registered_date,
        Device.location,
        User.id.label('user_id'),
        User.user_name,
        User.bookmarked.label('user_bookmarked'),
        Vendor.vendor_name,
        DeviceType.device_type,
        device_age_exp.label('device_age'),
        Device.model_value
    ).outerjoin(
        User, and_(Device.user_id == User.id)
    ).join(
        Model, Device.model_id == Model.id
    ).join(
        Vendor, Device.vendor_id == Vendor.id
    ).join(
        DeviceType, DeviceType.id == Model.device_type_id
    ).filter(
        Device.status != 'condemned'
    ).order_by(Device.registered_date.desc()).all()

    result = [dict(row._asdict()) for row in query]

    print(f"all devices: {result}")

    return jsonify(result)


@bp.route('/check_onboard', methods=["POST"])
@login_required
def check_onboard():

    data = request.get_json()

    device_arr, models_obj, users_obj, vendor_arr, sn_arr, at_arr, dt_arr, dept_arr = data

    cur_dt_arr = []
    cur_model_arr = []
    cur_dept_arr = []
    cur_user_arr = []
    cur_vendor_arr = []

    if db.session.query(exists().where(Device.id.isnot(None))).scalar():

        # check serial number and asset tag must be different
        serial_numbers = db.session.query(func.upper(Device.serial_number)).all()

        for sn in sn_arr:
            upper_sn = sn.upper()
            if (upper_sn,) in serial_numbers:
                return jsonify({"error": "Duplicate Serial Number {}".format(sn)}), 400

        asset_tags = db.session.query(func.upper(Device.asset_tag)).all()

        for at in at_arr:
            upper_at = at.upper()
            if (upper_at,) in asset_tags:
                return jsonify({"error": "Duplicate Asset Tag {}".format(at)}), 400

    if db.session.query(exists().where(DeviceType.id.isnot(None))).scalar():
        # check if existing device type
        device_types = db.session.query(func.lower(DeviceType.device_type)).all()
        for dt in dt_arr:
            lower_dt = dt.lower()
            if (lower_dt,) in device_types:
                cur_dt_arr.append(dt)

    if db.session.query(exists().where(Model.id.isnot(None))).scalar():
        # check if existing model name
        model_names = db.session.query(Model.model_name).all()
        for dt, modelArr in models_obj.items():
            for model in modelArr:
                if (model,) in model_names:
                    model = db.session.query(Model).filter_by(model_name=model).first()
                    cur_dt = Model.query.get(model.id).device_type.device_type
                    print(cur_dt)
                    if dt != cur_dt:
                        return jsonify({"error": "{} is already registered as a {}".format(model, cur_dt)}), 400
                    else:
                        cur_model_arr.append(model)

    if db.session.query(exists().where(Dept.id.isnot(None))).scalar():
        # check if existing dept
        depts = db.session.query(func.lower(Dept.dept_name)).all()
        for dept in dept_arr:
            lower_dept = dept.lower()
            if (lower_dept,) in depts:
                cur_dept_arr.append(dept)

    if db.session.query(exists().where(User.id.isnot(None))).scalar():
        # check if existing user
        users = db.session.query(func.lower(User.user_name)).all()
        for dept, user_names in users_obj.items():
            for user_name in user_names:
                lower_user_name = user_name.lower()
                # print("username: {}".format(user_name))
                if (lower_user_name,) in users:
                    cur_dept = db.session.query(Dept.dept_name).join(
                        User.dept_id == Dept.id
                    ).filter(
                        func.lower(User.user_name) == lower_user_name
                    ).first()[0]
                    # print("cur dept: {}".format(cur_dept))
                    if dept != cur_dept:
                        return jsonify({"error": "{} is already a user in {}".format(user_name, cur_dept)}), 400
                    else:
                        cur_user_arr.append(user_name)

    if db.session.query(exists().where(Vendor.id.isnot(None))).scalar():
        # check if existing vendor
        vendors = db.session.query(func.lower(Vendor.vendor_name)).all()

        for vendor in vendor_arr:
            lower_vendor = vendor.lower()
            if (lower_vendor,) in vendors:
                cur_vendor_arr.append(vendor)

    return jsonify([cur_dt_arr, cur_model_arr, cur_dept_arr, cur_user_arr, cur_vendor_arr]), 200


@bp.route('/devices_overview')
@login_required
def generate_dashboard():

    _top_devices = []
    _top_devices_value = []
    _top_models = []
    _top_models_value = []
    _devices_status = []
    _devices_age = []
    _users = []
    _users_loan = []
    _cost_per_year = []
    _total_cost_per_year = []

    if db.session.query(exists().where(Device.id.isnot(None))).scalar() or db.session.query(exists().where(User.id.isnot(None))).scalar():
        # FILTER TOP DEVICE TYPES
        _top_devices = db.session.query(
            DeviceType.device_type.label('key'),
            func.count(DeviceType.device_type).label('value')
        ).select_from(
            Device
        ).join(
            Model, Model.id == Device.model_id
        ).join(
            DeviceType, DeviceType.id == Model.device_type_id
        ).filter(
            Device.status != 'condemned'
        ).group_by(DeviceType.device_type).order_by(func.count(DeviceType.device_type).desc()).all()

        # FILTER TOP DEVICE TYPES BY VALUE
        _top_devices_value = db.session.query(
            DeviceType.device_type.label('key'),
            func.sum(cast(Device.model_value, Float)).label('value')
        ).select_from(
            Device
        ).join(
            Model, Model.id == Device.model_id
        ).join(
            DeviceType, DeviceType.id == Model.device_type_id
        ).filter(
            Device.status != 'condemned'
        ).group_by(DeviceType.device_type).having(func.sum(cast(Device.model_value, Float)) != 0).order_by(func.sum(cast(Device.model_value, Float)).desc()).all()

        # FILTER THE TOP MODELS
        _top_models = db.session.query(
            Model.model_name,
            func.count(Model.model_name).label('model_count'),
            DeviceType.device_type
        ).select_from(
            Device
        ).join(
            Model, Model.id == Device.model_id
        ).join(
            DeviceType, DeviceType.id == Model.device_type_id
        ).filter(
            Device.status != 'condemned'
        ).group_by(Model.model_name, DeviceType.device_type).order_by(func.count(Model.model_name).desc()).all()

        # FILTER TOP MODELS BY VALUE
        _top_models_value = db.session.query(
            Model.model_name,
            func.sum(Device.model_value).label('model_value'),
            DeviceType.device_type
        ).select_from(
            Device
        ).join(
            Model, Model.id == Device.model_id
        ).join(
            DeviceType, DeviceType.id == Model.device_type_id
        ).filter(
            Device.status != 'condemned',
            Device.model_value != 0
        ).group_by(DeviceType.device_type, Model.model_name).order_by(func.sum(Device.model_value).desc()).all()

        # FILTER STATUS OF MODELS
        _devices_status = db.session.query(
            Device.status.label('key'),
            func.count(Device.status).label('value')
        ).filter(
            Device.status != 'condemned'
        ).group_by(Device.status).order_by(func.count(Device.status)).all()

        # FILTER AGE OF DEVICES
        _devices_age = db.session.query(
            device_age_exp.label('key'),
            func.count('*').label('value')
        ).filter(
            Device.status != 'condemned'
        ).group_by(
            device_age_exp
        ).order_by(
            device_age_exp.asc()
        ).all()

        _cost_per_year = db.session.query(
            extract('year', Device.registered_date).label('key'),
            func.sum(Device.model_value).label('value'),
            DeviceType.device_type
        ).join(
            Model, Model.id == Device.model_id
        ).join(
            DeviceType, DeviceType.id == Model.device_type_id
        ).group_by(
            extract('year', Device.registered_date), DeviceType.device_type
        ).order_by(
            extract('year', Device.registered_date).asc(), DeviceType.device_type
        ).all()

        _total_cost_per_year = db.session.query(
            extract('year', Device.registered_date).label('key'),
            func.sum(Device.model_value).label('value'),
        ).join(
            Model, Model.id == Device.model_id
        ).group_by(
            extract('year', Device.registered_date)
        ).order_by(
            extract('year', Device.registered_date).asc()
        ).all()

        _users = db.session.query(
            Dept.dept_name.label('key'),
            func.count(Dept.dept_name).label('value')
        ).select_from(
            User
        ).join(
            Dept, User.dept_id == Dept.id
        ).filter(
            User.has_resigned != 1
        ).group_by(Dept.dept_name).order_by(func.count(Dept.dept_name)).all()

        # FILTER USERS ON LOAN
        _users_loan = db.session.query(
            Dept.dept_name.label('key'),
            func.count(Dept.dept_name).label('value')
        ).select_from(
            Device
        ).join(
            User, Device.user_id == User.id
        ).join(
            Dept, Dept.id == User.dept_id
        ).filter(
            User.has_resigned != 1
        ).group_by(Dept.dept_name).order_by(func.count(Dept.dept_name)).all()

    top_devices = [dict(row._asdict()) for row in _top_devices]
    top_devices_value = [dict(row._asdict()) for row in _top_devices_value]
    top_models = [dict(row._asdict()) for row in _top_models]
    top_models_value = [dict(row._asdict()) for row in _top_models_value]
    devices_status = [dict(row._asdict()) for row in _devices_status]
    devices_age = [dict(row._asdict()) for row in _devices_age]
    users = [dict(row._asdict()) for row in _users]
    users_loan = [dict(row._asdict()) for row in _users_loan]
    cost_per_year = [dict(row._asdict()) for row in _cost_per_year]
    total_cost_per_year = [dict(row._asdict()) for row in _total_cost_per_year]

    print(devices_age)

    return jsonify([top_devices, top_devices_value, top_models, top_models_value, devices_status, devices_age, users, users_loan, cost_per_year, total_cost_per_year])


@bp.route('/all_users')
@login_required
def generate_all_users():
    if not db.session.query(exists().where(Device.id.isnot(None))).scalar() or not db.session.query(exists().where(User.id.isnot(None))).scalar():
        return jsonify({'message': 'no data'}), 200

    data = db.session.query(
        User.id.label('user_id'),
        User.user_name,
        Dept.dept_name,
        User.bookmarked.label('user_bookmarked'),
        User.has_resigned,
        User.created_date,
        Device.id.label('asset_id'),
        Device.asset_tag,
        Model.model_name,
        Device.bookmarked.label('device_bookmarked')
    ).outerjoin(
        Device, Device.user_id == User.id
    ).outerjoin(
        Model, Model.id == Device.model_id
    ).join(
        Dept, Dept.id == User.dept_id
    ).filter(User.has_resigned != 1).order_by(User.created_date.desc()).all()

    result = [dict(row._asdict()) for row in data]

    return jsonify(result)


@bp.route('/all_events')
@login_required
def generate_all_events():

    if not db.session.query(exists().where(Device.id.isnot(None))).scalar() or not db.session.query(exists().where(User.id.isnot(None))).scalar():
        return jsonify({'message': 'no data'}), 200

    data = db.session.query(
        Device.serial_number,
        Device.id.label('asset_id'),
        Device.asset_tag,
        DeviceType.device_type,
        Model.model_name,
        Event.event_type,
        User.user_name,
        Event.event_date,
        User.id.label('user_id'),
    ).outerjoin(
        Device, Event.asset_id == Device.id
    ).outerjoin(
        User, Event.user_id == User.id
    ).outerjoin(
        Model, Device.model_id == Model.id
    ).outerjoin(
        DeviceType, DeviceType.id == Model.device_type_id
    ).order_by(
        Event.event_date.desc()
    ).all()

    result = [dict(row._asdict()) for row in data]

    return jsonify(result)


@bp.route('/devices/<deviceId>')
@login_required
def generate_show_device(deviceId):

    raw_details = db.session.query(
        Device.id.label('asset_id'),
        Device.serial_number,
        Device.asset_tag,
        Model.model_name,
        DeviceType.device_type,
        Device.model_value.label('model_value'),
        Device.bookmarked.label('device_bookmarked'),
        Device.location,
        Device.status,
        Vendor.vendor_name
    ).join(
        Model, Model.id == Device.model_id
    ).join(
        Vendor, Device.vendor_id == Vendor.id
    ).join(
        DeviceType, DeviceType.id == Model.device_type_id
    ).filter(Device.id == deviceId)

    details = [dict(row._asdict()) for row in raw_details]
    print(details)

    raw_events = db.session.query(
        Event.id.label('event_id'),
        Event.event_type,
        Event.event_date,
        Event.remarks,
        Event.filepath,
        User.user_name
    ).join(
        Device, Event.asset_id == Device.id
    ).outerjoin(
        User, Event.user_id == User.id
    ).filter(
        Device.id == deviceId
    ).order_by(
        Event.event_date.desc()
    ).all()

    events = [dict(row._asdict()) for row in raw_events]

    raw_past_users = db.session.query(
        User.id.label('user_id'),
        User.user_name,
        User.bookmarked
    ).join(Event, User.id == Event.user_id).filter(Event.asset_id == deviceId, Event.event_type == 'returned').order_by(Event.event_date.desc()).all()

    past_users = [dict(row._asdict()) for row in raw_past_users]

    raw_current_user = db.session.query(
        User.id.label('user_id'),
        User.user_name,
        User.bookmarked.label('user_bookmarked')
    ).join(Device, Device.user_id == User.id).filter(Device.id == deviceId)

    current_user = [dict(row._asdict()) for row in raw_current_user]

    return jsonify([details, events, past_users, current_user])


@bp.route('/users/<userId>')
@login_required
def generate_show_user(userId):

    raw_details = db.session.query(
        User.id.label('user_id'),
        User.user_name,
        Dept.dept_name,
        User.bookmarked.label('user_bookmarked'),
        User.has_resigned
    ).join(
        Dept, Dept.id == User.dept_id
    ).filter(User.id == userId)

    details = [dict(row._asdict()) for row in raw_details]

    raw_events = db.session.query(
        User.user_name,
        Event.id.label('event_id'),
        Event.event_type,
        Event.asset_id.label('asset_id'),
        Event.event_date,
        Event.remarks,
        Event.filepath,
        Device.asset_tag
    ).join(User, Event.user_id == User.id).outerjoin(Device, Event.asset_id == Device.id).filter(User.id == userId).order_by(Event.event_date.desc()).all()

    events = [dict(row._asdict()) for row in raw_events]

    raw_past_devices = db.session.query(
        Device.id.label('asset_id'),
        Device.serial_number,
        Device.asset_tag,
        Model.model_name,
        Device.bookmarked
    ).join(Event, Device.id == Event.asset_id).join(
        Model, Model.id == Device.model_id
    ).filter(Event.user_id == userId, Event.event_type == 'returned').order_by(Event.event_date.desc()).all()

    past_devices = [dict(row._asdict()) for row in raw_past_devices]

    raw_current_devices = db.session.query(
        Device.id.label('asset_id'),
        Device.serial_number,
        Device.asset_tag,
        Model.model_name,
        Device.bookmarked
    ).join(
        Model, Model.id == Device.model_id
    ).filter(Device.user_id == userId, Device.status == 'loaned').all()

    current_devices = [dict(row._asdict()) for row in raw_current_devices]

    return jsonify([details, events, past_devices, current_devices])


@bp.route('/edit_data', methods=["POST"])
@login_required
def update_remarks():
    data = request.get_json()
    data_type, data_id, data_value = data

    if data_type == 'location' or data_type == 'value':
        device_details = Device.query.get(data_id)
        if not device_details:
            return jsonify({"error": "Device details not found"}), 400
        if device_details and data_type == 'location':
            device_details.location = data_value
        elif device_details and data_type == 'value':
            device_details.model_value = data_value
        db.session.commit()
        return jsonify({"message": "Location updated successfully"})
    elif data_type == 'remark':
        event = Event.query.get(data_id)
        if event:
            event.remarks = data_value
            db.session.commit()
            return jsonify({"message": "Event remarks updated successfully"})
        else:
            return jsonify({"error": "Event not found"}), 400
    else:
        return jsonify({"error": "Something went wrong"}), 400


# SECTION PREVIEWS
# API FOR MODELS
@bp.route('/models', methods=["POST"])
@login_required
def generate_models():
    data = request.get_json()
    model_name = "%" + data + "%"
    results = db.session.query(
        Model.id.label('model_id'),
        Model.model_name,
        DeviceType.device_type
    ).join(
        DeviceType, DeviceType.id == Model.device_type_id
    ).filter(
        Model.model_name.ilike(model_name)
    ).order_by(
        Model.added_date
    ).limit(20).all()
    print(results)

    models = [dict(row._asdict()) for row in results]

    return jsonify(models)

# API FOR ASSET TAG


@bp.route('/devices', methods=["POST"])
@login_required
def generate_devices():

    raw_data = request.get_json()

    print(raw_data)

    first = raw_data[1]

    data = raw_data[0]

    asset_tag = "%" + data + "%"
    results = db.session.query(
        Device.asset_tag,
        Device.serial_number,
        Model.model_name,
        Device.id.label('asset_id'),
        Device.status
    ).join(
        Model, Model.id == Device.model_id
    ).filter(
        Device.asset_tag.ilike(asset_tag)
    ).order_by(
        desc(Device.status == first)
    ).limit(20).all()

    devices = [dict(row._asdict()) for row in results]

    return jsonify(devices)

# API FOR USERS


@bp.route('/users', methods=["POST"])
@login_required
def generate_users():
    raw_data = request.get_json()

    isAsc = raw_data[1]

    if isAsc:
        order = asc(User.created_date)
    else:
        order = desc(User.created_date)

    data = raw_data[0]

    user_name = "%" + data + "%"
    results = db.session.query(
        User.id.label('user_id'),
        User.user_name,
        Dept.dept_name,
        User.bookmarked.label('user_bookmarked'),
        User.has_resigned,
        Device.id.label('asset_id'),
        Device.asset_tag,
        Model.model_name,
        Device.bookmarked.label('device_bookmarked'),
    ).outerjoin(
        Device, Device.user_id == User.id
    ).outerjoin(
        Model, Device.model_id == Model.id
    ).join(
        Dept, Dept.id == User.dept_id
    ).group_by(
        User.id, Dept.dept_name, Device.id, Model.model_name
    ).filter(
        User.user_name.ilike(user_name)
    ).order_by(
        asc(User.has_resigned), asc(func.count(Device.asset_tag)), order
    ).all()
    print(results)

    users = [dict(row._asdict()) for row in results]

    return jsonify(users)

# API FOR USER FOR RETURN DEVICE


@bp.route('/user', methods=["POST"])
@login_required
def generate_user():
    asset_id = request.get_json()
    _user = db.session.query(
        User.id.label('user_id'),
        User.user_name,
        Dept.dept_name
    ).join(
        Device, User.id == Device.user_id
    ).join(
        Dept, Dept.id == User.dept_id
    ).filter(Device.id == asset_id).all()

    _event = db.session.query(
        Event.id.label('event_id'),
        Event.filepath
    ).join(
        Device, Event.asset_id == Device.id
    ).filter(
        Event.event_type == 'loaned', Event.asset_id == asset_id
    ).order_by(desc(Event.event_date)).first()

    user = [dict(row._asdict()) for row in _user]
    print(_event)
    print(type(_event))
    event = [dict(_event._asdict())]

    print(event)

    return jsonify([user, event])
