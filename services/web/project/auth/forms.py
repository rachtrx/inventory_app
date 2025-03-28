from wtforms import (
    StringField,
    PasswordField,
    BooleanField,
    IntegerField,
    DateField,
    TextAreaField,
)

from flask_wtf import FlaskForm
from wtforms.validators import InputRequired, Length, Email, Optional
import email_validator
from flask_login import current_user
from wtforms import ValidationError, validators
from project.asset.models import Admin


class login_form(FlaskForm):
    email = StringField(validators=[InputRequired(), Email(), Length(1, 64)])
    pwd = PasswordField(validators=[InputRequired(), Length(min=1, max=72)])
    # Placeholder labels to enable form rendering
    username = StringField(
        validators=[Optional()]
    )
