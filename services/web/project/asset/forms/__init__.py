
from flask import Blueprint

bp = Blueprint('forms', __name__)

from project.asset.forms import routes
