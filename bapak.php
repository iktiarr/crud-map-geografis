
<!DOCTYPE html>
<html lang="en">
<head>
	<base target="_top">
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	
  <title>Contoh Query POSTGIS menggunakan Leaflet</title>
	
	<link rel="shortcut icon" type="image/x-icon" href="docs/images/favicon.ico" />

    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.2/dist/leaflet.css" integrity="sha256-sA+zWATbFveLLNqWO2gtiw3HL/lh1giY/Inf1BJ0z14=" crossorigin=""/>
    <script src="https://unpkg.com/leaflet@1.9.2/dist/leaflet.js" integrity="sha256-o9N1jGDZrf5tS+Ft4gbIK7mYMipq9lqpVJ91xHSyKhg=" crossorigin=""></script>

	<style>
		html, body {
			height: 100%;
			margin: 0;
		}
		/*.leaflet-container {
			height: 400px;
			width: 600px;
			max-width: 100%;
			max-height: 100%;
		}*/

		.float-container {
			width: 1250px;
		    border: 3px solid #fff;
		    padding: 20px;
		}

		.float-child {
		    width: 603px;
		    float: left;
		    padding: 5px;
		    margin : 5px;
		    border: 1px solid red;
		}  
	</style>

	
</head>
<body>
<div class="float-container">
<H3 align="center">MENAMPILKAN SARANA PENDIDIKAN (SEKOLAH) PADA WILAYAH A</H3>

  <div class="float-child">
    <div id="map" style="width: 600px; height: 400px;"></div>
  </div>
  
  <div class="float-child">
    <div id="map2" style="width: 600px; height: 400px;"></div>
  </div>
  
</div>
<div class="float-container">
  <div class="float-child">
    SELECT nama, geom FROM public.lokasi2 WHERE nama like 'marker%'<br><br>
    SELECT geom FROM public.lokasi2 WHERE nama='area 1' <br><br> 
    SELECT geom FROM public.lokasi2 WHERE nama='area 2'
  </div>
  
  <div class="float-child">
    .
  </div>
</div>


<script>

	const map = L.map('map').setView([-7.8,112],8);

	const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
		maxZoom: 19,
		attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
	}).addTo(map);

	const map2 = L.map('map2').setView([-7.8,112],8);

	const tiles2 = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
		maxZoom: 19,
		attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
	}).addTo(map2);

<?php

function escapeJsonString($value) { # list from www.json.org: (\b backspace, \f formfeed)
  $escapers = array("\\", "/", "\"", "\n", "\r", "\t", "\x08", "\x0c");
  $replacements = array("\\\\", "\\/", "\\\"", "\\n", "\\r", "\\t", "\\f", "\\b");
  $result = str_replace($escapers, $replacements, $value);
  return $result;
}


# Connect to PostgreSQL database
$conn = pg_connect("dbname=kuliah13 user=postgres password=ayib host=localhost port=5433");
if (!$conn) {
    echo "Not connected : " . pg_error();
    exit;
}


$q = "
        SELECT json_build_object(
            'type','FeatureCollection',
            'features', json_agg(
                json_build_object(
                    'type','Feature',
                    'geometry', ST_AsGeoJSON(geom)::json,
                    'properties', json_build_object(
                        'id', id,
                        'nama', nama
                    )
                )
            )
        ) as geojson
        FROM public.lokasi2";

        $r = pg_query($conn,$q);
echo 'var peta1 = '.pg_fetch_assoc($r)['geojson'].'

';



// =============================

// $fields = 'nama';
// $geomfield = 'geom';
// $geotable = 'public.lokasi2';
//$tambahan = " WHERE nama like 'marker%'";



$sql2 = "
SELECT nama, st_asgeojson(y.geom) as geojson
    FROM (SELECT * FROM public.lokasi2 WHERE nama like 'marker%') y
    JOIN (SELECT geom from public.lokasi2 WHERE nama='area 1') x
    ON ST_Intersects(x.geom, y.geom)

union

SELECT nama, st_asgeojson(geom) as geojson FROM public.lokasi2 
where nama like 'area%'
";


$rs2 = pg_query($conn, $sql2);
if (!$rs2) {
    echo "An SQL error occured.\n";
    exit;
}


# Build GeoJSON
$output2    = '';
$rowOutput2 = '';


while ($row2 = pg_fetch_assoc($rs2)) {
	// $myrow = str_replace(',0]', ']', $row['geojson']);
	$myrow2 = $row2['geojson'];
    $rowOutput2 = (strlen($rowOutput2) > 0 ? ',' : '') . '{"type": "Feature", "geometry": ' . $myrow2 . ', "properties": {';
    $props2 = '';
    $id2    = '';
    foreach ($row2 as $key2 => $val2) {
        if ($key2 != "geojson") {
            $props2 .= (strlen($props2) > 0 ? ',' : '') . '"' . $key2 . '":"' . escapeJsonString($val2) . '"';
        }
        if ($key2 == "id") {
            $id2 .= ',"id":"' . escapeJsonString($val2) . '"';
        }
    }
    
    $rowOutput2 .= $props2 . '}';
    $rowOutput2 .= $id2;
    $rowOutput2 .= '}';
    $output2 .= $rowOutput2;
}

$output2 = 'var peta2 = { "type": "FeatureCollection", "features": [ ' . $output2 . ' ]}';
echo $output2;

?>


L.geoJSON(peta1).addTo(map);
L.geoJSON(peta2).addTo(map2);

</script>

<?php //echo $sql2.'<br>'.$output2; ?>

</body>
</html>