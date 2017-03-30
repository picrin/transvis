function driveSearchBox() {
  var input = document.getElementById('geneSearch')
  var timer
  input.addEventListener('keyup',function(evt) {
    clearTimeout(timer)
    timer = setTimeout(function(){chooseGene(evt)}, 350)
  })
}

var heightC = 20
var trackSpace = 30
var topC = 10

var unselectedOpc = 0.6

function trackLocation(track) {
  return (heightC + trackSpace) * track
}

function createExonRect(left, right, track, exonID) {
  var exonRect = document.createElementNS("http://www.w3.org/2000/svg", "rect")
  exonRect.setAttributeNS(null, "x", left)
  exonRect.setAttributeNS(null, "y", topC + trackLocation(track))
  exonRect.setAttributeNS(null, "width", right - left)
  exonRect.setAttributeNS(null, "height", heightC)
  exonRect.setAttributeNS(null, "fill", "#74AD68")
  exonRect.setAttributeNS(null, "fill-opacity", unselectedOpc)
  exonRect.setAttributeNS(null, "onclick", "onExonClick(evt)")
  exonRect.setAttributeNS(null, "height", heightC)
  exonRect.setAttributeNS(null, "data-selected", 0)
  exonRect.setAttributeNS(null, "data-exonID", exonID)

  return exonRect
}

function setMinimumHeight(desiredHeight) {
  var geneCanvas = window.parent.document.getElementById("geneCanvas")
  var doc = geneCanvas.contentDocument
  var canvas = doc.getElementById("geneCanvas")
  var currentHeight = canvas.getAttributeNS(null, "height")
   if (desiredHeight > currentHeight) {
      canvas.setAttributeNS(null, "height", desiredHeight + 10)
    }
}

function commonTrackElem(track) {
  setMinimumHeight(trackLocation(track + 1))
}

function createAffyRect(left, right, track, pValue, affyID) {
  var exonRect = document.createElementNS("http://www.w3.org/2000/svg", "rect")
  exonRect.setAttributeNS(null, "x", left)
  exonRect.setAttributeNS(null, "y", topC + trackLocation(track))
  exonRect.setAttributeNS(null, "width", right - left)
  exonRect.setAttributeNS(null, "height", heightC)
  if (pValue < 0.05) {
    color = "#ff8772"
  } else {
    color = "#71afff"
  }
  exonRect.setAttributeNS(null, "fill", color)
  exonRect.setAttributeNS(null, "fill-opacity", unselectedOpc)
  exonRect.setAttributeNS(null, "onclick", "onAffyClick(evt)")
  exonRect.setAttributeNS(null, "height", heightC)
  exonRect.setAttributeNS(null, "data-selected", 0)
  exonRect.setAttributeNS(null, "data-affyID", affyID)

  return exonRect
}

function deselectExon(exonRect) {
  exonRect.removeAttributeNS(null, "stroke")
  exonRect.removeAttributeNS(null, "stroke-width")
  exonRect.setAttributeNS(null, "fill-opacity", unselectedOpc)
  exonRect.setAttributeNS(null, "data-selected", 0)
  var exonID = exonRect.getAttributeNS(null, "data-affyID")
  var plotID = exonRect.innerHTML
  releasePlotID()
  removePlotForExon(exonID)
  exonRect.innerHTML = ""
}

function selectExon(exonRect) {
  exonRect.setAttributeNS(null, "stroke", "black")
  exonRect.setAttributeNS(null, "stroke-width", "1")
  exonRect.setAttributeNS(null, "fill-opacity", "1")
  exonRect.setAttributeNS(null, "data-selected", 1)
  exonRect.setAttributeNS(null, "font-family", "monospace")
  var plotID = getPlotID()
  exonRect.innerHTML = plotID
  var exonID = exonRect.getAttributeNS(null, "data-affyID")

  var geneCanvas = window.parent.document.getElementById("geneList")
  var affyData = geneCanvas.contentWindow.affyData

  var p = affyData[exonID]

  var container = containerForExonPlot(exonID)
  for (var prop in p) {
    if (!p.hasOwnProperty(prop)) {
        continue;
    }
    plotForExon(container, modalAlle, affyData[exonID][prop])
  }

}

function flipSelection(exonRect) {
  isSelected = exonRect.getAttributeNS(null, "data-selected")
  if (isSelected == 1) {
    deselectExon(exonRect)
  } else {
    selectExon(exonRect)
  }
}

function handleAffyClick(evt) {
  var svgobj = evt.target
  flipSelection(svgobj)
}

function clearCanvas() {
  var geneCanvas = window.parent.document.getElementById("geneCanvas")
  var doc = geneCanvas.contentDocument
  var myNode = doc.getElementById("svgParent")
  while (myNode.firstChild) {
    myNode.removeChild(myNode.firstChild)
  }
  window.trackRanges = [[]]
  myNode.innerHTML='<svg width="100%" xmlns="http://www.w3.org/2000/svg" id="geneCanvas" style="border:1px solid black;">'

  //myNode.setAttributeNS(null, "height", 1)
}

var affyData = {}

var modalAlle = [11, 12, 12, 12, 83, 186, 240, 261, 290, 297, 297, 345, 373, 408, 561, 571, 593, 604, 654, 697, 740, 866, 872, 993, 999, 1000, 1035, 1111, 1261]

function getGeneView(gene) {
  var id = gene
  console.log(id)
  var httpRequest = new XMLHttpRequest()
  var request = '/api/clusterID/' + id
  httpRequest.onreadystatechange = function(){
    if (httpRequest.readyState === XMLHttpRequest.DONE) {
        if (httpRequest.status === 200) {
          var result = JSON.parse(httpRequest.responseText)
          var units = result[1]
          var left = result[0][1]
          var right = result[0][2]
          clearCanvas()
          for (unit of units) {
            drawExons(unit, left, right)
          }
          for (exon of result[2]) {
            drawAffy(exon[3], exon[4], exon[exon.length-3], exon[0], left, right)
            affyData[exon[0]] = exon[exon.length - 1]
          }
        }
        else {
          console.error(httpRequest.status, "when performing", request)
        }
      }
    }

  httpRequest.open('GET', request, true);
  httpRequest.send(null);
}


function createConnector(left, right, track) {
  var trackOffset = trackLocation(track)

  var midX = (right + left)/2
  var midY = topC + heightC/2 + trackOffset
  var bottomY = topC + heightC + trackOffset

  var leftLine = document.createElementNS("http://www.w3.org/2000/svg", "line")
  leftLine.setAttributeNS(null, "x1", left)
  leftLine.setAttributeNS(null, "x2", midX)
  leftLine.setAttributeNS(null, "y1", midY)
  leftLine.setAttributeNS(null, "y2", bottomY)
  leftLine.setAttributeNS(null, "stroke", "#74AD68")
  leftLine.setAttributeNS(null, "stroke-opacity", unselectedOpc)

  var rightLine = document.createElementNS("http://www.w3.org/2000/svg", "line")
  rightLine.setAttributeNS(null, "x1", right)
  rightLine.setAttributeNS(null, "x2", midX)
  rightLine.setAttributeNS(null, "y1", midY)
  rightLine.setAttributeNS(null, "y2", bottomY)
  rightLine.setAttributeNS(null, "stroke", "#74AD68")
  rightLine.setAttributeNS(null, "strok-opacity", unselectedOpc)
  return [leftLine, rightLine]
}

function translateCoord(rangeLeft, rangeRight, coord) {
  var geneCanvas = window.parent.document.getElementById("geneCanvas")
  var doc = geneCanvas.contentDocument
  var canvas = doc.getElementById("geneCanvas")
  var gBCR = canvas.getBoundingClientRect()
  var w = gBCR.right - gBCR.left
  var newCoord =  ((coord - rangeLeft) / (rangeRight - rangeLeft)) * w
  return newCoord
}

var trackRanges = [[]]

function checkInside(left, right, point){
  var result = (point <= right && left <= point)
  return result
}

function chooseTrack(left, right) {
  var tracksInUse = trackRanges.length
  for (var i = 0; i < tracksInUse; i++) {
    var goodTrack = true
    var genesOnTrack = trackRanges[i].length
    for (var j = 0; j < genesOnTrack; j++) {
      var testLeft = trackRanges[i][j][0]
      var testRight = trackRanges[i][j][1]
      if (checkInside(left, right, testLeft) ||
          checkInside(left, right, testRight) ||
          checkInside(testLeft, testRight, left) ||
          checkInside(testLeft, testRight, right)
         ) {
        goodTrack = false
        break
      }
    }
    if (goodTrack){
      trackRanges[i].push([left, right])
      return i
    }
  }
  trackRanges.push([[left, right]])
  return tracksInUse
}

var trackRangesAffy = [[]]
function chooseTrackAffy(left, right) {
  var tracksInUse = trackRangesAffy.length
  for (var i = 0; i < tracksInUse; i++) {
    var goodTrack = true
    var genesOnTrack = trackRangesAffy[i].length
    for (var j = 0; j < genesOnTrack; j++) {
      var testLeft = trackRangesAffy[i][j][0]
      var testRight = trackRangesAffy[i][j][1]
      if (checkInside(left, right, testLeft) ||
          checkInside(left, right, testRight) ||
          checkInside(testLeft, testRight, left) ||
          checkInside(testLeft, testRight, right)
         ) {
        goodTrack = false
        break
      }
    }
    if (goodTrack){
      trackRangesAffy[i].push([left, right])
      return i + trackRanges.length
    }
  }
  trackRangesAffy.push([[left, right]])
  return tracksInUse + trackRanges.length
}

function drawExons(units, rangeLeft, rangeRight) {
  var exons = []
  var description = ""
  for (var unit of units) {
    if (unit[0] == "exon") {
      if (unit[6] != "") {
        description = unit[6]
      }
      exons.push(
        [translateCoord(rangeLeft, rangeRight, unit[3]),
         translateCoord(rangeLeft, rangeRight, unit[4])])
    }
  }
  exons.sort(function(a, b){
    if(a[0] < b[0]) return -1;
    if(a[0] > b[0]) return 1;
    return 0;
  })
  var track = chooseTrack(exons[0][0], exons[exons.length - 1][1])
  var geneCanvas = window.parent.document.getElementById("geneCanvas")
  var doc = geneCanvas.contentDocument
  var canvas = doc.getElementById("geneCanvas")
  for (var i = 0; i < exons.length - 1; i++) {
    var right = exons[i][1]
    var left = exons[i + 1][0]
    for (var c of createConnector(left, right, track)) {
      canvas.appendChild(c)
    }
  }

  for (var i = 0; i < exons.length; i++) {
    canvas.appendChild(createExonRect(exons[i][0], exons[i][1], track, 0))
  }

  if (exons.length != 0) {
    x = exons[0][0]
    y = trackLocation(track + 1)
    text = document.createElementNS("http://www.w3.org/2000/svg", "text")
    text.setAttributeNS(null, "x", x)
    text.setAttributeNS(null, "y", y)
    text.setAttributeNS(null, "font-family", "monospace")
    text.innerHTML = description
    canvas.appendChild(text)
  }
  commonTrackElem(track)
}


function drawAffy(left, right, pValue, affyID, leftMost, rightMost) {
  var geneCanvas = window.parent.document.getElementById("geneCanvas")
  var doc = geneCanvas.contentDocument
  var canvas = doc.getElementById("geneCanvas")
  translatedLeft = translateCoord(leftMost, rightMost, left - 0.005 * (rightMost - leftMost))
  translatedRight = translateCoord(leftMost, rightMost, right + 0.005 * (rightMost - leftMost))
  var track = chooseTrackAffy(translatedLeft, translatedRight)
  var affyRect = createAffyRect(translatedLeft, translatedRight, track, pValue, affyID)
  canvas.appendChild(affyRect)
  commonTrackElem(track + 1)
  text = document.createElementNS("http://www.w3.org/2000/svg", "text")
  text.setAttributeNS(null, "x", left)
  text.setAttributeNS(null, "y", trackLocation(track+1))
  text.setAttributeNS(null, "font-family", "monospace")
  text.setAttributeNS(null, "data-probeset", affyID)
  text.innerHTML = affyID
  canvas.appendChild(text)
}


function loadUnits(chr, left, right) {
  var httpRequest = new XMLHttpRequest()
  httpRequest.onreadystatechange = function(){
    if (httpRequest.readyState === XMLHttpRequest.DONE) {
      var units = JSON.parse(httpRequest.responseText)
      for (var unit of units) {
        drawExons(unit, left, right)
      }
    }
  }
  httpRequest.open('GET', '/api/genecode/' + chr + ":" + left + ":" + right, true);
  httpRequest.send(null);
}

function loadGenes() {
  var i = 1
  var sidebar = document.getElementById("sidebar")
  var httpRequest = new XMLHttpRequest()
  httpRequest.onreadystatechange = function(){
    if (httpRequest.readyState === XMLHttpRequest.DONE) {
      var geneList = JSON.parse(httpRequest.responseText)
      var numbers = 0
      for (var gene of geneList) {
        var link = document.createElement("a")
        var row = document.createElement("tr")
        var left = document.createElement("th")
        var middle = document.createElement("th")
        var right = document.createElement("th")
        link.setAttribute("href", "#")
        link.setAttribute("onclick", "getGeneView(this)")
        if (gene[0].length >= 1) {
          link.innerHTML = gene[0][0]
        } else {
          link.innerHTML = "?"
        }
        left.innerHTML = i + "."
        i += 1
        right.innerHTML = gene[2].toPrecision(2)
        link.setAttributeNS(null, "data-clusterID", gene[1])
        middle.appendChild(link)
        sidebar.appendChild(row)
        row.appendChild(left)
        row.appendChild(middle)
        row.appendChild(right)
        numbers+=1
      }
    }
  }
  httpRequest.open('GET', '/api/geneList', true);
  httpRequest.send(null);
}


(function(window, document) {
  "use strict"
  window.onload = init
  function init() {
    driveSearchBox()
    loadGenes()
  }
})(window, document)
