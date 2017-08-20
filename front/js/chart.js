/**
 * Initialization of global variables.
 */
var globalChartId
var globalChartData = {}
var svg
var globalIsLinePlusClick = false
var globalIsBlockMinusClick = false
var globalIsLineMinusClick = false
var globalIsBlockEdit = false
var globalIsGrid = false
var globalEditFirstTouch = false
var globalEditId = -1
var globalIdsToConnect = []
var gridStep = 10

/**
 * Enter point of the chart.html file.
 */
window.onload = function() {
  svgCanvasOutline()
  urlProcessor()
  getData()
}

/**
 * Draws basic SVG canvas.
 */
function svgCanvasOutline() {
  svg = d3.select("#content")
    .append("svg")
    .attr("width", "100%")
    .attr("height", "100%")
    .on("click", function(d,i) {
      if (globalIsLinePlusClick && globalIdsToConnect.length === 2) {
        connectNodes()
        linePlusClick()
      } else if (globalIsBlockEdit && !globalEditFirstTouch && globalEditId > -1) {
        blockInfoUpdate()
      } else if (globalEditFirstTouch) {
        globalEditFirstTouch = false
      }
    });
}

function blockInfoUpdate() {
  blockEdit()
  if (document.getElementById('edit-input')) {
    let newName = document.getElementById('edit-input').value
    globalChartData.nodes[globalEditId].name = newName
  }
  globalEditId = -1
  svg.select('foreignObject').remove()
  drawSVG()
}

/**
 * Adds a new link.
 */
function connectNodes() {
  let newLink = {source: globalIdsToConnect[0], target: globalIdsToConnect[1]}
  if (!globalChartData.links.includes(newLink)) {
    globalChartData.links.push(newLink)
    let linkData = {"nodes": [],"links": [newLink]}
    drawSVG()
  }
}

/**
 * Extracts id from the url.
 */
function urlProcessor() {
  let url = window.location.href
  globalChartId = url.substr(url.search('/chart/') + '/chart/'.length, url.length - 1)
  getTitle()
}

/**
 * Updates document title.
 */
function getTitle() {
  let id = globalChartId
  axios({
    method:'get',
    url:'../data/charts.json',
    responseType:'json'
  })
    .then(function(response) {
      let title = response.data.charts[id].name || 'Chart' + globalChartId
      document.title = title + ' - FlowChart'
    })
    .catch(function(error) {
      console.log(error);
    });
}

/**
 * Gets data about current flowchart from the API.
 */
function getData() {
  let id = globalChartId
  axios({
    method:'get',
    url:'../data/chart_data/' + id + '.json',
    responseType:'json'
  })
    .then(function(response) {
      globalChartData = response.data
      drawSVG()
    })
    .catch(function(error) {
      console.log(error);
    });
}

/**
 * Outlines nodes and links in SVG.
 */
function drawSVG() {
  // Constants and preprocessing
  let baseMarginY = 10
  let nodeHeadTextMarginX = 5
  let nodeHeadTextMarginY = 15
  let linkMarginX = 35
  let linkBottomMarginY = 60
  let nodeWidth = 70
  let nodeHeadHeight = 20
  let nodeBaseHeight = 50

  dataToGridForm()
  data = globalChartData
  d3.selectAll("g").remove()
  d3.selectAll("line").remove()

  // Dragging functionality
  var drag = d3.drag()
    .on("drag", function(d, i) {
      d.x += d3.event.dx
      d.y += d3.event.dy
      d3.select(this).select(".node-head")
        .attr("x", grid(d.x, 0))
        .attr("y", grid(d.y, 0));
      
      d3.select(this).select(".node-base")
        .attr("x", grid(d.x, 0))
        .attr("y", grid(d.y, baseMarginY));
      
      d3.select(this).select(".node-head-text")
        .attr("x", grid(d.x, nodeHeadTextMarginX))
        .attr("y", grid(d.y, nodeHeadTextMarginY));

      links.each(function(l, li) {
        if (l.source == i) {
          d3.select(this)
            .attr("x1", grid(d.x, linkMarginX))
            .attr("y1", grid(d.y, linkBottomMarginY));
        } else if (l.target == i) {
          d3.select(this)
            .attr("x2", grid(d.x, linkMarginX))
            .attr("y2", grid(d.y, 0));
        }
      });
    });

  // Links outlining
  var links = svg.selectAll("link")
    .data(data.links)
    .enter()
    .append("line")
    .attr("class", "link")
    .attr("x1", function(l) {
      var sourceNode = data.nodes.filter(function(d, i) {
        return i == l.source
      })[0];
      d3.select(this).attr("y1", sourceNode.y + linkBottomMarginY);
      return sourceNode.x + linkMarginX
    })
    .attr("x2", function(l) {
      var targetNode = data.nodes.filter(function(d, i) {
        return i == l.target
      })[0];
      d3.select(this).attr("y2", targetNode.y);
      return targetNode.x + linkMarginX
    })
    .attr("fill", "none")
    .attr("stroke", "gray")
    .attr("stroke-width", "5px")
    .on("click", function(d, i) {
      if (globalIsLineMinusClick) {
        deleteLink(i)
      }
    });
  
  // Nodes outlining
  var nodes = svg.selectAll("node")
    .data(data.nodes)
    .enter().append("g")
    .attr("id", function(d, i) {
      return 'block' + i
    })
    .call(drag)
    .on("click", function(d, i) {
      if (globalIsLinePlusClick && (globalIdsToConnect.length == 1 &&
             globalIdsToConnect[0] !== i || globalIdsToConnect.length == 0)) {
        globalIdsToConnect.push(i)
      } else if (globalIsBlockMinusClick) {
        deleteNode(i)
      } else if (globalIsBlockEdit && globalEditId == -1) {
        globalEditFirstTouch = true
        globalEditId = i
        var fo = svg.append('foreignObject')
                    .attr('x', grid(d.x, 0))
                    .attr('y', grid(d.y, 0))
        var div = fo.append('xhtml:div')
                    .append('input')
                    .attr('class', 'tooltip')
                    .attr('id', 'edit-input')
                    .on("click", function() {
                      globalEditFirstTouch = true
                    });
        document.getElementById('edit-input').value = d.name
        document.getElementById("edit-input")
          .addEventListener("keyup", function(event) {
            event.preventDefault();
            if (event.keyCode == 13) {
              blockInfoUpdate()
            }
          });
    }
    })
  
  nodes.append("rect")
    .attr("class", "node-base")
    .attr("x", function(d) {
      return d.x
    })
    .attr("y", function(d) {
      return d.y + baseMarginY
    })
    .attr("width", nodeWidth)
    .attr("height", nodeBaseHeight)
    .attr("fill", "lightgray")
    
  nodes.append("rect")
    .attr("class", "node-head")
    .attr("x", function(d) {
      return d.x
    })
    .attr("y", function(d) {
      return d.y
    })
    .attr("width", nodeWidth)
    .attr("height", nodeHeadHeight)
    .attr("fill", "lightblue")
  
  nodes.append("text")
    .attr('class', 'node-head-text')
    .attr("x", function(d) {
      return d.x + nodeHeadTextMarginX
    })
    .attr("y", function(d) {
      return d.y + nodeHeadTextMarginY
    })
    .text(function(d) {
      return d.name
    });
}

/**
 * Controls the grid-like structure in SVG.
 * @constructor
 * @param {number} coord - current coordinate of the element.
 * @param {number} margin - margin for parts of some complex elements.
 * @param {number} gridStep - step of the SVG grid.
 */
function grid(coord, margin) {
  if (coord%gridStep > 0) {
    coord = coord - coord%gridStep
  }
  return coord + margin
}

/**
 * Posts data to the API.
 * Fires when save button is clicked.
 */
function saveClick() {
  dataToGridForm()
  axios.post('/post/chart_data', {
    json: globalChartData,
    id: globalChartId
  })
    .then(function (response) {
      console.log('Successful update');
    })
    .catch(function (error) {
      console.log(error);
    });
}

function dataToGridForm() {
  for (var i = 0; i < globalChartData.nodes.length; i++) {
    globalChartData.nodes[i].x = grid(globalChartData.nodes[i].x, 0)
    globalChartData.nodes[i].y = grid(globalChartData.nodes[i].y, 0)
  }
}

/**
 * Adds a new node to the data.
 * Fires when block-plus icon is clicked.
 */
function blockPlusClick() {
  buttonsToDefault('blockPlus')
  let id = globalChartData.nodes.length
  let newNode = {name: '' + id, x: 10, y: 10}
  globalChartData.nodes.push(newNode)
  let nodeData = {"nodes": [newNode],"links": []}
  drawSVG()
}

/**
 * Highlights button.
 */
function linePlusClick() {
  buttonsToDefault('linePlus')
  globalIsLinePlusClick = !globalIsLinePlusClick
  let lineButton = document.getElementById('line-plus-button')
  if (globalIsLinePlusClick) {
    lineButton.className = "menu-element-gray"
    globalIdsToConnect = []
  } else {
    lineButton.className = "menu-element"
  }
}

/**
 * Deletes specified node.
 * Fires when line-plus icon is clicked.
 */
function blockMinusClick() {
  buttonsToDefault('blockMinus')
  globalIsBlockMinusClick = !globalIsBlockMinusClick
  let blockButton = document.getElementById('block-minus-button')
  if (globalIsBlockMinusClick) {
    blockButton.className = "menu-element-gray"
  } else {
    blockButton.className = "menu-element"
  }
}

function deleteNode(id) {
  let links = globalChartData.links
  for (let i = links.length - 1; i >= 0; i--) {
    if (links[i].source === id || links[i].target === id) {
      globalChartData.links.splice(i, 1)
    }
  }
  globalChartData.nodes.splice(id, 1)
  for (let i = 0; i < globalChartData.links.length; i++) {
    if (globalChartData.links[i].source > id) {
      globalChartData.links[i].source = globalChartData.links[i].source - 1
    }
    if (globalChartData.links[i].target > id) {
      globalChartData.links[i].target = globalChartData.links[i].target - 1
    }
  }
  blockMinusClick()
  drawSVG()
}

/**
 * Deletes specified link.
 * Fires when line-plus icon is clicked.
 */
function lineMinusClick() {
  buttonsToDefault('lineMinus')
  globalIsLineMinusClick = !globalIsLineMinusClick
  let lineButton = document.getElementById('line-minus-button')
  if (globalIsLineMinusClick) {
    lineButton.className = "menu-element-gray"
  } else {
    lineButton.className = "menu-element"
  }
}

function deleteLink(id) {
  globalChartData.links.splice(id, 1)
  lineMinusClick()
  drawSVG()
}

function blockEdit() {
  buttonsToDefault('blockEdit')
  globalIsBlockEdit = !globalIsBlockEdit
  if (!globalIsBlockEdit && document.getElementById('edit-input')) {
    blockInfoUpdate()
    globalIsBlockEdit = !globalIsBlockEdit
  } 
  let editButton = document.getElementById('block-edit')
  if (globalIsBlockEdit) {
    editButton.className = "menu-element-gray"
  } else {
    editButton.className = "menu-element"
  }
}

function buttonsToDefault(msg) {
  if (msg !== 'linePlus' && globalIsLinePlusClick)
    linePlusClick()
  if (msg !== 'blockMinus' && globalIsBlockMinusClick)
    blockMinusClick()
  if (msg !== 'lineMinus' && globalIsLineMinusClick)
    lineMinusClick()
  if (msg !== 'blockEdit' && globalIsBlockEdit)
    blockEdit()
}

function gridOutline() {
  globalIsGrid = !globalIsGrid
  let gridButton = document.getElementById('grid')
  if (globalIsGrid) {
    gridButton.className = "menu-element-gray"
  } else {
    gridButton.className = "menu-element"
  }
  if (globalIsGrid) {
    console.log('here comes the grid!')
  } else {
    console.log('here it goes away!')
  }
}
