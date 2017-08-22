echo "-----Pulling last changes from repository-----"
git pull

echo "-----Updating node_modules-----"
cd front

echo "-----Starting the server-----"
cd ../back
conda env create -f dev_environment.yml
source activate FlowChart
python run.py
