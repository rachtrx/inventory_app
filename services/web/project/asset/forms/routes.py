import uuid
import json
import os

from flask import render_template, request, jsonify, redirect, url_for, current_app, session
from flask_login import login_required
from project.asset.forms import bp
from project.extensions import db
from project.asset.models import Model, Device, User, Event, Vendor, DeviceType, Dept
from sqlalchemy import update, func, exists
from urllib.parse import unquote
from datetime import datetime
from sqlalchemy.orm.exc import NoResultFound

AVAILABLE = 'available'

# Parse the ISO string and convert it to Python datetime object


def python_time(isoString):
    dt_object = datetime.strptime(isoString, "%Y-%m-%dT%H:%M:%S.%fZ")
    # Return a new date object containing only the year, month, and day
    return dt_object.date()


def insert_device_event(event_id, asset_id, event_type, remarks, user_id=None, event_date=None, file_path=None):

    event = Event(
        id=event_id,
        asset_id=asset_id,
        event_type=event_type,
        remarks=remarks,
        user_id=user_id if user_id else None,
        event_date=event_date if event_date else None,
        filepath=file_path if file_path else None
    )

    db.session.add(event)


def insert_user_event(event_id, event_type, user_id, remarks, event_date=None):

    event = Event(id=event_id, event_type=event_type, user_id=user_id,
                  remarks=remarks, event_date=event_date if event_date else None)

    db.session.add(event)


def update_status(asset_id, event_type, user_id=None):

    stmt = update(Device).where(Device.id == asset_id).values(
        status=event_type, user_id=user_id if user_id else None)

    # Execute the update statement
    db.session.execute(stmt)


@bp.route('/onboard', methods=["GET", "POST"])
@login_required
def onboard_devices():
    if request.method == "GET":
        return render_template("/forms/onboard.html")
    else:
        data = request.get_json()
        deviceArr, modelsObj, usersObj, vendorArr = data
        newUserIds = []

        for vendor_name in vendorArr:
            if not db.session.query(exists().where(Vendor.id.isnot(None))).scalar() or not db.session.query(Vendor).filter(func.lower(Vendor.vendor_name) == vendor_name.lower()).all():
                vendor = Vendor(id=uuid.uuid4().hex, vendor_name=vendor_name)
                db.session.add(vendor)

        for dept in usersObj:
            # check if new dept
            try:
                dept_id = db.session.query(Dept.id).filter(
                    func.lower(Dept.dept_name) == dept.lower()).first()[0]
            except Exception:
                dept_id = uuid.uuid4().hex
                new_dept = Dept(id=dept_id, dept_name=dept)
                db.session.add(new_dept)

            for user in usersObj.get(dept):
                if not db.session.query(exists().where(User.id.isnot(None))).scalar() or not db.session.query(User).filter(func.lower(User.user_name) == user.lower()).all():
                    user_id = uuid.uuid4().hex
                    user = User(id=user_id, user_name=user,
                                dept_id=dept_id, has_resigned=0, bookmarked=0)
                    db.session.add(user)
                    # add to new users
                    newUserIds.append(user_id)

        for device_type in modelsObj:
            # check if new device type
            try:
                device_type_id = db.session.query(DeviceType.id).filter(
                    func.lower(DeviceType.device_type) == device_type.lower()).first()[0]
            except Exception:
                device_type_id = uuid.uuid4().hex
                new_device_type = DeviceType(
                    id=device_type_id, device_type=device_type)
                db.session.add(new_device_type)

            for model_name in modelsObj.get(device_type):
                if not db.session.query(exists().where(Model.id.isnot(None))).scalar() or not db.session.query(Model).filter(func.lower(Model.model_name) == model_name.lower()).all():
                    model_id = uuid.uuid4().hex
                    model = Model(
                        id=model_id, device_type_id=device_type_id, model_name=model_name)
                    db.session.add(model)

        # add devices, add register and loan events
        for device in deviceArr:
            # check unqiue SN
            if db.session.query(exists().where(Device.id.isnot(None))).scalar():
                cur_serial_number = db.session.query(Device).filter(func.upper(Device.serial_number) == device['serialNumber'].upper()).first()
                if cur_serial_number:
                    return jsonify({'error': "Serial Number {} already exists!".format(device['serialNumber'])}), 400
                # check unique AT
                cur_asset_tag = db.session.query(Device).filter(func.upper(Device.asset_tag) == device['assetTag'].upper()).first()
                if cur_asset_tag:
                    return jsonify({'error': "Asset Tag {} already exists!".format(device['assetTag'])}), 400
                # registered date
                if 'registeredDate' not in device:
                    return jsonify({'error': "Asset Tag {} has no registered date!".format(device['assetTag'])}), 400
            device['registeredDate'] = python_time(device['registeredDate'])

            # model id
            try:
                model_id = db.session.query(Model.id).filter(func.lower(
                    Model.model_name) == device['modelName'].lower()).first()[0]
            except Exception:
                return jsonify({'error': "Asset Tag {} does not have a model".format(device['assetTag'])}), 400
            # user id
            user_id = None
            if 'userName' in device:
                try:
                    user_id = db.session.query(User.id).filter(func.lower(
                        User.user_name) == device['userName'].lower()).first()[0]
                except Exception:
                    return jsonify({'error': "username {} is not added".format(device['userName'])}), 400
            # vendor id
            try:
                vendor_id = db.session.query(Vendor.id).filter(func.lower(
                    Vendor.vendor_name) == device['vendorName'].lower()).first()[0]
            except Exception:
                return jsonify({'error': "Asset Tag {} does not have a vendor".format(device['assetTag'])}), 400

            asset_id = uuid.uuid4().hex

            print(user_id if user_id else None)

            # add to devices
            newDevice = Device(id=asset_id, serial_number=device['serialNumber'].upper(), asset_tag=device['assetTag'].upper(), model_id=model_id, bookmarked=device['bookmarked'], status='loaned' if user_id else AVAILABLE,
                               location=device['location'], vendor_id=vendor_id, user_id=user_id if user_id else None, registered_date=device['registeredDate'], model_value=device['modelValue'])

            db.session.add(newDevice)

            # add to register
            insert_device_event(uuid.uuid4().hex, asset_id, 'registered',
                                device['registeredRemarks'], None, device['registeredDate'])

            # add to loan
            if 'userName' in device:
                device['loanedDate'] = python_time(device['loanedDate'])
                insert_device_event(uuid.uuid4().hex, asset_id, 'loaned',
                                    device['loanedRemarks'], user_id, device['loanedDate'])

        # update user created date
        for newUserId in newUserIds:
            created_date = db.session.query(Event.event_date).filter(
                Event.event_type == 'loaned', Event.user_id == newUserId).order_by(Event.event_date).first()[0]

            stmt = update(User).where(User.id == newUserId).values(
                created_date=created_date)
            insert_user_event(uuid.uuid4().hex, 'created',
                              newUserId, '', event_date=created_date)

            db.session.execute(stmt)

        db.session.commit()

        return redirect(url_for('asset.views.devices_view'))


@bp.route('/register_model', methods=["GET", "POST"])
@login_required
def create_device():
    if request.method == "GET":
        device_types = []
        if db.session.query(exists().where(DeviceType.id.isnot(None))).scalar():
            device_types = db.session.query(DeviceType.device_type).order_by(
                DeviceType.device_type.asc()).all()
            device_types = [device_type[0] for device_type in device_types]
        return render_template("/forms/register_model.html", device_types=device_types)
    else:
        data = request.get_json()
        device_type = data[1]

        # for new device type, check if device type exists
        if device_type[0] == '_':
            device_type = device_type[1:]
            if db.session.query(exists().where(DeviceType.id.isnot(None))).scalar():
                cur_device = db.session.query(DeviceType).filter(
                    func.lower(DeviceType.device_type) == device_type.lower()).first()
                if cur_device:
                    return jsonify({'error': "Device Type {} already exists!".format(device_type)}), 400

            device_type_id = uuid.uuid4().hex
            new_device_type = DeviceType(
                id=device_type_id, device_type=device_type)
            db.session.add(new_device_type)
        else:
            device_type_id = db.session.query(DeviceType.id).filter(
                func.lower(DeviceType.device_type) == device_type.lower()).first()[0]

        models = data[2:]

        # CHECK
        for model in models:
            [model_name] = model

            # check if model name already exists
            if db.session.query(exists().where(Model.id.isnot(None))).scalar():
                cur_model = db.session.query(Model).filter(
                    func.lower(Model.model_name) == model_name.lower()).first()
                if cur_model:
                    return jsonify({'error': "Model {} already exists!".format(model_name)}), 400

        # INSERT
        for model in models:
            [model_name] = model
            model_id = uuid.uuid4().hex
            device_name = Model(
                id=model_id, device_type_id=device_type_id, model_name=model_name)
            db.session.add(device_name)

        db.session.commit()

        return redirect(url_for('asset.views.devices_view'))


@bp.route('/register_device', methods=["GET", "POST"])
@login_required
def register_device():
    print("User ID: {}".format(session.get('user_id')))
    if request.method == "GET":
        vendors = db.session.query(Vendor.vendor_name).distinct().order_by(
            Vendor.vendor_name.asc()).all()
        vendor_names = [vendor[0] for vendor in vendors]
        return render_template("/forms/register_device.html", vendors=vendor_names)
    else:
        data = request.get_json()

        model_id = data[1]

        # check if model name exists
        cur_model_id = db.session.query(Model).get(model_id)
        if not cur_model_id:
            return jsonify({'error': "Model Name does not exist!"}), 400

        vendor_name = data[2]

        # if new vendor, check if vendor already exists
        if vendor_name[0] == '_':
            vendor_name = vendor_name[1:]
            if db.session.query(exists().where(Vendor.id.isnot(None))).scalar():
                cur_vendor = db.session.query(Vendor).filter(
                    func.lower(Vendor.vendor_name) == vendor_name.lower()).first()
                if cur_vendor:
                    return jsonify({'error': "Vendor {} already exists!".format(vendor_name)}), 400
            else:
                vendor_id = uuid.uuid4().hex
                vendor = Vendor(
                    id=vendor_id,
                    vendor_name=vendor_name
                )
                db.session.add(vendor)
        else:
            vendor_id = db.session.query(Vendor.id).filter(func.lower(
                Vendor.vendor_name) == vendor_name.lower()).first()[0]

        model_value = data[3]

        try:
            # Try to convert the value to a float
            model_value = float(model_value)
            # If the conversion is successful, format to 2 decimal places
            model_value = "{:.2f}".format(model_value)
        except ValueError:
            # If the conversion fails, return the original value
            model_value = 0

        print(model_value)
        devices = data[4:]

        # CHECK
        asset_tag_arr = []
        for device in devices:
            serial_number, asset_tag, remarks = device
            serial_number = serial_number.upper()
            asset_tag = asset_tag.upper()

            if db.session.query(exists().where(Device.id.isnot(None))).scalar():
                # check if device already exists
                cur_device = db.session.query(Device).filter(
                    Device.asset_tag == asset_tag).first()
                if cur_device:
                    return jsonify({'error': "Asset Tag {} already exists!".format(asset_tag)}), 400
                if asset_tag in asset_tag_arr:
                    return jsonify({'error': "Duplicate Asset Tag {}!".format(asset_tag)}), 400
            asset_tag_arr.append(asset_tag)

        for device in devices:
            serial_number, asset_tag, remarks = device
            serial_number = serial_number.upper()
            asset_tag = asset_tag.upper()

            event_type = 'registered'
            asset_id = uuid.uuid4().hex

            device_details = Device(
                id=asset_id,
                serial_number=serial_number,
                asset_tag=asset_tag,
                model_id=model_id,
                bookmarked=0,
                status=AVAILABLE,
                location='unknown',
                model_value=model_value,
                vendor_id=vendor_id
            )
            db.session.add(device_details)

            event_id = uuid.uuid4().hex
            insert_device_event(event_id, asset_id, event_type, remarks)

        db.session.commit()

        print('finish registering')

        return redirect(url_for('asset.views.history_view'))


@bp.route('/loan_device', methods=["GET", "POST"])
@login_required
def loan_device():
    if request.method == "GET":
        return render_template("/forms/loan_device.html")
    else:
        data = request.get_json()

        event_type = 'loaned'

        file_name = data[0]

        devices = data[1:]

        # CHECK
        for device in devices:
            asset_id, user_id, remarks = device

            # check if status is loaned or condemned
            cur_status = db.session.query(Device.status).filter(
                Device.id == asset_id).first()
            if not cur_status:
                return jsonify({'error': "Asset not found!"}), 400
            if cur_status[0] == 'loaned':
                return jsonify({'error': "Asset is still on loan!"}), 400
            if cur_status[0] == 'condemned':
                return jsonify({'error': "Asset tag is already condemned!"}), 400

        # INSERT
        for device in devices:
            asset_id, user_id, remarks = device
            event_id = uuid.uuid4().hex
            if file_name is False:
                file_path = None
            else:
                file_path = file_name
            print(file_path)
            insert_device_event(event_id, asset_id, event_type,
                                remarks, user_id, None, file_path)
            update_status(asset_id, event_type, user_id)

        if file_name is False:
            db.session.commit()
            return jsonify(asset_id), 200

        db.session.commit()

        return jsonify(asset_id), 200


@bp.route('/returned_device', methods=["GET", "POST"])
@login_required
def returned_device():
    if request.method == "GET":
        return render_template("/forms/returned_device.html")
    else:
        data = request.get_json()
        print(data)

        event_type = 'returned'

        file_name = data[0]

        devices = data[2:]

        # CHECK
        for device in devices:
            asset_id, user_id, remarks = device

            # check if status is not on loan
            cur_status = db.session.query(Device.status).filter(
                Device.id == asset_id).first()
            if not cur_status:
                return jsonify({'error': "Asset not found!"}), 400
            if cur_status[0] != 'loaned':
                return jsonify({'error': "Asset is not on loan!"}), 400

        # INSERT
        for device in devices:
            asset_id, user_id, remarks = device

            event_id = uuid.uuid4().hex
            if file_name is False:
                file_path = None
            else:
                file_path = file_name
            print(file_path)
            insert_device_event(event_id, asset_id, event_type,
                                remarks, user_id, None, file_path)
            update_status(asset_id, AVAILABLE)

        loan_event_id = data[1]
        if not loan_event_id:
            db.session.commit()
            return jsonify(asset_id), 200

        loan_event = Event.query.get(loan_event_id)

        print('loan event filepath: {}'.format(loan_event.filepath))

        try:
            print(os.path.join(current_app.config["UPLOADS_FOLDER"], loan_event.filepath))
            os.remove(os.path.join(current_app.config["UPLOADS_FOLDER"], loan_event.filepath))
        except FileNotFoundError:
            return jsonify({'error': 'File not found'}), 400
        except Exception:
            return jsonify({'error': 'Error occurred while deleting the file:'}), 400

        loan_event.filepath = None
        print('done!')
        db.session.commit()

        return jsonify(asset_id), 200


@bp.route('/condemned_device', methods=["GET", "POST"])
@login_required
def condemned_device():
    if request.method == "GET":
        return render_template("/forms/condemned_device.html")
    else:
        devices = request.get_json()
        is_excel = devices.pop(0)
        new_devices = []

        # CHECK
        asset_id_arr = []
        for device in devices:
            if is_excel:
                asset_tag, remarks = device
                asset_tag = asset_tag.upper()
                cur_asset_id = db.session.query(Device.id).filter(
                    Device.asset_tag == asset_tag).first()
                # check for asset tag
                if not cur_asset_id:
                    return jsonify({'error': "Asset tag {} not found!".format(asset_tag)}), 400
                else:
                    asset_id = cur_asset_id[0]
                    if asset_id in asset_id_arr:
                        return jsonify({'error': "Can't delete the same device!"}), 400
            else:
                asset_id, remarks = device
            # create array to track duplicates
            asset_id_arr.append(asset_id)

            # need to get the asset id instead of the asset tag
            device.append(asset_id)
            new_devices.append(device)

            # check for asset tag and status of device
            cur_status = db.session.query(Device.status).filter(
                Device.id == asset_id).first()
            if not cur_status:
                return jsonify({'error': "Asset not found!"}), 400
            if cur_status[0] == 'loaned':
                return jsonify({'error': "Asset tag {} still on loan!".format(asset_tag)}), 400
            if cur_status[0] == 'condemned':
                return jsonify({'error': "Asset tag {} is already condemned!".format(asset_tag)}), 400

        event_type = 'condemned'
        # INSERT
        for device in new_devices:
            asset_tag, remarks, asset_id = device
            asset_tag = asset_tag.upper()

            event_id = uuid.uuid4().hex
            insert_device_event(event_id, asset_id, event_type, remarks)
            update_status(asset_id, event_type)

        db.session.commit()

        return redirect(url_for('asset.views.history_view'))


@bp.route('/create_user', methods=["GET", "POST"])
@login_required
def create_user():
    if request.method == "GET":
        depts = db.session.query(Dept.dept_name
                                 ).order_by(
            Dept.dept_name.asc()
        ).all()
        dept_names = [dept[0] for dept in depts]
        return render_template("/forms/create_user.html", dept_names=dept_names)
    else:
        data = request.get_json()

        dept = data[1]

        # if new dept, check if dept already exists
        if dept[0] == '_':
            dept = dept[1:]
            if db.session.query(exists().where(Dept.id.isnot(None))).scalar():
                cur_dept = db.session.query(Dept).filter(
                    func.lower(Dept.dept_name) == dept.lower()).first()
                if cur_dept:
                    return jsonify({'error': "Department {} already exists!".format(dept)}), 400

                dept_id = uuid.uuid4().hex
                new_dept = Dept(id=dept_id, dept_name=dept)
                db.session.add(new_dept)
        else:
            dept_id = db.session.query(Dept.id).filter(
                func.lower(Dept.dept_name) == dept.lower()).first()[0]

        # else dept = dept

        users = data[2:]

        # CHECK
        user_name_arr = []
        for user in users:
            user_name, remarks = user
            # check if user exists
            if db.session.query(exists().where(User.id.isnot(None))).scalar():
                cur_user = db.session.query(User).filter(
                    func.lower(User.user_name) == user_name.lower()).first()
                if cur_user:
                    return jsonify({'error': "User Name {} already exists!".format(user_name)}), 400
                if user_name in user_name_arr:
                    return jsonify({'error': "Duplicate usernames!"}), 400
            user_name_arr.append(user_name)

        # INSERT
        for user in users:
            user_name, remarks = user

            user_id = uuid.uuid4().hex
            user = User(
                id=user_id,
                user_name=user_name,
                dept_id=dept_id,
                bookmarked=0,
                has_resigned=0
            )
            db.session.add(user)

            event_id = uuid.uuid4().hex
            event_type = 'created'
            insert_user_event(event_id, event_type, user_id, remarks)

        db.session.commit()

        return redirect(url_for('asset.views.users_view'))


@bp.route('/remove_user', methods=["GET", "POST"])
@login_required
def remove_user():
    if request.method == "GET":
        return render_template("/forms/remove_user.html")
    else:
        users = request.get_json()
        is_excel = users.pop(0)
        new_users = []

        # CHECK
        user_id_arr = []
        for user in users:
            if is_excel:
                user_name, remarks = user
                # GET THE ID, check if user exists
                cur_user_id = db.session.query(User.id).filter(
                    func.lower(User.user_name) == user_name.lower()).first()
                if not cur_user_id:
                    return jsonify({'error': "User Name {} doesn't exist!".format(user_name)}), 400
                else:
                    user_id = cur_user_id[0]
                    if user_id in user_id_arr:
                        return jsonify({'error': "Can't remove the same user twice!"}), 400
            else:
                user_id, remarks = user
            user_id_arr.append(user_id)
            user.append(user_id)
            new_users.append(user)

            # check for user and if user has resigned
            cur_has_resigned = db.session.query(
                User.has_resigned).filter(User.id == user_id).first()
            if not cur_has_resigned:
                return jsonify({'error': "User doesn't exist!"}), 400
            if cur_has_resigned[0] == 1:
                return jsonify({'error': "User has already been removed!"}), 400

            # check if user has device
            cur_has_device = db.session.query(Device.asset_tag).filter(
                Device.user_id == user_id).first()
            if cur_has_device:
                return jsonify({'error': "{} is still being loaned by the user!".format(cur_has_device[0])}), 400

        # INSERT
        for user in new_users:
            user_name, remarks, user_id = user
            event_type = 'removed'
            event_id = uuid.uuid4().hex

            user = db.session.query(User).filter(User.id == user_id).first()
            if user:
                user.has_resigned = 1
                db.session.commit()
                insert_user_event(event_id, event_type, user_id, remarks)
            else:
                return jsonify({'error': "User not found"}), 400

        db.session.commit()

        return redirect(url_for('asset.views.users_view'))

# SECTION FORMS
