@ECHO OFF

ECHO.-----Pulling last changes from repository-----
CALL git pull

ECHO.-----Starting the server-----
cd ..\back
CALL activate SpaceAtlas
python run.py

ECHO ON
