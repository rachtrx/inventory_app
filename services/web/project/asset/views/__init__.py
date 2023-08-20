
from flask import Blueprint

bp = Blueprint('views', __name__)

from project.asset.views import routes
