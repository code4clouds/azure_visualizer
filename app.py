#!/usr/bin/python

''' Azure Visualizer backend server '''

import os
from flask import Flask, render_template, request, current_app, json
from flask_api import status
import requests

app = Flask(__name__)  # Instantiate Flask

''' Configure app.config, otherwise use defaults '''
app.config['PORT'] = os.getenv('PORT', 5000)
app.config['EXPIRE_TIME'] = os.getenv('EXPIRE_TIME', 300)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'AZURESECRETKEY')
app.config['TENANT_ID'] = os.getenv('TENANT_ID', '')
app.config['CLIENT_ID'] = os.getenv('CLIENT_ID', '')
app.config['CLIENT_SECRET'] = os.getenv('CLIENT_SECRET', '')
app.config['SUBSCRIPTION'] = os.getenv('SUBSCRIPTION', '')


@app.route('/', methods=['GET'])
def root():
    ''' Read the root document and load form'''
    return current_app.send_static_file('index.html')


def isServerPreconfigured():
    ''' Return True if the server was configured using the environmental variables '''
    return not(app.config['CLIENT_ID'] == '' or app.config['CLIENT_SECRET'] == '' or app.config['TENANT_ID'] == '' or app.config['SUBSCRIPTION'] == '')


@app.route('/serverlogin', methods=['GET'])
def serverlogin():
    ''' Provides the status of the server environmetal variable '''
    # print(app.config['CLIENT_ID'])
    if isServerPreconfigured():
        return 'Server Pre-Configured', status.HTTP_200_OK
    else:
        return 'Server Not Pre-Configured.  Setup up your environmental variables properly', status.HTTP_417_EXPECTATION_FAILED


@app.route('/login', methods=['POST'])
def login():
    ''' Create a login request to Azure'''
    if isServerPreconfigured():
        print('Serve configured, using environmental variables')
        tenant_id = app.config['TENANT_ID']
        client_id = app.config['CLIENT_ID']
        client_secret = app.config['CLIENT_SECRET']
    else:
        print('Server not configured using client auth')
        payload = json.loads(request.get_data().decode('utf-8'))
        tenant_id = payload['tenant_id']
        client_id = payload['client_id']
        client_secret = payload['client_secret']

    url = str.format(
        "https://login.microsoftonline.com/{0}/oauth2/token", tenant_id)
    payload = str.format("grant_type=client_credentials" +
                         "&client_id={0}" +
                         "&client_secret={1}" +
                         "&resource=https%3A%2F%2Fmanagement.azure.com%2F",
                         client_id, client_secret)
    headers = {
        'content-type': "application/x-www-form-urlencoded",
        'cache-control': "no-cache",
    }
    print(url)
    response = requests.request("POST", url, data=payload, headers=headers)
    print("/login status code: " + str(response.status_code))
    print(response.text)

    if isServerPreconfigured():
        app.config['ACCESS_TOKEN'] = json.loads(response.text)['access_token']
        print("Server preconfigured")
        return json.dumps({'message': 'Server preconfigured'}), status.HTTP_204_NO_CONTENT
    else:
        print("Client Auth Response")
        # response.text, status.HTTP_200_OK
        return json.dumps({'access_token': json.loads(response.text)['access_token']})


@app.route('/subscriptions', methods=['GET'])
def subscriptions():
    ''' Get the azure resources '''

    if isServerPreconfigured():
        token = app.config['ACCESS_TOKEN']

    else:
        print('using client token')
        token = request.get_data().headers['token']

    url = str.format(
        "https://management.azure.com/subscriptions?api-version=2017-05-10")
    print(url)

    headers = {
        'cache-control': "no-cache",
        'authorization': 'Bearer ' + token
    }
    response = requests.request("GET", url, data='', headers=headers)
    print(response.text)
    return response.text, response.status_code


@app.route('/azureresources', methods=['POST'])
def resources():
    ''' Get the azure routes established by the client '''

    if isServerPreconfigured():
        token = app.config['ACCESS_TOKEN']
        subscription = app.config['SUBSCRIPTION']

    else:
        print('using client token')
        token = request.headers.get('token')
        subscription = request.headers.get('subscription')

    query = request.get_data().decode('utf-8')
    url = str.format(
        "https://management.azure.com/subscriptions/{0}{1}", subscription, query)
    print(url)

    headers = {
        'cache-control': "no-cache",
        'authorization': 'Bearer ' + token,
        'host': 'management.azure.com'
    }
    response = requests.request("GET", url, data='', headers=headers)
    print(response.text)
    return response.text, response.status_code


@app.route('/azureroute', methods=['POST'])
def azureroute():
    ''' Get the azure routes established by the client '''

    if isServerPreconfigured():
        token = app.config['ACCESS_TOKEN']
    else:
        print('using client token')
        token = request.headers.get('token')

    resoure_url = request.get_data().decode('utf-8')
    url = str.format(
        "https://management.azure.com{0}?api-version=2017-05-10", resoure_url)
    print(url)

    headers = {
        'cache-control': "no-cache",
        'authorization': 'Bearer ' + token,
        'host': 'management.azure.com'
    }
    response = requests.request("GET", url, data='', headers=headers)
    print(response.text)
    return response.text, response.status_code


@app.errorhandler(404)
def page_not_found():
    ''' Page no found message '''
    return render_template('404.html'), 400


@app.errorhandler(500)
def internal_server_error():
    ''' Server error message '''
    return render_template('500.html'), 500


@app.after_request
def add_header(response):
    """
    Add headers to both force latest IE rendering engine or Chrome Frame,
    and also to cache the rendered page for 10 minutes.
    """
    response.headers['X-UA-Compatible'] = 'IE=Edge,chrome=1'
    response.headers['Cache-Control'] = 'public, max-age=0'
    return response


if __name__ == '__main__':
    #  change the context if you have your own ssl cert
    #  with this:  context=('server.crt', 'server.key')
    app.run(debug=True,
            host='0.0.0.0',
            threaded=True,
            port=int(app.config['PORT']),
            ssl_context='adhoc'  # self-sign cert
           )
