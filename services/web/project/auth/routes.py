from flask import render_template, request, redirect, flash, url_for, session
from flask_login import login_user, login_required, logout_user
from flask_bcrypt import check_password_hash
from project.extensions import db
from project.auth import bp
from project.asset.models import Admin
from project import login_manager
from project.auth.forms import login_form


@login_manager.user_loader
def load_user(user_id):
    return Admin.query.get(int(user_id))


@bp.route("/login", methods=("GET", "POST"), strict_slashes=False)
def login():
    form = login_form()

    if form.validate_on_submit():
        try:
            user = Admin.query.filter_by(email=form.email.data).first()
            print(user)
            if check_password_hash(user.pwd, form.pwd.data):
                login_user(user)
                session['user_id'] = user.id
                # TODO
                return redirect(url_for('asset.asset_view'))
            else:
                flash("Invalid Username or password!", "danger")
        except AttributeError:
            flash("User not Found!", "danger")
        except Exception as e:
            print(e)
            flash(e, "danger")

    return render_template("login.html", form=form)


@bp.route("/logout")
@login_required
def logout():
    logout_user()
    session.pop('user_id')
    return redirect(url_for('auth.login'))
