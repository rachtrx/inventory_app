from flask import render_template, request, redirect, flash, url_for, session
from flask_login import login_user, login_required, logout_user
from flask_bcrypt import check_password_hash
from project.extensions import db
from project.auth import bp
from project.asset.models import Admin
from project import login_manager
from project.auth.forms import login_form
from flask_wtf.csrf import generate_csrf
import logging


@login_manager.user_loader
def load_user(user_id):
    return Admin.query.get(int(user_id))


@bp.route("/login", methods=["GET", "POST"], strict_slashes=False)
def login():

    form = login_form()

    if request.method == "POST":
        # BUG with CSRF and Flask-WTF, set config to False
        logging.info(f"Submitted CSRF token: {form.csrf_token.data}")
        logging.info(form.validate_on_submit())
        if form.validate_on_submit():
            try:
                user = Admin.query.filter_by(email=form.email.data).first()
                print(user)
                if check_password_hash(user.pwd, form.pwd.data):
                    login_user(user)
                    session["user_id"] = user.id
                    print("User detected")
                    # TODO
                    return redirect(url_for("asset.asset_view"))
                else:
                    flash("Invalid Username or password!", "danger")
            except AttributeError:
                flash("User not Found!", "danger")
            except Exception as e:
                print(e)
                flash(e, "danger")

    logging.info(
        f"Server-generated CSRF token (for rendering): {form.csrf_token.current_token}"
    )

    return render_template("login.html", form=form)


@bp.route("/logout")
@login_required
def logout():
    logout_user()
    session.pop("user_id")
    return redirect(url_for("auth.login"))
