   /* warning, very ugly,  if we ever use this again i will fix this gross looking code */

    var debug = false;

    var width = 1100;
    height = 700;

    var looping = false;

    var usaJson;


    //  build usa map
    (function() {

        //Width and height
    
            //Define map projection
            var projection = d3.geo.albersUsa()
                                   .translate([width/2, height/2.4])
                                   .scale([1200]);
            //Define path generator
            var path = d3.geo.path()
                             .projection(projection);
            //Create SVG element
            var svg = d3.select("svg")
                       
            //Load in GeoJSON data
            d3.json("json/us_states.json", function(json) {
                
                //Bind data and create one path per GeoJSON feature
                svg.selectAll("path")
                   .data(json.features)
                   .enter()
                   .append("path")
                   .attr("d", path);
        

            d3.json("json/aas_people.json", function(error, json) {
                var json = _.pairs(json);

                var lengths = _.map(json, function(j) {
                    return j[1].people.length
                });

                var radiusScale = d3.scale.sqrt().domain([d3.min(lengths), d3.max(lengths)]).range([2, 20]);

                var d3description = d3.select(".usa .description");

                //sort data
                json.sort(function(a, b) {
                    return b[1].people.length - a[1].people.length;
                });
                //filter to us only
                usaJson = json.filter(function(j) {
                    var longLat = j[0].split(":");
                    var p = projection([parseFloat(longLat[0]), parseFloat(longLat[1]), ])
                    if (p) {
                        return true
                    }
                });


                svg.selectAll("circle")
                    .data(usaJson)
                    .enter()
                    .append("circle")
                    .classed("institution-circle", true)
                    .attr("r", function(d) {
                        return radiusScale(d[1].people.length);
                    })
                    .attr("transform", function(d) {
                        var longLat = d[0].split(":");
                        return "translate(" + projection([parseFloat(longLat[0]), parseFloat(longLat[1])]) + ")";
                    })
                    .attr("opacity", 0)
                    .transition()
                    .delay(function(d, i) {
                        return i * 10
                    })
                    .attr("opacity", 1);


     var loopId,
        circlesLength = usaJson.length;

        d3.select(".loop").on("click", function(){

            function randomHighlight(){
                var randomIndex = Math.floor(Math.random() * circlesLength);
                var selected = d3.selectAll(".usa circle").classed("selected", false)
                .filter(function(d,i){
                    return (i == randomIndex);
                }).classed("selected", true)
                .transition()
                .duration(1000)
                .attr("r", function(d) {
                        return radiusScale(d3.max(lengths)*2.5);
                    })
                .transition()
                .duration(1000)
                .attr("r", function(d) {
                        return radiusScale(d[1].people.length);
                    });     

               var d = selected[0][0].__data__;

                var d3description = d3.select(".usa .description div");

                var html = "<h3>" + d[1]["institution"] + " (" + _.uniq(d[1]["people"]).length + ")</h3>"
                html += "<ul class='list-unstyled'>"
                var sortedPeople = _.uniq(d[1]["people"]).sort();
                _.each(sortedPeople, function(p) {

                    html += "<li>" + p + "</li>"
                })

                html += "</ul>"
                d3description.html(html);

            }

            if (looping){

                looping = false;

                clearInterval(loopId);

                d3.selectAll(".usa circle").classed("selected", false);

                d3.select(".loop").text("loop").classed("btn-danger", false);


            }
            else {
                looping = true;

                loopId = setInterval(randomHighlight, 4000);

                d3.select(".loop").text("stop loop").classed("btn-danger", true);

            }
        })


            });
        });

    })();


    //build world map
    (function() {

        var width = 1000,
            height = 500;

        var projection = d3.geo.equirectangular()
            .scale(153)
            .translate([width / 2, height / 2])
            .precision(.1);

        var path = d3.geo.path()
            .projection(projection);

        var graticule = d3.geo.graticule();

        var svg = d3.select(".world svg");

        svg.append("path")
            .datum(graticule)
            .attr("class", "graticule")
            .attr("d", path);

        d3.json("json/simplified_world.json", function(error, world) {

            if (error) {
                console.log("Error:", error);
                return
            }
            svg.insert("path", ".graticule")
                .datum(topojson.feature(world, world.objects.land))
                .attr("class", "land")
                .attr("d", path);

            svg.insert("path", ".graticule")
                .datum(topojson.mesh(world, world.objects.countries, function(a, b) {
                    return a !== b;
                }))
                .attr("class", "boundary")
                .attr("d", path);

            d3.json("json/aas_people.json", function(error, json) {
                var json = _.pairs(json);

                var lengths = _.map(json, function(j) {
                    return j[1].people.length
                });

                var radiusScale = d3.scale.sqrt().domain([d3.min(lengths), d3.max(lengths)]).range([2, 15]);

                //sort data
                json.sort(function(a, b) {
                    return b[1].people.length - a[1].people.length;
                });

                svg.selectAll("circle")
                    .data(json)
                    .enter()
                    .append("circle")
                    .classed("institution-circle", true)
                    .attr("r", function(d) {
                        return radiusScale(d[1].people.length);
                    })
                    .attr("transform", function(d) {
                        var longLat = d[0].split(":");
                        return "translate(" + projection([parseFloat(longLat[0]), parseFloat(longLat[1]), ]) + ")";
                    });

            });

        });


    })();

    //finally, add delegated event listeners

    (function() {

       

        var svgs = d3.selectAll("svg");

        svgs.each(function(svg) {
            this.addEventListener("click", function(e) {

                if (e.target.tagName !== "circle") {
                    return
                }

                var d = e.target.__data__;

                 var baseLink = "http://ui.adslabs.org/#search/q="
                _.each(d[1]["people"], function(item, index) {
                    d[1]["people"][index] = encodeURIComponent(d[1]["people"][index]);
                });
                var bibs = d[1]["bibcodes"].join("+OR+");

                window.location.href = baseLink + "bibcode%3A(" + bibs + ")";

            });
        });

        svgs.each(function(svg) {
            this.addEventListener("mouseover", function(e) {

                if (e.target.tagName !== "circle") {
                    return
                }

                var d = e.target.__data__;

                var d3description = d3.select(this.parentElement.parentElement.querySelector(".description div"));

                var html = "<h3>" + d[1]["institution"] + " (" + _.uniq(d[1]["people"]).length + ")</h3>"
                html += "<ul class='list-unstyled'>"
                var sortedPeople = _.uniq(d[1]["people"]).sort();
                _.each(sortedPeople, function(p) {

                    html += "<li>" + p + "</li>"
                })

                html += "</ul>"
                d3description.html(html);

                if (debug) {
                    console.log(d);
                }
            });

        });

    })();
