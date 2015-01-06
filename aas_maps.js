    var debug = true;

    var width = 1000;
    height = 500;


  //  build usa map
    (function(){

    var projection = d3.geo.albersUsa();

    var path = d3.geo.path(projection);

    var svg = d3.select(".usa svg").attr("height", height).attr("width", width);

    d3.json("us_states.json", function(error, json){

        svg.selectAll("path")
               .data(json.features)
               .enter()
               .append("path")
               .attr("d", path);

    d3.json("aas_people.json", function(error, json){
       var json =  _.pairs(json);

       var lengths = _.map(json, function(j){
        return j[1].people.length
       });

       var radiusScale = d3.scale.sqrt().domain([d3.min(lengths), d3.max(lengths)]).range([1, 20]);

       var d3description = d3.select(".usa .description");

       //sort data
       json.sort(function(a,b){
        return b[1].people.length - a[1].people.length;
       });
      //filter to us only
       json = json.filter(function(j){
          var longLat = j[0].split(":");
          var p = projection([parseFloat(longLat[0]), parseFloat(longLat[1]),])
        if (p){
          return true
        }
       });

        svg.selectAll("circle")
            .data(json)
            .enter()
            .append("circle")
            .classed("institution-circle", true)
            .attr("r", function(d){
                return radiusScale(d[1].people.length);
            })
            .attr("fill", "hsla(232, 100%, 65%, 0.81)")
            .attr("transform", function(d) {
                var longLat = d[0].split(":");
                return "translate(" + projection([parseFloat(longLat[0]), parseFloat(longLat[1]),]) + ")";
            });

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

        d3.json("simplified_world.json", function(error, world) {

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

            d3.json("aas_people.json", function(error, json) {
                var json = _.pairs(json);

                var lengths = _.map(json, function(j) {
                    return j[1].people.length
                });

                var radiusScale = d3.scale.sqrt().domain([d3.min(lengths), d3.max(lengths)]).range([1, 20]);

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
                    .attr("fill", "hsla(232, 100%, 65%, 0.81)")
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

              debugger;

                if (e.target.tagName !== "circle") {
                    return
                }

                var d = e.target.__data__;

                var baseLink = "http://ui.adslabs.org/#search/q=bibcode%3A2015AAS...225**"
                _.each(d[1]["people"], function(item, index) {
                    d[1]["people"][index] = encodeURIComponent(d[1]["people"]);
                });
                var authors = "%22" + d[1]["people"].join("%2C+OR+%2C") + "%22";

                window.location.href = baseLink + "+AND+author%3A(" + authors + ")";

            });
        });

        svgs.each(function(svg) {
            this.addEventListener("mouseover", function(e) {

                if (e.target.tagName !== "circle") {
                    return
                }

                var d = e.target.__data__;

                var d3description = d3.select(this.parentElement.parentElement.querySelector(".description"));

                var html = "<h3>" + d[1]["institution"] + " (" + _.uniq(d[1]["people"]).length + ")</h3>"
                html += "<ul class='list-unstyled'>"
                var sortedPeople = _.uniq(d[1]["people"]).sort();
                _.each(sortedPeople, function(p) {

                    html += "<li>" + p + "</li>"
                })

                html += "</ul>"
                d3description.html(html);

                if (debug){
                  console.log(d);
                }
            });

        });

    })();
