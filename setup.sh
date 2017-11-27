#!/bin/bash
apt-get install -y python3 python3-pip
pip3 install -r requirements.txt
python manage.py test