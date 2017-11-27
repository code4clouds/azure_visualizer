#!/usr/bin/python

import os
from flask import Flask, render_template, redirect, url_for, request, current_app

app = Flask(__name__)  # Instantiate Flask

''' Configure app.config, otherwise use defaults '''
app.config['PORT'] = os.getenv('PORT', 5000)
app.config['EXPIRE_TIME'] = os.getenv('EXPIRE_TIME', 300)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'AZURESECRETKEY')



@app.route('/', methods=['GET'])
def root():
    ''' Read the root document and load form'''
    return current_app.send_static_file('index.html')

@app.errorhandler(404)
def page_not_found(e):
    ''' Page no found message '''
    return render_template('404.html'), 400

@app.errorhandler(500)
def internal_server_error(e):
    ''' Server error message '''
    return render_template('500.html'), 500

if __name__ == '__main__':
    #  change the context if you have your own ssl cert
    #  with this:  context=('server.crt', 'server.key')
    app.run(debug=True,
            host='0.0.0.0',
            threaded=True,
            port=int(app.config['PORT']),
            # ssl_context='adhoc'  # self-sign ert
           )
