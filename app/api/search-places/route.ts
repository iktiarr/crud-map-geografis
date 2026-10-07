import { NextResponse } from "next/server";

// Haversine formula to calculate accurate distance between two points in km
function calculateHaversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

interface PlaceResult {
  id: string;
  name: string;
  lat: number;
  lng: number;
  zoom: number;
  category: string;
  description: string;
  source: "local" | "nominatim" | "photon" | "openmeteo" | "overpass";
  distanceKm?: number;
  score?: number;
}

// Indonesian Slang, Abbreviations, Common Typos, & Global Multilingual Translations
const ABBREVIATIONS_MAP: Record<string, string> = {
  // Indonesian Slang & Local Abbreviations
  "alun2": "alun-alun",
  "alun 2": "alun-alun",
  "alunalun": "alun-alun",
  "jl": "jalan",
  "jl.": "jalan",
  "jln": "jalan",
  "bunderan": "bundaran",
  "ngalam": "malang",
  "mlg": "malang",
  "sby": "surabaya",
  "jkt": "jakarta",
  "bdg": "bandung",
  "jogja": "yogyakarta",
  "yogya": "yogyakarta",
  "smg": "semarang",
  "mks": "makassar",
  "denpasar": "denpasar bali",
  "sda": "sidoarjo",
  "tgr": "tangerang",
  "bks": "bekasi",
  "bogor": "bogor jawa barat",
  "depok": "depok jawa barat",
  "dpr": "gedung dpr mpr ri jakarta",
  "mpr": "gedung dpr mpr ri jakarta",
  "monas": "monumen nasional monas jakarta",
  "gbk": "gelora bung karno senayan jakarta",
  "jis": "jakarta international stadium",
  "gbt": "gelora bung tomo surabaya",
  "spbu": "spbu pertamina",
  "pom bensin": "spbu",
  "rs": "rumah sakit",
  "rsud": "rumah sakit",
  "rsu": "rumah sakit",
  "univ": "universitas",
  "kampus": "universitas",
  "kafe": "cafe",
  "warkop": "warung kopi",
  "kopi": "coffee",
  "indomaret": "indomaret",
  "alfamart": "alfamart",
  "alfa": "alfamart",
  "baso": "bakso",

  // Indonesian Universities
  "ui": "universitas indonesia depok",
  "itb": "institut teknologi bandung",
  "ugm": "universitas gadjah mada yogyakarta",
  "its": "institut teknologi sepuluh nopember surabaya",
  "unair": "universitas airlangga surabaya",
  "ub": "universitas brawijaya malang",
  "um": "universitas negeri malang",
  "undip": "universitas diponegoro semarang",
  "unpad": "universitas padjadjaran bandung",
  "ipb": "ipb university bogor",
  "unhas": "universitas hasanuddin makassar",
  "uns": "universitas sebelas maret surakarta solo",
  "utm": "universitas trunojoyo madura bangkalan",
  "unesa": "universitas negeri surabaya",
  "uin jakarta": "uin syarif hidayatullah jakarta",
  "uin malang": "uin maulana malik ibrahim malang",
  "uin surabaya": "uin sunan ampel surabaya",
  "uin jogja": "uin sunan kalijaga yogyakarta",

  // Benua & Kawasan Dunia (Continents & Regions)
  "eropa": "europe",
  "asia tenggara": "southeast asia",
  "timur tengah": "middle east",
  "amerika utara": "north america",
  "amerika selatan": "south america",
  "amerika latin": "latin america",
  "afrika": "africa",
  "antartika": "antarctica",
  "kutub utara": "north pole arctic",
  "kutub selatan": "south pole antarctica",

  // Negara-Negara Asia (Asian Countries)
  "jepang": "japan",
  "korsel": "south korea",
  "korea selatan": "south korea",
  "korea utara": "north korea",
  "tiongkok": "china",
  "cina": "china",
  "singapura": "singapore",
  "singapore": "singapore",
  "malaysia": "malaysia",
  "thailand": "thailand",
  "filipina": "philippines",
  "vietnam": "vietnam",
  "kamboja": "cambodia",
  "laos": "laos",
  "myanmar": "myanmar",
  "brunei": "brunei darussalam",
  "timor leste": "timor leste",
  "taiwan": "taiwan",
  "hong kong": "hong kong",
  "hongkong": "hong kong",
  "makau": "macau",
  "india": "india",
  "pakistan": "pakistan",
  "bangladesh": "bangladesh",
  "sri lanka": "sri lanka",
  "maladewa": "maldives",
  "nepal": "nepal",
  "arab saudi": "saudi arabia",
  "uni emirat arab": "united arab emirates",
  "uea": "united arab emirates",
  "qatar": "qatar",
  "kuwait": "kuwait",
  "bahrain": "bahrain",
  "oman": "oman",
  "yaman": "yemen",
  "yordania": "jordan",
  "lebanon": "lebanon",
  "palestina": "palestine",
  "israel": "israel",
  "iran": "iran",
  "irak": "iraq",
  "turki": "turkey",
  "kazakhstan": "kazakhstan",
  "uzbekistan": "uzbekistan",

  // Negara-Negara Eropa (European Countries)
  "inggris": "united kingdom",
  "britania raya": "united kingdom",
  "uk": "united kingdom",
  "perancis": "france",
  "prancis": "france",
  "jerman": "germany",
  "belanda": "netherlands",
  "italia": "italy",
  "spanyol": "spain",
  "portugal": "portugal",
  "swiss": "switzerland",
  "swedia": "sweden",
  "norwegia": "norway",
  "finlandia": "finland",
  "denmark": "denmark",
  "belgia": "belgium",
  "austria": "austria",
  "yunani": "greece",
  "polandia": "poland",
  "ceko": "czech republic",
  "hungaria": "hungary",
  "kroasia": "croatia",
  "islandia": "iceland",
  "irlandia": "ireland",
  "skotlandia": "scotland",
  "rusia": "russia",
  "ukraina": "ukraine",
  "rumania": "romania",
  "bulgaria": "bulgaria",
  "vatikan": "vatican city",

  // Negara-Negara Amerika (American Countries)
  "amerika": "united states",
  "amerika serikat": "united states",
  "as": "united states",
  "usa": "united states",
  "kanada": "canada",
  "meksiko": "mexico",
  "brasil": "brazil",
  "brazil": "brazil",
  "argentina": "argentina",
  "chili": "chile",
  "kolombia": "colombia",
  "peru": "peru",
  "kuba": "cuba",
  "jamaika": "jamaica",
  "venezuela": "venezuela",
  "ekuador": "ecuador",
  "uruguay": "uruguay",
  "paraguay": "paraguay",
  "bolivia": "bolivia",

  // Negara-Negara Afrika & Oseania
  "mesir": "egypt",
  "maroko": "morocco",
  "afrika selatan": "south africa",
  "nigeria": "nigeria",
  "kenya": "kenya",
  "ethiopia": "ethiopia",
  "aljazair": "algeria",
  "tunisia": "tunisia",
  "madagaskar": "madagascar",
  "tanzania": "tanzania",
  "ghana": "ghana",
  "australia": "australia",
  "selandia baru": "new zealand",
  "fiji": "fiji",
  "papua nugini": "papua new guinea",

  // Keajaiban Dunia & Landmark Terkenal (World Wonders & Landmarks)
  "mekkah": "mecca saudi arabia",
  "madinah": "medina saudi arabia",
  "kabah": "kaaba masjidil haram mecca",
  "kakbah": "kaaba masjidil haram mecca",
  "masjidil haram": "masjid al haram mecca",
  "masjid nabawi": "al masjid an nabawi medina",
  "masjid al aqsa": "al aqsa mosque jerusalem",
  "menara eiffel": "eiffel tower paris france",
  "patung liberty": "statue of liberty new york",
  "tembok besar cina": "great wall of china beijing",
  "tembok besar": "great wall of china",
  "taj mahal": "taj mahal agra india",
  "colosseum": "colosseum rome italy",
  "koloseum": "colosseum rome italy",
  "menara pisa": "leaning tower of pisa italy",
  "burj khalifa": "burj khalifa dubai",
  "burj al arab": "burj al arab dubai",
  "piramida giza": "pyramids of giza cairo egypt",
  "sphinx": "great sphinx of giza cairo egypt",
  "gunung fuji": "mount fuji japan",
  "fujisan": "mount fuji japan",
  "gunung everest": "mount everest himalayas nepal",
  "machu picchu": "machu picchu cusco peru",
  "petra": "petra jordan",
  "chichen itza": "chichen itza yucatan mexico",
  "patung kristus penebus": "christ the redeemer rio de janeiro",
  "cristo redentor": "christ the redeemer rio de janeiro",
  "big ben": "big ben westminster london",
  "london eye": "london eye london uk",
  "tower bridge": "tower bridge london uk",
  "museum louvre": "louvre museum paris",
  "notre dame": "notre dame cathedral paris",
  "sagrada familia": "basilica de la sagrada familia barcelona",
  "hagia sophia": "hagia sophia istanbul turkey",
  "blue mosque": "sultan ahmed mosque istanbul turkey",
  "kremlin": "moscow kremlin russia",
  "lapangan merah": "red square moscow russia",
  "gedung putih": "the white house washington dc",
  "white house": "the white house washington dc",
  "gedung capitol": "united states capitol washington dc",
  "empire state building": "empire state building new york",
  "times square": "times square new york",
  "central park": "central park new york",
  "jembatan golden gate": "golden gate bridge san francisco",
  "hollywood": "hollywood sign los angeles",
  "disneyland": "disneyland park anaheim california",
  "disney world": "walt disney world resort orlando florida",
  "universal studios": "universal studios hollywood los angeles",
  "sydney opera house": "sydney opera house australia",
  "air terjun niagara": "niagara falls ontario canada",
  "grand canyon": "grand canyon national park arizona",
  "air terjun iguazu": "iguazu falls argentina brazil",
  "air terjun victoria": "victoria falls zambia zimbabwe",
  "laut mati": "dead sea jordan israel",
  "great barrier reef": "great barrier reef queensland australia",
  "danau toba": "lake toba north sumatra indonesia",
  "gunung bromo": "mount bromo east java indonesia",
  "candi borobudur": "borobudur temple magelang indonesia",
  "candi prambanan": "prambanan temple yogyakarta indonesia",
  "raja ampat": "raja ampat islands west papua",
  "labuan bajo": "labuan bajo flores indonesia",
  "pulau komodo": "komodo national park flores indonesia",
  "kuta bali": "kuta beach bali indonesia",

  // Universitas Top Dunia
  "harvard": "harvard university cambridge massachusetts",
  "mit": "massachusetts institute of technology cambridge",
  "stanford": "stanford university california",
  "oxford": "university of oxford england",
  "cambridge": "university of cambridge england",
  "yale": "yale university new haven connecticut",
  "princeton": "princeton university new jersey",
  "columbia": "columbia university new york",
  "berkeley": "uc berkeley california",
  "nus": "national university of singapore",
  "ntu": "nanyang technological university singapore",
  "tokyo univ": "the university of tokyo japan",
  "tsinghua": "tsinghua university beijing china",
  "peking univ": "peking university beijing china",

  // Bandara Internasional Utama (Airports)
  "cgk": "soekarno hatta international airport jakarta",
  "sub": "juanda international airport surabaya",
  "dps": "ngurah rai international airport bali",
  "kno": "kualanamu international airport medan",
  "sin": "singapore changi airport",
  "kul": "kuala lumpur international airport",
  "bkk": "suvarnabhumi airport bangkok",
  "hnd": "tokyo haneda airport japan",
  "nrt": "narita international airport japan",
  "icn": "incheon international airport seoul south korea",
  "dxb": "dubai international airport uae",
  "doh": "hamad international airport doha qatar",
  "ist": "istanbul airport turkey",
  "lhr": "london heathrow airport uk",
  "cdg": "charles de gaulle airport paris france",
  "ams": "amsterdam airport schiphol netherlands",
  "fra": "frankfurt airport germany",
  "jfk": "john f kennedy international airport new york",
  "lax": "los angeles international airport california",
  "sfo": "san francisco international airport california",
  "syd": "sydney airport australia",

  // Stadion Sepakbola & Olahraga Dunia
  "camp nou": "spotify camp nou barcelona spain",
  "santiago bernabeu": "estadio santiago bernabeu madrid spain",
  "bernabeu": "estadio santiago bernabeu madrid spain",
  "wembley": "wembley stadium london uk",
  "old trafford": "old trafford manchester uk",
  "anfield": "anfield liverpool uk",
  "san siro": "san siro giuseppe meazza milan italy",
  "allianz arena": "allianz arena munich germany",
  "parc des princes": "parc des princes paris france",
  "maracana": "maracana stadium rio de janeiro brazil",
  "lusail": "lusail iconic stadium qatar",
};

// Conversational phrases to strip for targeted keyword extraction
const CONVERSATIONAL_REGEX =
  /\b(cari|carikan|dimana|tolong cari|rekomendasi|tempat|lokasi|tempat makan|warung makan|toko|jual|yang jual|terdekat|dekat sini|di dekat sini|sekitar sini|di sekitar sini|di sekitar|di dekat|terdekat dari sini|terdekat di|nearby|near me|nearest|closest|yang bagus|terkenal|populer|daerah|area|wilayah|kota|kabupaten)\b/gi;

// Smart Relevance Scoring
function computeRelevanceScore(query: string, item: { name: string; description?: string; category?: string; distanceKm?: number }): number {
  const q = query.toLowerCase().trim();
  const name = (item.name || "").toLowerCase();
  const desc = (item.description || "").toLowerCase();
  const cat = (item.category || "").toLowerCase();

  const qWords = Array.from(new Set(q.split(/[\s,.-]+/).filter((w) => w.length >= 2)));
  if (qWords.length === 0) return 0;

  let score = 0;

  // 1. Exact Full Query Phrase Match
  if (name === q) {
    score += 3000;
  } else if (name.startsWith(q)) {
    score += 2000;
  } else if (name.includes(q)) {
    score += 1500;
  } else if (desc.includes(q)) {
    score += 900;
  }

  // 2. Token-by-Token Match
  let matchedInName = 0;
  let matchedInDesc = 0;

  for (const w of qWords) {
    if (name.includes(w)) {
      matchedInName++;
      score += 350;
    } else if (desc.includes(w)) {
      matchedInDesc++;
      score += 150;
    } else if (cat.includes(w)) {
      score += 60;
    }
  }

  // High bonus if all words in query appear
  if (matchedInName + matchedInDesc >= qWords.length) {
    score += 800;
  }

  // Heavy penalty if specific keywords are completely missing
  const missingCount = qWords.filter((w) => !name.includes(w) && !desc.includes(w) && !cat.includes(w)).length;
  if (missingCount > 0) {
    score -= missingCount * 550;
  }

  // 3. Proximity booster (up to +140 for 0km, gently decaying with distance)
  if (item.distanceKm !== undefined) {
    const distBonus = Math.max(0, 140 - item.distanceKm * 1.2);
    score += distBonus;
  }

  return score;
}

// Fast fetch helper with timeout
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 2800): Promise<Response | null> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch {
    clearTimeout(id);
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawQuery = searchParams.get("q")?.trim() || "";
    const latStr = searchParams.get("lat");
    const lngStr = searchParams.get("lng");

    if (!rawQuery || rawQuery.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const hasCoords = Boolean(latStr && lngStr);
    const refLat = latStr ? parseFloat(latStr) : null;
    const refLng = lngStr ? parseFloat(lngStr) : null;

    const results: PlaceResult[] = [];
    const seenIds = new Set<string>();

    const lower = rawQuery.toLowerCase();

    // 1. Generate normalized & expanded query variations
    const queryVariants = new Set<string>();
    queryVariants.add(rawQuery);

    // Expand abbreviations
    let expanded = lower;
    for (const [abbr, full] of Object.entries(ABBREVIATIONS_MAP)) {
      const regex = new RegExp(`\\b${abbr}\\b`, "gi");
      if (regex.test(expanded)) {
        expanded = expanded.replace(regex, full);
      }
    }
    if (expanded !== lower && expanded.trim().length >= 2) {
      queryVariants.add(expanded.trim());
    }

    // Strip conversational filler words
    const cleanQuery = lower.replace(CONVERSATIONAL_REGEX, "").replace(/\s+/g, " ").trim();
    if (cleanQuery && cleanQuery !== lower && cleanQuery.length >= 2) {
      queryVariants.add(cleanQuery);
    }

    const queryList = Array.from(queryVariants).slice(0, 3);

    // -------------------------------------------------------------
    // Parallel Multi-Engine Search Orchestrator (Promise.allSettled)
    // -------------------------------------------------------------
    const searchTasks: Promise<void>[] = [];

    // ENGINE 1: Komoot Photon (Global + Local Biased)
    for (const q of queryList) {
      searchTasks.push(
        (async () => {
          try {
            const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=30`;
            const res = await fetchWithTimeout(url, {
              headers: { "User-Agent": "CRUDMapGeografis/2.0" },
            });
            if (res && res.ok) {
              const data = await res.json();
              if (Array.isArray(data?.features)) {
                for (const feat of data.features) {
                  const coords = feat.geometry?.coordinates;
                  const props = feat.properties || {};
                  if (coords && coords.length >= 2) {
                    const lng = coords[0];
                    const lat = coords[1];
                    const dist =
                      hasCoords && refLat !== null && refLng !== null
                        ? calculateHaversineKm(refLat, refLng, lat, lng)
                        : undefined;

                    const name = props.name || props.street || props.city || props.state || "Tempat";
                    const addrParts = [
                      props.street,
                      props.housenumber,
                      props.district || props.suburb,
                      props.city,
                      props.state,
                      props.country,
                    ].filter(Boolean);

                    const description = addrParts.length > 0 ? addrParts.join(", ") : name;
                    const id = `photon-${props.osm_type || "N"}-${props.osm_id || `${lat.toFixed(5)}-${lng.toFixed(5)}`}`;

                    if (!seenIds.has(id)) {
                      seenIds.add(id);
                      results.push({
                        id,
                        name,
                        lat,
                        lng,
                        zoom: props.type === "city" || props.type === "state" ? 13 : 17,
                        category: props.osm_value || props.osm_key || props.type || "Tempat",
                        description,
                        source: "photon",
                        distanceKm: dist,
                      });
                    }
                  }
                }
              }
            }
          } catch {
            // ignore
          }
        })()
      );

      // Location-Biased Photon Search
      if (hasCoords && refLat !== null && refLng !== null) {
        searchTasks.push(
          (async () => {
            try {
              const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(
                q
              )}&lat=${refLat}&lon=${refLng}&limit=25`;
              const res = await fetchWithTimeout(url, {
                headers: { "User-Agent": "CRUDMapGeografis/2.0" },
              });
              if (res && res.ok) {
                const data = await res.json();
                if (Array.isArray(data?.features)) {
                  for (const feat of data.features) {
                    const coords = feat.geometry?.coordinates;
                    const props = feat.properties || {};
                    if (coords && coords.length >= 2) {
                      const lng = coords[0];
                      const lat = coords[1];
                      const dist = calculateHaversineKm(refLat, refLng, lat, lng);
                      const name = props.name || props.street || props.city || props.state || "Tempat";
                      const addrParts = [
                        props.street,
                        props.housenumber,
                        props.district || props.suburb,
                        props.city,
                        props.state,
                        props.country,
                      ].filter(Boolean);

                      const description = addrParts.length > 0 ? addrParts.join(", ") : name;
                      const id = `photon-${props.osm_type || "N"}-${props.osm_id || `${lat.toFixed(5)}-${lng.toFixed(5)}`}`;

                      if (!seenIds.has(id)) {
                        seenIds.add(id);
                        results.push({
                          id,
                          name,
                          lat,
                          lng,
                          zoom: props.type === "city" || props.type === "state" ? 13 : 17,
                          category: props.osm_value || props.osm_key || props.type || "Tempat",
                          description,
                          source: "photon",
                          distanceKm: dist,
                        });
                      }
                    }
                  }
                }
              }
            } catch {
              // ignore
            }
          })()
        );
      }
    }

    // ENGINE 2: OSM Nominatim Official Geocoder (Global)
    searchTasks.push(
      (async () => {
        try {
          const nomUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            rawQuery
          )}&limit=25&addressdetails=1`;
          const res = await fetchWithTimeout(nomUrl, {
            headers: { "User-Agent": "CRUDMapGeografis/2.0 (contact@mapgeografis.local)" },
          });
          if (res && res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) {
              for (const item of data) {
                const lat = parseFloat(item.lat);
                const lng = parseFloat(item.lon);
                const dist =
                  hasCoords && refLat !== null && refLng !== null
                    ? calculateHaversineKm(refLat, refLng, lat, lng)
                    : undefined;
                const id = `nom-${item.place_id}`;
                if (!seenIds.has(id)) {
                  seenIds.add(id);
                  results.push({
                    id,
                    name: item.name || item.display_name.split(",")[0],
                    lat,
                    lng,
                    zoom: item.type === "city" || item.type === "administrative" ? 13 : 17,
                    category: item.type || item.class || "Tempat",
                    description: item.display_name,
                    source: "nominatim",
                    distanceKm: dist,
                  });
                }
              }
            }
          }
        } catch {
          // ignore
        }
      })()
    );

    // ENGINE 3: Open-Meteo Global Geocoder (Cities / Districts)
    searchTasks.push(
      (async () => {
        try {
          const term = cleanQuery || rawQuery;
          const meteoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
            term
          )}&count=10&language=id&format=json`;
          const res = await fetchWithTimeout(meteoUrl, {
            headers: { "User-Agent": "CRUDMapGeografis/2.0" },
          });
          if (res && res.ok) {
            const data = await res.json();
            if (Array.isArray(data?.results)) {
              for (const item of data.results) {
                const lat = item.latitude;
                const lng = item.longitude;
                const dist =
                  hasCoords && refLat !== null && refLng !== null
                    ? calculateHaversineKm(refLat, refLng, lat, lng)
                    : undefined;

                const id = `meteo-${item.id}`;
                if (!seenIds.has(id)) {
                  seenIds.add(id);
                  const parts = [item.name, item.admin2, item.admin1, item.country].filter(Boolean);
                  results.push({
                    id,
                    name: item.name,
                    lat,
                    lng,
                    zoom: 13,
                    category: "Kota / Wilayah",
                    description: parts.join(", "),
                    source: "openmeteo",
                    distanceKm: dist,
                  });
                }
              }
            }
          }
        } catch {
          // ignore
        }
      })()
    );

    // ENGINE 4: Overpass API (Live POI Spatial Search for amenities)
    if (hasCoords && refLat !== null && refLng !== null) {
      searchTasks.push(
        (async () => {
          try {
            const radiusMeters = 35000;
            const cleanTerm = cleanQuery || rawQuery;
            const overpassQuery = `[out:json][timeout:4];(
              node["name"~"${cleanTerm}",i](around:${radiusMeters},${refLat},${refLng});
              way["name"~"${cleanTerm}",i](around:${radiusMeters},${refLat},${refLng});
            );out center 25;`;

            const res = await fetchWithTimeout("https://overpass-api.de/api/interpreter", {
              method: "POST",
              body: overpassQuery,
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
            }, 2500);

            if (res && res.ok) {
              const data = await res.json();
              if (Array.isArray(data?.elements)) {
                for (const el of data.elements) {
                  const lat = el.lat ?? el.center?.lat;
                  const lng = el.lon ?? el.center?.lon;
                  if (lat && lng) {
                    const name = el.tags?.name;
                    if (name) {
                      const dist = calculateHaversineKm(refLat, refLng, lat, lng);
                      const id = `op-${el.type}-${el.id}`;
                      if (!seenIds.has(id)) {
                        seenIds.add(id);
                        const street = el.tags?.["addr:street"] || el.tags?.["addr:city"] || "";
                        const desc = street ? `${name}, ${street}` : `${name}, Sekitar Anda`;
                        results.push({
                          id,
                          name,
                          lat,
                          lng,
                          zoom: 17,
                          category: el.tags?.amenity || el.tags?.cuisine || "Tempat",
                          description: desc,
                          source: "overpass",
                          distanceKm: dist,
                        });
                      }
                    }
                  }
                }
              }
            }
          } catch {
            // ignore
          }
        })()
      );
    }

    // Wait for all engines to finish in parallel
    await Promise.allSettled(searchTasks);

    // Deduplicate closely clustered pins (< 15 meters)
    const deduped: PlaceResult[] = [];
    for (const r of results) {
      const isDuplicate = deduped.some(
        (existing) =>
          calculateHaversineKm(existing.lat, existing.lng, r.lat, r.lng) < 0.015 &&
          (existing.name.toLowerCase() === r.name.toLowerCase() || existing.id === r.id)
      );
      if (!isDuplicate) {
        deduped.push(r);
      }
    }

    // Compute smart relevance score for all results
    const scoredResults = deduped.map((item) => ({
      ...item,
      score: computeRelevanceScore(rawQuery, item),
    }));

    // Filter out results with negative relevance if high relevance items exist
    let validResults = scoredResults.filter((r) => (r.score ?? 0) > 0);
    if (validResults.length === 0) {
      validResults = scoredResults;
    }

    // Sort: highest relevance score first, then closest distance
    validResults.sort((a, b) => {
      const scoreDiff = (b.score ?? 0) - (a.score ?? 0);
      if (Math.abs(scoreDiff) > 60) {
        return scoreDiff;
      }
      return (a.distanceKm ?? 0) - (b.distanceKm ?? 0);
    });

    // Return top 45 best results
    return NextResponse.json({ results: validResults.slice(0, 45) });
  } catch (error) {
    console.error("Search API route error:", error);
    return NextResponse.json({ error: "Search failed", results: [] }, { status: 500 });
  }
}
