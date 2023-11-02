from flask import render_template, request, jsonify, redirect, url_for
from project.asset import bp
from project.extensions import db
from project.asset.models import Device, Model, User, Event, Vendor
from sqlalchemy import desc, exists


@bp.route('/')
def asset_view():
    results = db.session.query(exists().where(Device.id.isnot(None))).scalar()
    if not results:
        return redirect(url_for('asset.forms.onboard_devices'))
    return render_template("/base.html")
