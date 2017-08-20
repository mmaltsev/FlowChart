/**
 * Initialization of global variables.
 */
var globalEditFirstTouch = false
var globalEditId = -1
var globalInputClick = false
var globalCharts = {}

/**
 * Enter point of the index.html file.
 */
window.onload = function() {
  getData()
}

/**
 * Gets data with list of flow charts from the API.
 */
function getData() {
    axios({
    method:'get',
    url:'../data/charts.json',
    responseType:'json'
  })
    .then(function(response) {
      globalCharts = response.data
      drawTable()
    })
    .catch(function(error) {
      console.log(error);
    });
}

/**
 * Posts data to the API.
 * @constructor
 * @param {object} json - Data that needed to be saved.
 * @param {string} message - Action that has been made ('add'/'edit'/'').
 * @param {number} id - Id of the flowchart that has been affected.
 */
function sendData(json, message, id) {
  axios.post('/post/charts', {
    json: json,
    message: message,
    id: id
  })
    .then(function (response) {
    })
    .catch(function (error) {
      console.log(error);
    });
}

/**
 * Generates and pushes HTML with table of flow charts to the DOM.
 */
function drawTable() {
  let charts = globalCharts.charts
  let id = globalEditId
  let table = document.getElementById('table')
  let tableCode = '<table class="charts-table"><tr><td><b>Name</b></td>' +
                               '<td><b>Description</b></td><td></td><td></td></tr>'
  for (var i = 0; i < charts.length; i++) {
    if (charts[i].active && i !== id) {
      tableCode += '<tr>'
      tableCode += '<td onclick="openChart(' + i + ')">' + charts[i].name + '</td>'
      tableCode += '<td onclick="openChart(' + i + ')">' + charts[i].description + '</td>'
      tableCode += '<td><img src="img/edit.png" onclick="editChartInfo(' + i + ')" class="icon" title="edit" /></td>'
      tableCode += '<td><img src="img/delete.png" onclick="deleteChart(' + i + ')" class="icon" title="delete" /></td>'
      tableCode += '</tr>'
    } else if (charts[i].active && i === id) {
      tableCode += '<tr>'
      tableCode += '<td class="edit-td"><input onclick="inputClick()" id="name-input" class="name-input" value="' + charts[i].name + '" /></td>'
      tableCode += '<td class="edit-td"><input onclick="inputClick()" id="desc-input" class="desc-input" value="' + charts[i].description + '" /></td>'
      tableCode += '<td><img src="img/pencil.png" onclick="editChartInfo(' + i + ')" class="icon" title="edit" /></td>'
      tableCode += '<td><img src="img/delete.png" onclick="deleteChart(' + i + ')" class="icon" title="delete" /></td>'
      tableCode += '</tr>'

      globalEditFirstTouch = true
    }
  }
  tableCode += '</table>'
  table.innerHTML = tableCode

  // Listening to Enter click for name-input and desc-input
  if (id > -1) {
    document.getElementById("name-input")
      .addEventListener("keyup", function(event) {
        event.preventDefault();
        if (event.keyCode == 13) {
          bodyClick()
        }
      });
    document.getElementById("desc-input")
      .addEventListener("keyup", function(event) {
        event.preventDefault();
        if (event.keyCode == 13) {
          bodyClick()
        }
      });
  }
}

/**
 * Adds info about the new flow.
 * Fires when a button 'Add new flow' clicked.
 */
function newChart() {
  let id = globalCharts.charts.length
  globalCharts.charts.push({name: 'flow' + id, description: '', active: true})
  sendData(globalCharts, 'add', id)
  drawTable()
}

/**
 * Marks id of the flowchart as in process of editing.
 * @constructor
 * @param {number} id - Id of the flowchart that has been affected..
 */
function editChartInfo(id) {
  globalEditId = id
  drawTable()
}

/**
 * Updates info about chart (changes acive status to false).
 * @constructor
 * @param {number} id - Id of the flowchart that has been affected..
 */
function deleteChart(id) {
  globalCharts.charts[id].active = false
  sendData(globalCharts, '', id)
  drawTable()
}

/**
 * Opens a new tab and redirected there to the chart editor.
 * @constructor
 * @param {number} id - Id of the flowchart that has been affected..
 */
function openChart(id) {
  window.open('chart/' + id)
}

/**
 * Handles any click inside the <body> tag.
 */
function bodyClick() {
  let id = globalEditId
  if (id !== null && +id > -1 && !globalEditFirstTouch && !globalInputClick) {
    let newName = document.getElementById('name-input').value
    let newDesc = document.getElementById('desc-input').value
    globalCharts.charts[id].name = newName
    globalCharts.charts[id].description = newDesc
    globalEditId = -1
    sendData(globalCharts, 'edit', id)
    drawTable()
  } else if (globalEditFirstTouch) {
    globalEditFirstTouch = false
  } else if (globalInputClick) {
    globalInputClick = false
  }
}

/**
 * Handles click on the input while editing flowchart info.
 */ 
function inputClick() {
  globalInputClick = true
}
