"""File that contains the endpoints for the app."""
import logging
import traceback
import json
import random, threading, webbrowser

from gevent.wsgi import WSGIServer

from flask import (Flask, Response, render_template, request,
                   send_from_directory)
from pylogging import HandlerType, setup_logger

from .config import CONFIG

logger = logging.getLogger(__name__)
app = Flask(__name__, static_folder='../../front')


@app.before_first_request
def init():
    """Initialize the application with defaults."""
    logger.info("App initialized")


@app.route('/')
def root():
    """Root route."""
    logger.info("route: /")
    return app.send_static_file('index.html')


@app.route('/chart/<path:path>')
def chart(path):
    logger.info('route: /chart/{}'.format(path))
    if path.isdigit():
        return app.send_static_file('chart.html')
    else:
        path_prefix = '../../front'
        return send_from_directory(path_prefix, path)


@app.route('/post/charts', methods=['POST'])
def post_charts():
    logger.info('route: /post/charts')
    data = request.get_json()['json']
    message = request.get_json()['message']
    flow_id = request.get_json()['id']
    with open('../data/charts.json', 'w') as outfile:
        json.dump(data, outfile, indent = 2)
    if message == 'add':
        temp = {}
        temp['nodes'] = []
        temp['links'] = []
        print('add: ', temp)
        with open('../data/chart_data/{}.json'.format(flow_id), 'w') as outfile:
            json.dump(temp, outfile, indent = 2)
    return 'Succesful update.'


@app.route('/post/chart_data', methods=['POST'])
def post_chart_data():
    logger.info('route: /post/charts')
    data = request.get_json()['json']
    chartId = request.get_json()['id']
    with open('../data/chart_data/{}.json'.format(chartId), 'w') as outfile:
        json.dump(data, outfile, indent = 2)
    return 'Succesful update.'


@app.route('/data/<path:path>')
def data(path):
    logger.info('route: /data')
    if path.isdigit():
        path_prefix = '../../data/chart_data'
        path = path + '.json'
        return send_from_directory(path_prefix, path)
    elif path == 'flows':
        path_prefix = '../../data'
        path = 'charts.json'
        return send_from_directory(path_prefix, path)
    else:
        path_prefix = '../../data'
        return send_from_directory(path_prefix, path)

@app.route('/<path:path>')
def send_static(path):
    """Server static files."""
    logger.info("route: {}".format(path))
    path_prefix = '../../front'
    return send_from_directory(path_prefix, path)


def main():
    """Main entry point of the app."""
    try:
        http_server = WSGIServer((CONFIG['host'], CONFIG['port']),
                                 app,
                                 log=logging,
                                 error_log=logging)

        threading.Timer(1, lambda: webbrowser.open('http://{}:{}'.format(CONFIG['host'], CONFIG['port']))).start()
        http_server.serve_forever()
    except Exception as exc:
        logger.error(exc.message)
        logger.exception(traceback.format_exc())
    finally:
        # Do something here
        pass
