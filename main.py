from flask import Flask, jsonify, render_template, redirect, url_for, flash, session, request
from dbinit import init_db
import bcrypt
import dbfunctions


from sqlite3 import Cursor

import sqlite3

from sqlite3 import Row

init_db()



app = Flask(__name__)


@app.route('/ping')
def index():
    return jsonify({"message": "pong"})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')


