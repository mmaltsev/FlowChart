@ECHO OFF

ECHO.-----Pulling last changes from repository-----
CALL git pull

ECHO.-----Updating node_modules-----
cd front

ECHO.-----Starting the server-----
cd ..\back
CALL conda env create -f dev_environment.yml
CALL activate FlowChart
python run.py

ECHO ON
