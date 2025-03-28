import os
from os.path import join, dirname
from project import create_app, db
from project.asset.models import Admin
from flask_bcrypt import generate_password_hash
from dotenv import load_dotenv
import logging

logging.basicConfig(
    filename="/home/app/web/app.log",
    filemode="a",
    level=logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

if not os.getenv("DATABASE_URL"):
    print(True)
    load_dotenv(join(dirname(__file__), ".flask_env"))

app = create_app()


@app.cli.command("create_db")
def create_db():
    db.create_all()
    db.session.commit()


@app.cli.command("remove_db")
def remove_db():
    db.drop_all()
    db.session.commit()


@app.cli.command("seed_db")
def seed_db():
    db.session.add(
        Admin(
            email=os.getenv("APP_EMAIL"),
            pwd=generate_password_hash(os.getenv("APP_PASSWORD")).decode("utf8"),
            username=os.getenv("APP_USERNAME"),
        )
    )
    db.session.commit()
