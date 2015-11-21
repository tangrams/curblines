# curblines (an experiment)

### whazzis?

**Curblines** are the edges where the curb (or _kerb_, for English speakers outside of North America) marks the boundary between the sidewalk and the roadway.

This is an experimental demo created during Mapzen's staff conference in November 2015. It shows [Philadelphia curb edges](https://www.opendataphilly.org/dataset/curb-edges) which have been converted into GeoJSON, filtered, and rendered as new layers with the [Tangram Refill style](https://github.com/tangrams/refill-style/) as the base. More details below.

@louh pitched the project, @irees munged data, @bcamper and @meetar set up the Tangram scene file, and additional domain knowledge, brainstorming, and moral support was provided by @sensescape, @nvkelso, @rmarianski, @dnesbitt61, @drewda, and @mjcunningham.


### why?

On maps, streets are usually represented by _street centerlines_. At lower (farther) zoom levels these lines are useful and provide an overview of the connectivity and hierarchy of a network. These lines are also an appropriate syntax for optimizing the transportation of people and objects across physical space using the fewest number of the highest-bandwidth vertices available, but become visually awkward at higher (closer) zoom levels, especially in urban settings where understanding the volume of [the space between buildings](https://medium.com/@saikofish/the-space-between) and the objects within it (like trees and benches) is better suited for tasks such as local wayfinding as opposed to traversal across the network.

General-purpose slippy maps have not yet overcome this problem of scale. This is a data quality and coverage problem where only large or well-funded cities may even collect this data, formats are unstandardized, and data may not be easily obtainable or published under an open license. It's also reasonable to assume that the return on investment is very low for most commercial map providers to clean up and incorporate this data at all. But one small step we can take to improve digital maps at the human scale is to start representing streets at higher zooms with curblines instead, and for the large cities that have this data, it can make a remarkable difference in map quality. One common "satisficing" solution would be to expand the stroke width of centerlines as the zoom increases, using its hierarchy in the road network to approximate actual width, but this feels strange, especially when tertiary streets are really narrower than their representation might imply.

### the data

U.S. cities with known curb line data include [Chicago](https://data.cityofchicago.org/Transportation/Boundaries-Curb-Lines/5gv8-ktcg), [Pittsburgh](http://pittsburghpa.gov/dcp/gis/gis-data-new), [Philadelphia](http://www.pasda.psu.edu/uci/MetadataDisplay.aspx?entry=PASDA&file=PhiladelphiaCurbEdges201201.xml&dataset=169), [San Francisco](https://data.sfgov.org/Geographic-Locations-and-Boundaries/City-curbs-and-islands-Zipped-Shapefile-Format-/nvxg-zay4?), [Washington, D.C.](http://opendata.dc.gov/datasets/e8299c86b4014f109fedd7e95ae20d52_61) and New York City, at varying degrees of openness.

An interesting aspect of [Japan's addressing system](https://en.wikipedia.org/wiki/Japanese_addressing_system), in which many streets do not have names and addresses are something like "In Tokyo's ward X, neighborhood 1, block number 2, look for building number 3" this reliance on block structure means that [curb line data coverage is extremely good](https://www.google.com/maps/place/Tokyo,+Japan/@35.6767626,139.7782514,18.21z/data=!4m2!3m1!1s0x605d1b87f02e57e7:0x2e01618b22571b89) even in smaller towns. This appears to be the same in South Korea perhaps because they also have relied on a similar addressing scheme [until recently](https://en.wikipedia.org/wiki/Addresses_in_South_Korea).

## in depth stuff

Philadelphia curb edges were chosen only because of @louh's familiarity with the data set, and not for any other technically significant reason. There are a couple of ways to get this data:

- from [PASDA (Pennsylvania Spatial Data Access)](http://www.pasda.psu.edu/uci/MetadataDisplay.aspx?entry=PASDA&file=PhiladelphiaCurbEdges201201.xml&dataset=169)
- from [OpenDataPhilly](https://www.opendataphilly.org/dataset/curb-edges)

The latter data source was chosen (?), specifically, the ["Curbs with Cartways Shapefile"](https://www.opendataphilly.org/dataset/curb-edges/resource/bbe7baf4-a116-469d-86cd-d124838023fb?inner_span=True) -- the GeoJSON downloads appeared to be broken. We used [ogr2ogr](http://www.gdal.org/ogr2ogr.html) to convert the shapefile to a GeoJSON format.

Next we made a copy of the [Tangram Refill style](https://github.com/tangrams/refill-style/) and added the new curb-edge GeoJSON as a second data source:

```yaml
sources:
    curbs:
        type: GeoJSON
        url: Curbs.geojson
```

We rendered this data source as a layer with a thick red line for each feature just to make it show up obviously:

```yaml
curbs:
    data: { source: curbs }
    draw:
        lines:
            color: 'red'
            order: 40
            width: 10px
            interactive: true
```

This actually worked remarkably well, and even for a dataset of about 25k features it rendered in a reasonable amount of time (on a powerful Macbook Pro).

It appeared that each polygon was getting drawn twice. By setting `interactive: true` as we did above it allowed us to look at each polygon's properties to see what might be a reason for this duplication. It turns out that the dataset contained shapes for both the pavement area as well as blocks, so we must filter on each object's `FCODE` property:

```yaml
curbs:
    data: { source: curbs }
    filter:
        FCODE: 9999
    draw:
        lines:
            color: 'red'
            order: 40
            width: 10px
            interactive: true
```

We determine that `FCODE` of `9999` is an "interior non-street polygon" and that `1000` is "drivable pavement." However we also discover later that other `FCODE`s exist for things like medians. For future reference here is a list of all the `FCODE`s and what we know about them:

FCODE            | What is it
---------------- | ----------------------------------------------------------
0                | ???
1000             | "Drivable pavement," aka streets
1001             | Decreed to be hidden, but for unknown reasons
1010             | Concrete island on state route
1011             | Concrete island on fam route (?)
1012             | Concrete island on city street
1020             | Shoulder on state route
1021             | Shoulder on fam route (?)
1022             | Shoulder on city street
1030             | Grass island on state route, aka park or planted strip
1031             | Grass island on fam route (?), aka park or planted strip
1032             | Grass island on city street, aka park or planted strip
8888             | ???
9999             | "Interior non-street polygon," aka blocks

Some of this information was gleaned from [the metadata](https://www.opendataphilly.org/dataset/curb-edges/resource/099b7cb5-049b-4f18-abbe-f0a5af792992?inner_span=True). We also notice that there are properties for elevation which can be useful for visualization but we have not taken advantage of this property yet.

The strategy of filtering on `FCODE` in the scene file itself is a useful one, but the GeoJSON is about 138MB in size, so it cannot be committed to GitHub, and it would be infeasible to download it in its entirety anyway. @irees created [a Python script to split GeoJSON features on a given key and write them to separate files](https://gist.github.com/irees/1d23a13aae1d1a5937f2). This allowed us to have a GeoJSON of just the blocks (`FCODE: 9999`), but because we also observed that this was missing things like median islands, we also added other GeoJSON files back as additional data sources:

```yaml
sources:
    block:
        type: GeoJSON
        url: //tangrams.github.io/curblines/block.geojson
    concrete:
        type: GeoJSON
        url: //tangrams.github.io/curblines/concrete.geojson
    grass:
        type: GeoJSON
        url: //tangrams.github.io/curblines/grass.geojson
    shoulder:
        type: GeoJSON
        url: //tangrams.github.io/curblines/shoulder.geojson
```

Finally we also did a little more styling work. Polygons were also given a drawn to provide a fill color and extruded slightly to give the impression of a raised curb edge. A light, which was not part of the default Refill style, was also added so that curved edges display a shadow. Road lines were toggled off.

### next?

We did a small simple thing as a proof of concept but much more can be done. For this demonstration itself we can further optimize the GeoJSON data source so that it can be downloaded and rendered quickly on less powerful devices such as mobile phones.

Perhaps there can be an optimal "standard" for storing information about curb lines so that a variety of data sources from different cities can be ingested into the [vector tile service](https://github.com/mapzen/vector-datasource). We will also need to determine what is the appropriate zoom level at which street centerlines switch to curb lines when available and how to represent them for different styles.

