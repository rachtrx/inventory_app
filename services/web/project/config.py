import os

basedir = os.path.abspath(os.path.dirname(__file__))
print(basedir)


class Config:
    SECRET_KEY = os.getenv('SECRET_KEY')

    # Database
    if not os.getenv("DATABASE_URL") is None:
        SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL")
        STATIC_FOLDER = os.path.join(os.getenv("APP_FOLDER"), "project", "static")
        UPLOADS_FOLDER = os.path.join(os.getenv("APP_FOLDER"), "project", "uploads")
    else:
        SQLALCHEMY_DATABASE_URI = 'sqlite:///' + os.path.join(basedir, 'inventory.db')
        STATIC_FOLDER = f"{basedir}/static"
        UPLOADS_FOLDER = f"{basedir}/uploads"
        os.makedirs(UPLOADS_FOLDER, exist_ok=True)

    SQLALCHEMY_TRACK_MODIFICATIONS = False
    ALLOWED_EXTENSIONS = {'pdf', 'xlsx', 'xls'}
