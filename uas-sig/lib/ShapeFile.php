<?php
/**
 * ShapeFile.php — PHP Pure Shapefile Reader (tanpa GDAL)
 * Mendukung: Point, Polygon, MultiPolygon, Polyline
 * 
 * Digunakan untuk membaca file .shp + .dbf dan menghasilkan WKT geometry
 * yang bisa langsung dimasukkan ke PostGIS menggunakan ST_GeomFromText()
 */

class ShapeFileReader
{
    // Shape type constants
    const NULL_SHAPE    = 0;
    const POINT         = 1;
    const POLYLINE      = 3;
    const POLYGON       = 5;
    const MULTIPOINT    = 8;
    const POINTZ        = 11;
    const POLYLINEZ     = 13;
    const POLYGONZ      = 15;
    const MULTIPOINTZ   = 18;
    const POINTM        = 21;
    const POLYLINEM     = 23;
    const POLYGONM      = 25;
    const MULTIPOINTM   = 28;
    const MULTIPATCH    = 31;

    private $shp_path;
    private $dbf_path;

    public function __construct(?string $shp_path, ?string $dbf_path)
    {
        $this->shp_path = $shp_path;
        $this->dbf_path = $dbf_path;
    }

    public function read(): array
    {
        $shp_data  = $this->readSHP();
        $dbf_data  = $this->readDBF();
        $records   = [];

        $count = min(count($shp_data), count($dbf_data));
        for ($i = 0; $i < $count; $i++) {
            $records[] = [
                'geometry_wkt' => $shp_data[$i] ?? null,
                'attributes'   => $dbf_data[$i] ?? [],
            ];
        }

        // If counts differ, include remaining records
        if (count($shp_data) > count($dbf_data)) {
            for ($i = $count; $i < count($shp_data); $i++) {
                $records[] = ['geometry_wkt' => $shp_data[$i], 'attributes' => []];
            }
        } elseif (count($dbf_data) > count($shp_data)) {
            for ($i = $count; $i < count($dbf_data); $i++) {
                $records[] = ['geometry_wkt' => null, 'attributes' => $dbf_data[$i]];
            }
        }

        return $records;
    }

    // =====================================================
    // SHP READER
    // =====================================================
    private function readSHP(): array
    {
        if (!$this->shp_path || !file_exists($this->shp_path)) return [];
        $fp = fopen($this->shp_path, 'rb');
        if (!$fp) throw new RuntimeException("Tidak bisa membuka file .shp: {$this->shp_path}");

        // Read file header (100 bytes)
        $header = fread($fp, 100);
        $file_code = unpack('N', substr($header, 0, 4))[1];
        if ($file_code !== 9994) throw new RuntimeException("File bukan Shapefile valid (file code: $file_code)");

        $shape_type = unpack('V', substr($header, 32, 4))[1];
        $geometries = [];

        while (!feof($fp)) {
            // Record header: 8 bytes (record num + content length)
            $rec_header = fread($fp, 8);
            if (strlen($rec_header) < 8) break;

            $content_length = unpack('N', substr($rec_header, 4, 4))[1] * 2; // in bytes
            if ($content_length <= 0) break;

            $content = fread($fp, $content_length);
            if (strlen($content) < 4) break;

            $rec_shape_type = unpack('V', substr($content, 0, 4))[1];
            $wkt = null;

            switch ($rec_shape_type) {
                case self::POINT:
                case self::POINTZ:
                case self::POINTM:
                    $wkt = $this->parsePoint($content);
                    break;
                case self::POLYGON:
                case self::POLYGONZ:
                case self::POLYGONM:
                    $wkt = $this->parsePolygon($content);
                    break;
                case self::POLYLINE:
                case self::POLYLINEZ:
                case self::POLYLINEM:
                    $wkt = $this->parsePolyline($content);
                    break;
                case self::NULL_SHAPE:
                    $wkt = null;
                    break;
            }

            $geometries[] = $wkt;
        }

        fclose($fp);
        return $geometries;
    }

    private function parsePoint(string $data): ?string
    {
        if (strlen($data) < 20) return null;
        $x = unpack('d', substr($data, 4, 8))[1];
        $y = unpack('d', substr($data, 12, 8))[1];
        return "POINT($x $y)";
    }

    private function parsePolygon(string $data): ?string
    {
        if (strlen($data) < 44) return null;
        $num_parts  = unpack('V', substr($data, 36, 4))[1];
        $num_points = unpack('V', substr($data, 40, 4))[1];

        if ($num_parts === 0 || $num_points === 0) return null;

        $offset = 44;
        $parts  = [];
        for ($i = 0; $i < $num_parts; $i++) {
            $parts[] = unpack('V', substr($data, $offset, 4))[1];
            $offset += 4;
        }

        $points = [];
        for ($i = 0; $i < $num_points; $i++) {
            $x = unpack('d', substr($data, $offset, 8))[1];
            $y = unpack('d', substr($data, $offset + 8, 8))[1];
            $points[] = [$x, $y];
            $offset += 16;
        }

        $rings = [];
        for ($i = 0; $i < $num_parts; $i++) {
            $start = $parts[$i];
            $end   = ($i + 1 < $num_parts) ? $parts[$i + 1] : $num_points;
            $ring_pts = array_slice($points, $start, $end - $start);

            if (count($ring_pts) < 3) continue;

            // Tutup ring jika belum tertutup
            if ($ring_pts[0] !== end($ring_pts)) {
                $ring_pts[] = $ring_pts[0];
            }

            $coords   = implode(', ', array_map(fn($p) => "{$p[0]} {$p[1]}", $ring_pts));
            $rings[]  = "($coords)";
        }

        if (empty($rings)) return null;

        if ($num_parts === 1) {
            return "POLYGON(" . $rings[0] . ")";
        } else {
            return "MULTIPOLYGON((" . implode(', ', $rings) . "))";
        }
    }

    private function parsePolyline(string $data): ?string
    {
        if (strlen($data) < 44) return null;
        $num_parts  = unpack('V', substr($data, 36, 4))[1];
        $num_points = unpack('V', substr($data, 40, 4))[1];

        if ($num_parts === 0 || $num_points === 0) return null;

        $offset = 44;
        $parts  = [];
        for ($i = 0; $i < $num_parts; $i++) {
            $parts[] = unpack('V', substr($data, $offset, 4))[1];
            $offset += 4;
        }

        $points = [];
        for ($i = 0; $i < $num_points; $i++) {
            $x = unpack('d', substr($data, $offset, 8))[1];
            $y = unpack('d', substr($data, $offset + 8, 8))[1];
            $points[] = [$x, $y];
            $offset += 16;
        }

        $lines = [];
        for ($i = 0; $i < $num_parts; $i++) {
            $start    = $parts[$i];
            $end      = ($i + 1 < $num_parts) ? $parts[$i + 1] : $num_points;
            $line_pts = array_slice($points, $start, $end - $start);
            if (count($line_pts) < 2) continue;
            $coords   = implode(', ', array_map(fn($p) => "{$p[0]} {$p[1]}", $line_pts));
            $lines[]  = "($coords)";
        }

        if (empty($lines)) return null;

        if (count($lines) === 1) {
            return "LINESTRING" . str_replace(['(', ')'], ['(', ')'], $lines[0]);
        } else {
            return "MULTILINESTRING(" . implode(', ', $lines) . ")";
        }
    }

    // =====================================================
    // DBF READER (dBASE III+)
    // =====================================================
    private function readDBF(): array
    {
        if (!$this->dbf_path || !file_exists($this->dbf_path)) return [];
        $fp = fopen($this->dbf_path, 'rb');
        if (!$fp) throw new RuntimeException("Tidak bisa membuka file .dbf: {$this->dbf_path}");

        // DBF Header: 32 bytes
        $header    = fread($fp, 32);
        $num_rec   = unpack('V', substr($header, 4, 4))[1];
        $hdr_size  = unpack('v', substr($header, 8, 2))[1];
        $rec_size  = unpack('v', substr($header, 10, 2))[1];

        // Field descriptors: tiap 32 bytes, sampai terminator 0x0D
        $fields    = [];
        $fields_len = $hdr_size - 32;
        $fields_data = fread($fp, $fields_len);

        $pos = 0;
        while ($pos < strlen($fields_data)) {
            if (ord($fields_data[$pos]) === 0x0D) break;
            if ($pos + 32 > strlen($fields_data)) break;

            $field_desc = substr($fields_data, $pos, 32);
            $name = rtrim(substr($field_desc, 0, 11), "\x00");
            $type = $field_desc[11];
            $length = ord($field_desc[16]);
            $decimal = ord($field_desc[17]);

            if ($name) {
                $fields[] = ['name' => $name, 'type' => $type, 'length' => $length, 'decimal' => $decimal];
            }
            $pos += 32;
        }

        // Baca records
        $records = [];
        for ($i = 0; $i < $num_rec; $i++) {
            $raw = fread($fp, $rec_size);
            if (strlen($raw) < $rec_size) break;

            // Byte pertama: 0x20 = valid, 0x2A = deleted
            if (ord($raw[0]) === 0x2A) { $records[] = []; continue; }

            $rec = [];
            $offset = 1; // Skip deletion flag
            foreach ($fields as $field) {
                $value = substr($raw, $offset, $field['length']);
                $value = rtrim($value);

                // Konversi encoding (Windows-1252 → UTF-8)
                if (function_exists('mb_convert_encoding')) {
                    $value = mb_convert_encoding($value, 'UTF-8', 'Windows-1252');
                }

                $rec[$field['name']] = $value;
                $offset += $field['length'];
            }
            $records[] = $rec;
        }

        fclose($fp);
        return $records;
    }
}
