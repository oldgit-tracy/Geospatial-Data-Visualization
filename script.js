// the geojson files are large, so loading them locally
var urls = {
  basemap: "SupervisorDistricts.geojson",
  Trees: "TreeMaintain.json"

};


var svg = d3.select("body").select("svg");

var g = {
  basemap: svg.append("g").attr("id", "basemap"),
  Trees: svg.append("g").attr("id", "Trees"),
  tooltip: svg.append("g").attr("id", "tooltip"),
  details: svg.append("g").attr("id", "details")
};


// https://github.com/d3/d3-geo#conic-projections
var projection = d3.geoConicEqualArea();
var path = d3.geoPath().projection(projection);

// http://mynasadata.larc.nasa.gov/latitudelongitude-finder/
// center on san francisco [longitude, latitude]
// choose parallels on either side of center
projection.parallels([37.692514, 37.840699]);

// rotate to view we usually see of sf
projection.rotate([122, 0]);

// we want basemap to load before Trees
// https://github.com/d3/d3-queue
var q = d3.queue()
  .defer(d3.json, urls.basemap)
  .await(drawMap);

function drawMap(error, basemap) {
  if (error) throw error;
  console.log("basemap", basemap);
  //console.log("streets", streets);

  // make sure basemap fits in projection
  projection.fitSize([960, 600], basemap);

  // draw basemap
  var land = g.basemap.selectAll("path.land")
    .data(basemap.features)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("class", "land");


  // used to show neighborhood outlines on top of streets
  g.basemap.selectAll("path.neighborhood")
    .data(basemap.features)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("class", "neighborhood")
    .each(function(d) {
      // save selection in data for interactivity
      d.properties.outline = this;
    });


  // setup tooltip (shows neighborhood name)
    var tip = g.tooltip.append("text").attr("id", "tooltip");
    tip.attr("text-anchor", "end");
    tip.attr("dx", -5);
    tip.attr("dy", -5);
    tip.style("visibility", "hidden")
    tip.append("xhtml:body")
      .style("text-align", "left")
      .style("background", "none")
      .html("<p>N/A</p >");



    // add interactivity
    land.on("mouseover", function(d) {
        tip.text("Supname: "+d.properties.supname + ", " +"Supdist: "+d.properties.supdist );



        tip.style("visibility", "visible");

        d3.select(d.properties.outline).raise();
        d3.select(d.properties.outline).classed("active", true);
      })
      .on("mousemove", function(d) {
        var coords = d3.mouse(g.basemap.node());
        tip.attr("x", coords[0]);
        tip.attr("y", coords[1]);
      })
      .on("mouseout", function(d) {
        tip.style("visibility", "hidden");
        d3.select(d.properties.outline).classed("active", false);
      });

    d3.json(urls.Trees, drawTrees);
  }



  function drawTrees(error, Trees) {
  if (error) throw error;
  console.log("Trees", Trees);

  var symbols = g.Trees.selectAll("circle")
    .data(Trees.data)
    .enter()
    .append("circle")
    .attr("cx", function(d) { return projection([+d[21][2], +d[21][1]])[0]; })
    .attr("cy", function(d) { return projection([+d[21][2], +d[21][1]])[1]; })
    .attr("r", 5)
    .attr("fill", function(d) {
      if (d[12] == "Closed") {
        return "lightblue";
      } else if (d[12] == "Open") {
        return "pink";
      } else {
        return "red";
      }
    })
    .attr("class", "symbol");

  // add details widget
  // https://bl.ocks.org/mbostock/1424037
  var details = g.details.append("foreignObject")
    .attr("id", "details")
    .attr("width", 960)
    .attr("height", 600)
    .attr("Point",0)
    .attr("x", 0)
    .attr("y", 0);

  var body = details.append("xhtml:body")
    .style("text-align", "left")
    .style("background", "none")
    .html("<p>N/A</p >");

  details.style("visibility", "hidden");

  symbols.on("mouseover", function(d) {
    d3.select(this).raise();
    body.style("visibility", "visible");
    d3.select(this).classed("active", true)
    ;

    symbols.on("mouseout", function(d) {
       body.style("visibility", "hidden");
      //d3.select(this).raise();
      d3.select(this).classed("active", false)
      ;
    });


    body.html("<table border=0 cellspacing=0 cellpadding=2>" + "\n" +
      "<tr><th>Supervisor District:</th><td>" + d[19] + "</td></tr>" + "\n" +
      "<tr><th>Request details:</th><td>" + d[17] + "</td></tr>" + "\n" +
      "<tr><th>Neighborhood:</th><td>" + d[20] + "</td></tr>" + "\n" +
      "</table>");

    details.style("visibility", "visible");
  });
  }

  function translate(x, y) {
    return "translate(" + String(x) + "," + String(y) + ")";
  }

var legendText = ["Closed", "Opened"];
