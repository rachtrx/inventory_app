
from flask import Blueprint

bp = Blueprint('apis', __name__)

from project.asset.apis import routes
