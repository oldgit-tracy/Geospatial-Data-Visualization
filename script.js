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

    //
    // function get_centroid(sel){
    //   var coords = d3.select(sel).attr('d');
    // //  coords = coords.replace(/ *[LC] */g,'],[').replace(/ *M */g,'[[[').replace(/ *z */g,']]]').replace(/ /g,'],[');
    //   return d3.geo.path().centroid({
    //     "type":"Feature",
    //     "geometry":{"type":"Polygon","coordinates":JSON.parse(coords)}
    //   });
    // }
    //

  // setup tooltip (shows neighborhood name)
    var tip = g.tooltip.append("text").attr("id", "tooltip");
    tip.attr("text-anchor", "end");
    tip.attr("dx", -5);
    tip.attr("dy", -5);
    tip.style("visibility", "hidden");

    // add interactivity
    land.on("mouseover", function(d) {
        //tip.text(d.properties.supname + " , " +d.properties.supdist );
        //tip.text(d.properties.supdist) // show properties text
        tip.text(
          "supname:" + d.properties.supname + "<\r>"+
           "Supervisor:" + d.properties.supervisor  + "\n" +
           "Numbertext:" + d.properties.numbertext + "\n" +
           "SUPERVISORIAL DISTRICT:" + d.properties.supdist)
        ;


        tip.style("visibility", "visible")
        ;

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

  // function drawTrees(error, Trees) {
  //   if (error) throw error;
  //   console.log("Trees", Trees);
  //
  //   var symbols = g.Trees.selectAll("circle")
  //     //.data(Trees)
  //     .enter()
  //     .append("circle")
  //     // .attr("cx",40)
  //     // .attr("cy",40)
  //     .attr("cx", function(d) { return projection([+d.latitude, +d.longitude])[0]; })
  //       .attr("cy", function(d) { return projection([+d.latitude, +d.longitude])[1]; })
  //     //  .attr("cx", function(d) { return projection([+d.x, +d.y])[0]; })
  //     //    .attr("cy", function(d) { return projection([+d.x, +d.y])[1]; })
  //
  //     .attr("r", 5)
  //     .attr("fill", function(d) {
  //    if (d[12] == "Closed") {
  //      return "red";
  //    } else if (d[12] == "Open") {
  //      return "green";
  //    } else {
  //      return "black";
  //    }
  //  })
  //  .attr("class", "symbol");
  //
  //
  //
  //     var symbols = g.Trees.selectAll("circle")
  //         .data(Trees.data)
  //         .enter()
  //         .append("circle")
  //         .attr("cx", function(d) { return projection([+d[21][2], +d[21][1]])[0]; })
  //         .attr("cy", function(d) { return projection([+d[21][2], +d[21][1]])[1]; })
  //         .attr("r", 5)
  //         .attr("class", "symbol");
  //
  //
  //   // add details widget
  //   // https://bl.ocks.org/mbostock/1424037
  //   var details = g.details.append("foreignObject")
  //     .attr("id", "details")
  //     .attr("width", 960)
  //     .attr("height", 600)
  //     .attr("Point",0)
  //     // .attr("x", 0)
  //     // .attr("y", 0);
  //
  //   var body = details.append("xhtml:body")
  //     .style("text-align", "left")
  //     .style("background", "none")
  //     .html("<p>N/A</p>");
  //
  //   details.style("visibility", "hidden");
  //
  //   symbols.on("mouseover", function(d) {
  //     d3.select(this).raise();
  //     d3.select(this).classed("active", true);
  //
  //
  //     body.html("<table border=0 cellspacing=0 cellpadding=2>" + "\n" +
  //       "<tr><th>Supervisor District:</th><td>" + d.SupervisorDistricts + "</td></tr>" + "\n" +
  //       "<tr><th>Category:</th><td>" + d.category + "</td></tr>" + "\n" +
  //       "<tr><th>Neighborhood:</th><td>" + d.Neighborhood + "</td></tr>" + "\n" +
  //       "</table>");
  //
  //     details.style("visibility", "visible");
  //   });
  //
  //   symbols.on("mouseout", function(d) {
  //     d3.select(this).classed("active", false);
  //     details.style("visibility", "hidden");
  //   });
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
        return "red";
      } else if (d[12] == "Open") {
        return "green";
      } else {
        return "black";
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
    // .attr("x", 0)
    // .attr("y", 0);

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


// }
