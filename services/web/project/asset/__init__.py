from flask import Blueprint

bp = Blueprint('asset', __name__)

from .views import bp as asset_views_bp
bp.register_blueprint(asset_views_bp, url_prefix='/views')

from .forms import bp as asset_forms_bp
bp.register_blueprint(asset_forms_bp, url_prefix='/forms')

from .apis import bp as asset_apis_bp
bp.register_blueprint(asset_apis_bp, url_prefix='/api')

from project.asset import routes
