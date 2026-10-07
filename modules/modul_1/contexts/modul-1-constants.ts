import { LocationReference, MapContextLive } from "../types";

/**
 * Basis Data Referensi Tempat & Optimal Zoom Level (Modul 1)
 */
export const POPULAR_LOCATIONS: LocationReference[] = [
  // Kota & Wilayah Utama Indonesia
  {
    name: "Surabaya",
    category: "city",
    lat: -7.2575,
    lng: 112.7521,
    zoom: 13,
    aliases: ["kota pahlawan", "sby", "surabaya timur", "surabaya barat"],
    description: "Ibu kota Provinsi Jawa Timur, kota terbesar kedua di Indonesia.",
  },
  {
    name: "Jakarta",
    category: "city",
    lat: -6.2088,
    lng: 106.8456,
    zoom: 12,
    aliases: ["dki jakarta", "ibukota jakarta", "monas jakarta"],
    description: "Pusat pemerintahan dan ekonomi Indonesia.",
  },
  {
    name: "IKN Nusantara",
    category: "landmark",
    lat: -0.9556,
    lng: 116.7042,
    zoom: 14,
    aliases: ["ibu kota nusantara", "ikn", "penajam paser utara", "sepaku"],
    description: "Ibu Kota Negara masa depan Indonesia di Kalimantan Timur.",
  },
  {
    name: "Bandung",
    category: "city",
    lat: -6.9175,
    lng: 107.6191,
    zoom: 13,
    aliases: ["kota bandung", "paris van java", "bandung juara"],
    description: "Ibu kota Provinsi Jawa Barat yang dikelilingi pegunungan sejuk.",
  },
  {
    name: "Semarang",
    category: "city",
    lat: -6.9667,
    lng: 110.4167,
    zoom: 13,
    aliases: ["kota semarang", "simpang lima semarang"],
    description: "Ibu kota Provinsi Jawa Tengah di pesisir utara pulau Jawa.",
  },
  {
    name: "Yogyakarta",
    category: "city",
    lat: -7.7956,
    lng: 110.3695,
    zoom: 14,
    aliases: ["jogja", "diy", "malioboro", "keraton jogja"],
    description: "Kota budaya dan pelajar di Daerah Istimewa Yogyakarta.",
  },
  {
    name: "Malang",
    category: "city",
    lat: -7.9797,
    lng: 112.6304,
    zoom: 13,
    aliases: ["kota malang", "ngalam"],
    description: "Kota sejuk di Jawa Timur dekat kawasan Bromo dan Semeru.",
  },
  {
    name: "Alun-Alun Kota Malang",
    category: "landmark",
    lat: -7.9826,
    lng: 112.6308,
    zoom: 17,
    aliases: ["alun alun malang", "alun-alun merdeka malang", "taman alun alun malang"],
    description: "Ruang terbuka hijau dan pusat rekreasi keluarga di pusat Kota Malang.",
  },
  {
    name: "Alun-Alun Tugu Malang",
    category: "landmark",
    lat: -7.9774,
    lng: 112.6338,
    zoom: 17,
    aliases: ["tugu malang", "alun alun bunder malang"],
    description: "Ikon bersejarah Kota Malang di depan Balai Kota dengan kolam teratai.",
  },
  {
    name: "Denpasar",
    category: "city",
    lat: -8.6705,
    lng: 115.2126,
    zoom: 13,
    aliases: ["bali", "kota denpasar", "kuta bali", "sanur"],
    description: "Pintu gerbang pariwisata internasional di Pulau Bali.",
  },
  {
    name: "Medan",
    category: "city",
    lat: 3.5952,
    lng: 98.6722,
    zoom: 13,
    aliases: ["kota medan", "medan sumut"],
    description: "Kota metropolitan terbesar di Pulau Sumatera.",
  },
  {
    name: "Makassar",
    category: "city",
    lat: -5.1477,
    lng: 119.4327,
    zoom: 13,
    aliases: ["ujung pandang", "kota makassar", "pantai losari"],
    description: "Kota pelabuhan utama dan gerbang Indonesia Timur.",
  },
  {
    name: "Palembang",
    category: "city",
    lat: -2.9761,
    lng: 104.7754,
    zoom: 13,
    aliases: ["jembatan ampera", "kota palembang"],
    description: "Kota tertua di Indonesia dengan ikon Sungai Musi & Jembatan Ampera.",
  },
  {
    name: "Balikpapan",
    category: "city",
    lat: -1.2379,
    lng: 116.8289,
    zoom: 13,
    aliases: ["kota minyak", "balikpapan kaltim"],
    description: "Kota penyangga utama IKN di Kalimantan Timur.",
  },

  // Wisata & Keajaiban Alam Terkenal
  {
    name: "Gunung Bromo",
    category: "nature",
    lat: -7.9425,
    lng: 112.953,
    zoom: 14,
    aliases: ["bromo", "tengger", "kawah bromo", "pasir berbisik"],
    description: "Gunung berapi aktif legendaris di Taman Nasional Bromo Tengger Semeru.",
  },
  {
    name: "Candi Borobudur",
    category: "landmark",
    lat: -7.6079,
    lng: 110.2038,
    zoom: 16,
    aliases: ["borobudur", "candi budha magelang"],
    description: "Candi Buddha terbesar di dunia dan warisan budaya dunia UNESCO di Magelang.",
  },
  {
    name: "Candi Prambanan",
    category: "landmark",
    lat: -7.752,
    lng: 110.4915,
    zoom: 16,
    aliases: ["prambanan", "roro jonggrang"],
    description: "Kompleks candi Hindu terindah di Indonesia.",
  },
  {
    name: "Raja Ampat",
    category: "tourism",
    lat: -0.2333,
    lng: 130.5167,
    zoom: 10,
    aliases: ["kepulauan raja ampat", "pianemo", "wayag", "papua barat"],
    description: "Surga keanekaragaman hayati laut dunia di Papua Barat Daya.",
  },
  {
    name: "Danau Toba",
    category: "nature",
    lat: 2.6845,
    lng: 98.8756,
    zoom: 11,
    aliases: ["toba", "pulau samosir", "danau vulkanik toba"],
    description: "Danau vulkanik terbesar di Asia Tenggara dan kaldera raksasa dunia.",
  },
  {
    name: "Labuan Bajo & Pulau Komodo",
    category: "tourism",
    lat: -8.5833,
    lng: 119.55,
    zoom: 12,
    aliases: ["labuan bajo", "komodo", "pulau padar", "ntt"],
    description: "Habitat asli kadal purba Komodo dan destinasi wisata bahari super prioritas.",
  },
  {
    name: "Bangkalan (Madura)",
    category: "city",
    lat: -7.0315,
    lng: 112.7486,
    zoom: 14,
    aliases: ["bangkalan", "kota bangkalan", "madura barat", "kamal bangkalan"],
    description: "Kabupaten di ujung barat Pulau Madura yang terhubung dengan Jembatan Suramadu.",
  },
  {
    name: "Kamal (Bangkalan Madura)",
    category: "landmark",
    lat: -7.1697,
    lng: 112.7214,
    zoom: 15,
    aliases: ["kamal", "pelabuhan kamal", "telang kamal", "utm kamal"],
    description: "Kecamatan pesisir di Bangkalan Madura dekat Universitas Trunojoyo Madura.",
  },
  {
    name: "Sampang (Madura)",
    category: "city",
    lat: -7.1872,
    lng: 113.2394,
    zoom: 14,
    aliases: ["sampang", "kabupaten sampang"],
    description: "Kabupaten di bagian tengah Pulau Madura.",
  },
  {
    name: "Pamekasan (Madura)",
    category: "city",
    lat: -7.1584,
    lng: 113.4739,
    zoom: 14,
    aliases: ["pamekasan", "kota pamekasan"],
    description: "Pusat pemerintahan eks-Karesidenan Madura di Jawa Timur.",
  },
  {
    name: "Sumenep (Madura)",
    category: "city",
    lat: -7.0167,
    lng: 113.8667,
    zoom: 14,
    aliases: ["sumenep", "keraton sumenep", "ujung timur madura"],
    description: "Kabupaten di ujung timur Madura yang kaya akan sejarah keraton dan kepulauan.",
  },
  {
    name: "Jembatan Suramadu",
    category: "landmark",
    lat: -7.1857,
    lng: 112.7806,
    zoom: 15,
    aliases: ["suramadu", "jembatan surabaya madura"],
    description: "Jembatan kabel pancang yang menghubungkan Pulau Jawa (Surabaya) dan Pulau Madura.",
  },
  {
    name: "Bebek Sinjay Bangkalan",
    category: "tourism",
    lat: -7.0543,
    lng: 112.7456,
    zoom: 16,
    aliases: ["bebek sinjay", "sinjay bangkalan", "sinjay madura", "kuliner bebek bangkalan"],
    description: "Kuliner bebek goreng legendaris khas Bangkalan, Madura dengan sambal mangga muda (pencit).",
  },
  {
    name: "Rujak & Kuliner Madura",
    category: "tourism",
    lat: -7.0315,
    lng: 112.7486,
    zoom: 15,
    aliases: ["rujak madura", "rujak petis madura", "rujak cingur madura", "kuliner madura"],
    description: "Pusat jajanan dan warung rujak petis Madura khas Bangkalan.",
  },
  {
    name: "Monas (Monumen Nasional)",
    category: "landmark",
    lat: -6.1754,
    lng: 106.8272,
    zoom: 17,
    aliases: ["monas", "monumen nasional", "tugu monas", "gambir jakarta"],
    description: "Monumen kebanggaan Republik Indonesia di Jakarta Pusat.",
  },
  {
    name: "Gelora Bung Karno (GBK)",
    category: "landmark",
    lat: -6.2185,
    lng: 106.8018,
    zoom: 16,
    aliases: ["gbk", "stadion utama gbk", "senayan jakarta"],
    description: "Kompleks olahraga serbaguna terbesar di Senayan, Jakarta Pusat.",
  },
  {
    name: "Masjid Istiqlal Jakarta",
    category: "landmark",
    lat: -6.1702,
    lng: 106.8314,
    zoom: 17,
    aliases: ["istiqlal", "masjid istiqlal"],
    description: "Masjid terbesar di Asia Tenggara dan ikon kerukunan di Jakarta Pusat.",
  },
  {
    name: "Malioboro Yogyakarta",
    category: "landmark",
    lat: -7.7926,
    lng: 110.3658,
    zoom: 16,
    aliases: ["malioboro", "jalan malioboro", "titik nol jogja"],
    description: "Jantung kawasan belanja dan wisata legendaris di Kota Yogyakarta.",
  },
  {
    name: "Alun-Alun Surabaya",
    category: "landmark",
    lat: -7.2642,
    lng: 112.7486,
    zoom: 17,
    aliases: ["alun-alun surabaya", "balai pemuda surabaya"],
    description: "Pusat kesenian dan ruang terbuka publik modern di Balai Pemuda Surabaya.",
  },
  {
    name: "Alun-Alun Sidoarjo",
    category: "landmark",
    lat: -7.4478,
    lng: 112.7183,
    zoom: 17,
    aliases: ["alun alun sidoarjo", "taman sidoarjo"],
    description: "Ruang terbuka hijau di pusat Kabupaten Sidoarjo.",
  },
  {
    name: "Alun-Alun Bandung",
    category: "landmark",
    lat: -6.9219,
    lng: 107.6069,
    zoom: 17,
    aliases: ["alun alun bandung", "masjid raya bandung"],
    description: "Alun-alun berumput sintetis ikonik di depan Masjid Raya Bandung.",
  },
  {
    name: "Pantai Kuta Bali",
    category: "tourism",
    lat: -8.7185,
    lng: 115.1686,
    zoom: 16,
    aliases: ["kuta", "pantai kuta", "kuta beach"],
    description: "Destinasi pantai pasir putih dan sunset paling terkenal di Pulau Bali.",
  },
  {
    name: "Gunung Rinjani",
    category: "nature",
    lat: -8.4114,
    lng: 116.4578,
    zoom: 13,
    aliases: ["rinjani", "segara anak", "lombok timur"],
    description: "Gunung berapi megah di Pulau Lombok dengan danau kawah Segara Anak.",
  },

  // Landmark Dunia Populer & Keajaiban Dunia
  {
    name: "Menara Eiffel (Paris)",
    category: "landmark",
    lat: 48.8584,
    lng: 2.2945,
    zoom: 16,
    aliases: ["eiffel tower", "paris", "prancis", "france"],
    description: "Menara besi legendaris di Champ de Mars, Paris, Prancis.",
  },
  {
    name: "Patung Liberty (New York)",
    category: "landmark",
    lat: 40.6892,
    lng: -74.0445,
    zoom: 16,
    aliases: ["statue of liberty", "new york", "usa", "amerika"],
    description: "Monumen kemerdekaan terkenal di Pelabuhan New York, Amerika Serikat.",
  },
  {
    name: "Kakbah & Masjidil Haram (Makkah)",
    category: "landmark",
    lat: 21.4225,
    lng: 39.8262,
    zoom: 17,
    aliases: ["kaabah", "kabah", "makkah", "mekkah", "masjidil haram", "arab saudi"],
    description: "Kiblat umat Islam dunia yang terletak di Makkah Al-Mukarramah, Arab Saudi.",
  },
  {
    name: "Masjid Nabawi (Madinah)",
    category: "landmark",
    lat: 24.4672,
    lng: 39.6111,
    zoom: 17,
    aliases: ["madinah", "medina", "masjid nabawi", "kubah hijau"],
    description: "Masjid suci kedua umat Islam dan makam Nabi Muhammad SAW di Madinah.",
  },
  {
    name: "Burj Khalifa (Dubai)",
    category: "landmark",
    lat: 25.1972,
    lng: 55.2744,
    zoom: 16,
    aliases: ["burj khalifa", "dubai", "uea", "gedung tertinggi dunia"],
    description: "Gedung pencakar langit tertinggi di dunia setinggi 828 meter di Dubai, UEA.",
  },
  {
    name: "Taj Mahal (India)",
    category: "landmark",
    lat: 27.1751,
    lng: 78.0421,
    zoom: 16,
    aliases: ["taj mahal", "agra india", "keajaiban dunia india"],
    description: "Mausoleum marmer putih gading megah di tepi Sungai Yamuna, Agra, India.",
  },
  {
    name: "Colosseum (Roma, Italia)",
    category: "landmark",
    lat: 41.8902,
    lng: 12.4922,
    zoom: 16,
    aliases: ["colosseum", "koloseum", "roma", "rome", "italia"],
    description: "Amfiteater kuno terbesar dari masa Kekaisaran Romawi di Roma, Italia.",
  },
  {
    name: "Menara Pisa (Italia)",
    category: "landmark",
    lat: 43.723,
    lng: 10.3966,
    zoom: 17,
    aliases: ["leaning tower of pisa", "menara miring pisa", "pisa italia"],
    description: "Menara lonceng katedral miring yang terkenal di Pisa, Italia.",
  },
  {
    name: "Tembok Besar Cina (Great Wall)",
    category: "landmark",
    lat: 40.4319,
    lng: 116.5704,
    zoom: 14,
    aliases: ["great wall of china", "tembok besar cina", "beijing", "tiongkok"],
    description: "Karya arsitektur pertahanan militer terpanjang di dunia di Tiongkok.",
  },
  {
    name: "Tokyo Tower & Shibuya (Jepang)",
    category: "landmark",
    lat: 35.6586,
    lng: 139.7454,
    zoom: 15,
    aliases: ["tokyo tower", "tokyo", "jepang", "japan", "shibuya"],
    description: "Menara komunikasi ikonik merah-putih di Minato, Tokyo, Jepang.",
  },
  {
    name: "Gunung Fuji (Jepang)",
    category: "nature",
    lat: 35.3606,
    lng: 138.7274,
    zoom: 13,
    aliases: ["mt fuji", "gunung fuji", "fujisan"],
    description: "Gunung tertinggi dan simbol keindahan alam Jepang.",
  },
  {
    name: "Piramida Giza (Mesir)",
    category: "landmark",
    lat: 29.9792,
    lng: 31.1342,
    zoom: 16,
    aliases: ["pyramids of giza", "piramida mesir", "cairo", "kairo"],
    description: "Salah satu dari Tujuh Keajaiban Dunia Kuno di Kairo, Mesir.",
  },
  {
    name: "Big Ben & Westminster (London)",
    category: "landmark",
    lat: 51.5007,
    lng: -0.1246,
    zoom: 16,
    aliases: ["big ben", "london", "inggris", "uk", "elizabeth tower"],
    description: "Menara jam legendaris di Gedung Parlemen Inggris, London.",
  },
  {
    name: "Sydney Opera House (Australia)",
    category: "landmark",
    lat: -33.8568,
    lng: 151.2153,
    zoom: 16,
    aliases: ["sydney opera house", "sydney", "australia"],
    description: "Pusat seni pertunjukan dengan arsitektur berbentuk cangkang kerang di Sydney Harbour.",
  },
  {
    name: "Marina Bay Sands & Merlion (Singapura)",
    category: "landmark",
    lat: 1.2838,
    lng: 103.8591,
    zoom: 16,
    aliases: ["marina bay sands", "merlion", "singapura", "singapore"],
    description: "Ikon pariwisata modern dan resor terpadu tepi teluk di Singapura.",
  },
  {
    name: "Menara Kembar Petronas (Kuala Lumpur)",
    category: "landmark",
    lat: 3.1578,
    lng: 101.7119,
    zoom: 16,
    aliases: ["petronas towers", "klcc", "kuala lumpur", "malaysia"],
    description: "Menara kembar tertinggi di dunia di Kuala Lumpur, Malaysia.",
  },
  {
    name: "Seoul Tower & Gangnam (Korea Selatan)",
    category: "landmark",
    lat: 37.5512,
    lng: 126.9882,
    zoom: 15,
    aliases: ["n seoul tower", "seoul", "korea selatan", "korsel"],
    description: "Menara observasi di Gunung Namsan, Seoul, Korea Selatan.",
  },
  {
    name: "Air Terjun Niagara (Kanada / USA)",
    category: "nature",
    lat: 43.0896,
    lng: -79.0849,
    zoom: 15,
    aliases: ["niagara falls", "air terjun niagara", "ontario canada"],
    description: "Kelompok tiga air terjun raksasa di perbatasan Amerika Serikat dan Kanada.",
  },
  {
    name: "Grand Canyon (Arizona, USA)",
    category: "nature",
    lat: 36.0544,
    lng: -112.1401,
    zoom: 12,
    aliases: ["grand canyon", "arizona", "jurang grand canyon"],
    description: "Ngarai jurang curam luar biasa yang diukir Sungai Colorado di Arizona, AS.",
  },
  {
    name: "Machu Picchu (Peru)",
    category: "landmark",
    lat: -13.1631,
    lng: -72.545,
    zoom: 15,
    aliases: ["machu picchu", "kota suku inca", "peru"],
    description: "Situs kota benteng kuno peradaban Inka di Pegunungan Andes, Peru.",
  },
  {
    name: "Patung Kristus Penebus (Rio de Janeiro)",
    category: "landmark",
    lat: -22.9519,
    lng: -43.2105,
    zoom: 16,
    aliases: ["christ the redeemer", "rio de janeiro", "brasil", "brazil"],
    description: "Patung Yesus Kristus Art Deco raksasa di puncak Gunung Corcovado, Brasil.",
  },
  {
    name: "Hagia Sophia & Blue Mosque (Istanbul)",
    category: "landmark",
    lat: 41.0086,
    lng: 28.9802,
    zoom: 16,
    aliases: ["hagia sophia", "ayasofya", "istanbul", "turki", "turkey"],
    description: "Monumen bersejarah megah perpaduan arsitektur Bizantium dan Utsmaniyah di Istanbul.",
  },

  // Ibu Kota & Kota Metropolitan Dunia
  {
    name: "Washington, D.C. (Ibu Kota USA)",
    category: "city",
    lat: 38.9072,
    lng: -77.0369,
    zoom: 13,
    aliases: ["washington dc", "gedung putih", "white house", "us capitol", "amerika serikat"],
    description: "Ibu kota Amerika Serikat dan pusat kekuasaan pemerintahan federal AS.",
  },
  {
    name: "Silicon Valley (California, USA)",
    category: "landmark",
    lat: 37.3861,
    lng: -122.0839,
    zoom: 13,
    aliases: ["silicon valley", "san jose", "cupertino", "palo alto", "mountain view", "tech hub"],
    description: "Pusat inovasi teknologi dan markas raksasa teknologi global di California, AS.",
  },
  {
    name: "Berlin (Jerman)",
    category: "city",
    lat: 52.52,
    lng: 13.405,
    zoom: 13,
    aliases: ["berlin", "jerman", "germany", "gerbang brandenburg"],
    description: "Ibu kota Jerman yang kaya akan sejarah arsitektur dan seni modern.",
  },
  {
    name: "Moskow (Rusia)",
    category: "city",
    lat: 55.7558,
    lng: 37.6173,
    zoom: 13,
    aliases: ["moscow", "moskow", "kremlin", "red square", "lapangan merah", "rusia"],
    description: "Ibu kota Rusia dengan kompleks benteng bersejarah Kremlin dan Lapangan Merah.",
  },
  {
    name: "Amsterdam (Belanda)",
    category: "city",
    lat: 52.3676,
    lng: 4.9041,
    zoom: 13,
    aliases: ["amsterdam", "belanda", "netherlands", "kanal amsterdam"],
    description: "Ibu kota Belanda yang terkenal dengan jaringan kanal bersejarah dan sepeda.",
  },
  {
    name: "Canberra & Sydney (Australia)",
    category: "city",
    lat: -35.2809,
    lng: 149.13,
    zoom: 12,
    aliases: ["canberra", "ibu kota australia", "parliament house australia"],
    description: "Ibu kota terencana Australia yang terletak di antara Sydney dan Melbourne.",
  },
  {
    name: "New Delhi (India)",
    category: "city",
    lat: 28.6139,
    lng: 77.209,
    zoom: 13,
    aliases: ["new delhi", "delhi", "india", "india gate"],
    description: "Ibu kota Republik India dengan monumen bersejarah India Gate.",
  },
  {
    name: "Kuala Lumpur (Malaysia)",
    category: "city",
    lat: 3.139,
    lng: 101.6869,
    zoom: 13,
    aliases: ["kuala lumpur", "kl", "malaysia", "bukit bintang"],
    description: "Ibu kota federal Malaysia dengan gedung-gedung pencakar langit modern.",
  },
  {
    name: "Bangkok (Thailand)",
    category: "city",
    lat: 13.7563,
    lng: 100.5018,
    zoom: 13,
    aliases: ["bangkok", "thailand", "wat arun", "grand palace bangkok"],
    description: "Ibu kota Thailand yang terkenal dengan kuil-kuil megah dan kehidupan tepi Sungai Chao Phraya.",
  },
  {
    name: "Gunung Everest (Himalaya)",
    category: "nature",
    lat: 27.9881,
    lng: 86.925,
    zoom: 12,
    aliases: ["mount everest", "puncak everest", "himalaya", "atap dunia", "nepal"],
    description: "Puncak gunung tertinggi di bumi setinggi 8.848 meter di Pegunungan Himalaya.",
  },
  {
    name: "Bandara Internasional Soekarno-Hatta (CGK)",
    category: "landmark",
    lat: -6.1256,
    lng: 106.6558,
    zoom: 14,
    aliases: ["cgk", "bandara soetta", "soekarno hatta", "bandara cengkareng"],
    description: "Pintu gerbang udara internasional utama Indonesia di Tangerang, Banten.",
  },
  {
    name: "Bandara Internasional Juanda Surabaya (SUB)",
    category: "landmark",
    lat: -7.3798,
    lng: 112.7877,
    zoom: 15,
    aliases: ["sub", "bandara juanda", "juanda airport", "sedati sidoarjo"],
    description: "Bandara internasional utama Jawa Timur di Sidoarjo / Surabaya.",
  },
  {
    name: "Bandara Internasional I Gusti Ngurah Rai (DPS)",
    category: "landmark",
    lat: -8.7481,
    lng: 115.1672,
    zoom: 15,
    aliases: ["dps", "ngurah rai", "bandara bali", "denpasar airport"],
    description: "Bandara internasional gerbang pariwisata Pulau Dewata di Tuban, Kuta, Bali.",
  },
  {
    name: "Bandara Internasional Changi (SIN)",
    category: "landmark",
    lat: 1.3644,
    lng: 103.9915,
    zoom: 15,
    aliases: ["sin", "changi airport", "jewel changi", "bandara changi"],
    description: "Salah satu bandara terbaik di dunia dengan air terjun indoor Jewel di Singapura.",
  },
  {
    name: "Bandara Tokyo Haneda & Narita (Jepang)",
    category: "landmark",
    lat: 35.5494,
    lng: 139.7798,
    zoom: 14,
    aliases: ["hnd", "nrt", "haneda airport", "narita airport", "bandara tokyo"],
    description: "Pusat transit penerbangan internasional utama di Tokyo Raya, Jepang.",
  },

  // Keajaiban Dunia & Landmark Bersejarah Tambahan
  {
    name: "Masjid Al-Aqsa (Yerusalem)",
    category: "landmark",
    lat: 31.7761,
    lng: 35.2358,
    zoom: 17,
    aliases: ["al aqsa", "masjid al aqsa", "baitul maqdis", "yerusalem", "jerusalem", "palestina"],
    description: "Situs tersuci ketiga dalam Islam yang bersejarah di Kota Tua Yerusalem.",
  },
  {
    name: "Petra (Yordania)",
    category: "landmark",
    lat: 30.3285,
    lng: 35.4444,
    zoom: 16,
    aliases: ["petra", "al khazneh", "the treasury", "yordania", "jordan"],
    description: "Kota batu kuno suku Nabath yang dipahat langsung di tebing batu mawar Yordania.",
  },
  {
    name: "Chichen Itza (Meksiko)",
    category: "landmark",
    lat: 20.6843,
    lng: -88.5678,
    zoom: 16,
    aliases: ["chichen itza", "piramida maya", "el castillo", "yucatan mexico", "meksiko"],
    description: "Kompleks kota peninggalan peradaban Maya kuno dan Keajaiban Dunia di Meksiko.",
  },
  {
    name: "Stonehenge (Inggris)",
    category: "landmark",
    lat: 51.1789,
    lng: -1.8262,
    zoom: 17,
    aliases: ["stonehenge", "salisbury", "wiltshire", "inggris", "uk"],
    description: "Monumen batu prasejarah melingkar paling misterius dan terkenal di Wiltshire, Inggris.",
  },
  {
    name: "Museum Louvre (Paris, Prancis)",
    category: "landmark",
    lat: 48.8606,
    lng: 2.3376,
    zoom: 17,
    aliases: ["louvre", "museum louvre", "mona lisa", "piramida kaca louvre", "paris france"],
    description: "Museum seni terbesar di dunia yang menyimpan lukisan legendaris Mona Lisa di Paris.",
  },
  {
    name: "Sagrada Familia (Barcelona, Spanyol)",
    category: "landmark",
    lat: 41.4036,
    lng: 2.1744,
    zoom: 17,
    aliases: ["sagrada familia", "basilika sagrada familia", "antoni gaudi", "barcelona", "spanyol", "spain"],
    description: "Mahakarya basilika arsitektur ekspresionis karya Antoni Gaudí di Barcelona, Spanyol.",
  },
  {
    name: "Jembatan Golden Gate (San Francisco, USA)",
    category: "landmark",
    lat: 37.8199,
    lng: -122.4783,
    zoom: 15,
    aliases: ["golden gate", "jembatan golden gate", "san francisco", "california", "usa"],
    description: "Jembatan gantung merah oranye legendaris melintasi Selat Golden Gate di California, AS.",
  },
  {
    name: "Times Square (New York City, USA)",
    category: "landmark",
    lat: 40.758,
    lng: -73.9855,
    zoom: 17,
    aliases: ["times square", "broadway", "manhattan", "new york", "nyc", "amerika"],
    description: "Pusat hiburan dan persimpangan komersial paling bercahaya dan ramai di dunia di Manhattan, New York.",
  },
  {
    name: "Hollywood Sign & Walk of Fame (Los Angeles, USA)",
    category: "landmark",
    lat: 34.1341,
    lng: -118.3215,
    zoom: 16,
    aliases: ["hollywood", "hollywood sign", "los angeles", "la", "california", "walk of fame"],
    description: "Ikon industri perfilman dunia di perbukitan Mount Lee, Los Angeles, California.",
  },
  {
    name: "Walt Disney World (Orlando, Florida)",
    category: "tourism",
    lat: 28.3852,
    lng: -81.5639,
    zoom: 14,
    aliases: ["disney world", "disneyland orlando", "magic kingdom", "florida", "taman hiburan disney"],
    description: "Kompleks taman hiburan rekreasi keluarga paling populer di dunia di Florida, AS.",
  },
  {
    name: "Air Terjun Iguazu (Argentina / Brasil)",
    category: "nature",
    lat: -25.6953,
    lng: -54.4367,
    zoom: 15,
    aliases: ["iguazu falls", "cataratas del iguazu", "air terjun iguazu", "argentina", "brasil"],
    description: "Sistem air terjun terbesar di dunia di perbatasan Argentina dan Brasil.",
  },
  {
    name: "Air Terjun Victoria (Zambia / Zimbabwe)",
    category: "nature",
    lat: -17.9243,
    lng: 25.8572,
    zoom: 15,
    aliases: ["victoria falls", "mosi-oa-tunya", "air terjun victoria", "zambia", "zimbabwe", "afrika"],
    description: "Air terjun tirai air jatuh terbesar di dunia di Sungai Zambezi, Afrika.",
  },
  {
    name: "Laut Mati (Dead Sea - Yordania / Israel)",
    category: "nature",
    lat: 31.559,
    lng: 35.4732,
    zoom: 11,
    aliases: ["dead sea", "laut mati", "danau asin garam", "yordania", "israel"],
    description: "Titik terendah di daratan bumi dengan kadar garam sangat tinggi sehingga membuat benda terapung.",
  },
  {
    name: "Terumbu Karang Great Barrier Reef (Australia)",
    category: "nature",
    lat: -18.2871,
    lng: 147.6992,
    zoom: 8,
    aliases: ["great barrier reef", "karang penghalang besar", "queensland australia", "cairns"],
    description: "Sistem terumbu karang terbesar di dunia yang terlihat dari luar angkasa di Australia.",
  },

  // Universitas Top Dunia & Indonesia
  {
    name: "Harvard University (USA)",
    category: "landmark",
    lat: 42.377,
    lng: -71.1167,
    zoom: 16,
    aliases: ["harvard", "harvard university", "cambridge massachusetts", "ivy league", "kampus harvard"],
    description: "Universitas tertua dan paling prestisius di Amerika Serikat di Cambridge, Massachusetts.",
  },
  {
    name: "Massachusetts Institute of Technology (MIT)",
    category: "landmark",
    lat: 42.3601,
    lng: -71.0942,
    zoom: 16,
    aliases: ["mit", "mit boston", "massachusetts institute of technology", "kampus mit"],
    description: "Institut teknologi dan riset sains nomor 1 di dunia di Cambridge, AS.",
  },
  {
    name: "Stanford University (Silicon Valley, USA)",
    category: "landmark",
    lat: 37.4275,
    lng: -122.1697,
    zoom: 15,
    aliases: ["stanford", "stanford university", "palo alto", "silicon valley"],
    description: "Universitas riset terkemuka di jantung Silicon Valley, California.",
  },
  {
    name: "University of Oxford (Inggris)",
    category: "landmark",
    lat: 51.7548,
    lng: -1.2544,
    zoom: 16,
    aliases: ["oxford", "oxford university", "kampus oxford", "inggris", "uk"],
    description: "Universitas berbahasa Inggris tertua di dunia di kota Oxford, Inggris.",
  },
  {
    name: "University of Cambridge (Inggris)",
    category: "landmark",
    lat: 52.2053,
    lng: 0.1218,
    zoom: 16,
    aliases: ["cambridge", "cambridge university", "kampus cambridge", "inggris", "uk"],
    description: "Universitas bersejarah dengan puluhan penerima Nobel di Cambridge, Inggris.",
  },
  {
    name: "National University of Singapore (NUS)",
    category: "landmark",
    lat: 1.2966,
    lng: 103.7764,
    zoom: 16,
    aliases: ["nus", "nus singapore", "national university of singapore", "kent ridge"],
    description: "Universitas terkemuka nomor 1 di kawasan Asia di Kent Ridge, Singapura.",
  },
  {
    name: "Universitas Indonesia (UI Depok)",
    category: "landmark",
    lat: -6.3653,
    lng: 106.8286,
    zoom: 15,
    aliases: ["ui", "universitas indonesia", "kampus ui depok", "jaket kuning"],
    description: "Salah satu perguruan tinggi negeri tertua dan terdepan di Indonesia.",
  },
  {
    name: "Institut Teknologi Bandung (ITB Ganesha)",
    category: "landmark",
    lat: -6.8915,
    lng: 107.6107,
    zoom: 16,
    aliases: ["itb", "institut teknologi bandung", "kampus itb ganesha", "itb bandung"],
    description: "Sekolah tinggi teknik pertama di Indonesia di Kota Bandung.",
  },
  {
    name: "Universitas Gadjah Mada (UGM Yogyakarta)",
    category: "landmark",
    lat: -7.7713,
    lng: 110.3776,
    zoom: 15,
    aliases: ["ugm", "universitas gadjah mada", "bulaksumur", "ugm jogja"],
    description: "Perguruan tinggi negeri berwawasan kebangsaan di Bulaksumur, Yogyakarta.",
  },
  {
    name: "Institut Teknologi Sepuluh Nopember (ITS Surabaya)",
    category: "landmark",
    lat: -7.2824,
    lng: 112.7949,
    zoom: 16,
    aliases: ["its", "its surabaya", "sukolilo surabaya", "institut teknologi sepuluh nopember"],
    description: "Institut teknologi maritim dan sains unggulan Indonesia di Sukolilo, Surabaya.",
  },
  {
    name: "Universitas Airlangga (UNAIR Surabaya)",
    category: "landmark",
    lat: -7.2694,
    lng: 112.7844,
    zoom: 16,
    aliases: ["unair", "universitas airlangga", "kampus c unair", "kampus b unair"],
    description: "Universitas negeri terkemuka di bidang kedokteran dan sains di Surabaya.",
  },
  {
    name: "Universitas Brawijaya (UB Malang)",
    category: "landmark",
    lat: -7.9526,
    lng: 112.6144,
    zoom: 16,
    aliases: ["ub", "universitas brawijaya", "brawijaya malang", "kampus ub"],
    description: "Universitas negeri berprestasi nasional di Kota Malang, Jawa Timur.",
  },
  {
    name: "Universitas Trunojoyo Madura (UTM Bangkalan)",
    category: "landmark",
    lat: -7.1264,
    lng: 112.7231,
    zoom: 16,
    aliases: ["utm", "universitas trunojoyo madura", "kampus utm", "telang kamal bangkalan"],
    description: "Universitas negeri kebanggaan Pulau Madura di Telang, Kamal, Kabupaten Bangkalan.",
  },

  // Stadion Sepak Bola & Olahraga Terbesar Dunia
  {
    name: "Spotify Camp Nou (FC Barcelona)",
    category: "landmark",
    lat: 41.3809,
    lng: 2.1228,
    zoom: 16,
    aliases: ["camp nou", "barcelona stadium", "fc barcelona", "barca", "spanyol"],
    description: "Kandang legendaris FC Barcelona dan stadion berkapasitas terbesar di Eropa.",
  },
  {
    name: "Estadio Santiago Bernabéu (Real Madrid)",
    category: "landmark",
    lat: 40.4531,
    lng: -3.6883,
    zoom: 16,
    aliases: ["bernabeu", "santiago bernabeu", "real madrid", "stadion bernabeu", "madrid"],
    description: "Stadion megah berteknologi atap lipat milik Real Madrid di ibu kota Spanyol.",
  },
  {
    name: "Wembley Stadium (London, Inggris)",
    category: "landmark",
    lat: 51.556,
    lng: -0.2796,
    zoom: 16,
    aliases: ["wembley", "wembley stadium", "stadion wembley", "london", "timnas inggris"],
    description: "Stadion ikonik kubah lengkung megah pusat olahraga dan konser musik di London.",
  },
  {
    name: "Old Trafford (Manchester United)",
    category: "landmark",
    lat: 53.4631,
    lng: -2.2913,
    zoom: 16,
    aliases: ["old trafford", "theatre of dreams", "manchester united", "mu", "manchester"],
    description: "Kandang bersejarah berjuluk 'Theatre of Dreams' milik Manchester United di Inggris.",
  },
  {
    name: "San Siro / Giuseppe Meazza (Milan, Italia)",
    category: "landmark",
    lat: 45.4781,
    lng: 9.124,
    zoom: 16,
    aliases: ["san siro", "giuseppe meazza", "ac milan", "inter milan", "milan italia"],
    description: "Katedral sepak bola megah kandang AC Milan dan Inter Milan di kota mode Milan.",
  },
  {
    name: "Allianz Arena (Bayern München, Jerman)",
    category: "landmark",
    lat: 48.2188,
    lng: 11.6247,
    zoom: 16,
    aliases: ["allianz arena", "bayern munchen", "bayern munich", "munich", "jerman"],
    description: "Stadion modern dengan panel luar fasad ETFE yang menyala warna-warni di München, Jerman.",
  },
  {
    name: "Jakarta International Stadium (JIS)",
    category: "landmark",
    lat: -6.1256,
    lng: 106.8622,
    zoom: 16,
    aliases: ["jis", "jakarta international stadium", "stadion jis", "tanjung priok"],
    description: "Stadion sepak bola berstandar FIFA dengan atap buka-tutup (retractable roof) di Jakarta Utara.",
  },
  {
    name: "Gelora Bung Tomo (GBT Surabaya)",
    category: "landmark",
    lat: -7.2272,
    lng: 112.6256,
    zoom: 16,
    aliases: ["gbt", "gelora bung tomo", "stadion gbt", "persebaya surabaya", "benowo"],
    description: "Stadion kebanggaan warga Surabaya dan markas klub Persebaya di Benowo, Surabaya.",
  },
];

/**
 * Cek apakah input pengguna adalah koordinat angka langsung (Lat, Lng atau DMS)
 */
export function parseCoordinates(input: string): { lat: number; lng: number } | null {
  if (!input || input.trim().length === 0) return null;
  const clean = input.trim();

  // 1. Decimal Degree Format: "-7.9826, 112.6308" or "-7.9826 112.6308"
  const decimalRegex = /^\s*([+-]?\d{1,3}(?:\.\d+)?)\s*[,;\s]\s*([+-]?\d{1,3}(?:\.\d+)?)\s*$/;
  const decMatch = clean.match(decimalRegex);
  if (decMatch) {
    let num1 = parseFloat(decMatch[1]);
    let num2 = parseFloat(decMatch[2]);

    // Smart detection if user supplied Longitude first (e.g. 112.6308, -7.9826)
    if (Math.abs(num1) > 90 && Math.abs(num2) <= 90) {
      const temp = num1;
      num1 = num2;
      num2 = temp;
    }

    if (num1 >= -90 && num1 <= 90 && num2 >= -180 && num2 <= 180) {
      return { lat: Number(num1.toFixed(6)), lng: Number(num2.toFixed(6)) };
    }
  }

  // 2. Degrees Minutes Seconds (DMS) Format: 7°58'57"S 112°37'50"E or 7d 58m 57s S, 112d 37m 50s E
  const dmsRegex =
    /(\d{1,3})[°d\s]+(\d{1,2})['m\s]+(\d{1,2}(?:\.\d+)?)["]?\s*([NSns])\s*[,;\s]?\s*(\d{1,3})[°d\s]+(\d{1,2})['m\s]+(\d{1,2}(?:\.\d+)?)["]?\s*([EWew])/;
  const dmsMatch = clean.match(dmsRegex);
  if (dmsMatch) {
    const latDeg = parseFloat(dmsMatch[1]);
    const latMin = parseFloat(dmsMatch[2]);
    const latSec = parseFloat(dmsMatch[3]);
    const latDir = dmsMatch[4].toUpperCase();

    const lngDeg = parseFloat(dmsMatch[5]);
    const lngMin = parseFloat(dmsMatch[6]);
    const lngSec = parseFloat(dmsMatch[7]);
    const lngDir = dmsMatch[8].toUpperCase();

    let lat = latDeg + latMin / 60 + latSec / 3600;
    if (latDir === "S") lat = -lat;

    let lng = lngDeg + lngMin / 60 + lngSec / 3600;
    if (lngDir === "W") lng = -lng;

    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) };
    }
  }

  return null;
}

/**
 * Cari di daftar referensi lokasi lokal untuk respon instan
 */
export function findLocalReference(query: string): LocationReference | null {
  const normalized = query.toLowerCase().trim();
  if (normalized.length < 2) return null;

  for (const loc of POPULAR_LOCATIONS) {
    if (loc.name.toLowerCase() === normalized) return loc;
    if (loc.aliases.some((alias) => normalized.includes(alias) || alias.includes(normalized))) {
      return loc;
    }
  }
  return null;
}

/**
 * Bangun Prompt Sistem Cerdas untuk Asisten AI Modul 1
 */
export function buildModul1SystemPrompt(context?: MapContextLive): string {
  const centerLat = context?.centerLat ?? -6.2088;
  const centerLng = context?.centerLng ?? 106.8456;
  const zoom = context?.zoom ?? 11;
  const basemap = context?.activeBasemap ?? "Google Satelit Hybrid";

  return `Anda adalah "Global Maps Spatial AI", asisten navigasi geospasial pintar untuk Modul 1 (Global Maps Studio).
Tugas Anda adalah membantu pengguna menjelajahi peta dunia, menemukan lokasi, menganalisis koordinat, dan memberikan instruksi interaktif ke peta.

KONTEKS PETA AKTIF SAAT INI:
- Tampilan Basemap: "${basemap}"
- Posisi Kamera Tengah: Latitude ${centerLat}, Longitude ${centerLng} (Zoom: ${zoom})
- Status GPS Pengguna: ${context?.userLocation ? `Lat ${context.userLocation.lat}, Lng ${context.userLocation.lng}` : "Tidak diketahui"}

KEMAMPUAN PERINTAH KONTROL PETA (ACTION TAGS):
Jika pertanyaan/perintah pengguna meminta mencari tempat, berpindah ke lokasi, mengubah basemap, atau mereset tampilan, Anda WAJIB menyertakan SATU tag aksi di akhir respon Anda:

1. Navigasi / Pindah ke Koordinat Tertentu:
   [ACTION:fly_to:latitude,longitude,zoom:Nama_Lokasi]
   Contoh: [ACTION:fly_to:-7.2575,112.7521,13:Surabaya]
   Contoh: [ACTION:fly_to:48.8584,2.2945,16:Menara Eiffel Paris]

2. Ubah Tampilan Gaya Peta (Basemap):
   [ACTION:set_basemap:basemap_id:Nama_Basemap]
   Pilihan ID: "google-hybrid", "google-satellite", "google-streets", "osm", "carto-dark", "carto-voyager", "esri-satellite", "esri-topo", "open-topo"
   Contoh: [ACTION:set_basemap:carto-dark:Mode Gelap Dark Matter]

3. Arahkan ke Lokasi Pengguna (GPS):
   [ACTION:locate_user:current:Lokasi GPS Pengguna]

4. Reset Peta ke Seluruh Indonesia:
   [ACTION:reset_indonesia:-2.5,118.0,5:Kepulauan Indonesia]

ATURAN RESPON:
- Berikan penjelasan ringkas, informatif, dan ramah dalam Bahasa Indonesia (maksimal 2-3 kalimat).
- Sertakan koordinat lintang & bujur serta daya tarik utama tempat tersebut.
- SELALU sertakan [ACTION:...] jika pengguna mencari atau menyebutkan nama tempat spesifik!`;
}
