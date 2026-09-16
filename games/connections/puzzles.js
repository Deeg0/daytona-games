/* Puzzle bank. Each puzzle: four groups in difficulty order
   (yellow → green → blue → purple). Words are unique within a puzzle and
   every puzzle has exactly one valid solution. */
window.PUZZLES = [
  [
    ["Fruits", ["PEAR", "PLUM", "FIG", "MANGO"]],
    ["Tech giants", ["APPLE", "META", "ORACLE", "TESLA"]],
    ["Rivers", ["NILE", "THAMES", "SEINE", "DANUBE"]],
    ["___ball", ["FOOT", "BASKET", "SNOW", "EYE"]],
  ],
  [
    ["Dog breeds", ["BOXER", "POODLE", "BEAGLE", "HUSKY"]],
    ["Things with keys", ["PIANO", "KEYBOARD", "MAP", "LOCK"]],
    ["Chess pieces", ["KING", "QUEEN", "BISHOP", "ROOK"]],
    ["Boxing terms", ["JAB", "HOOK", "ROUND", "BELL"]],
  ],
  [
    ["Weather", ["RAIN", "SNOW", "HAIL", "FOG"]],
    ["Coffee orders", ["LATTE", "MOCHA", "ESPRESSO", "AMERICANO"]],
    ["Candy bars", ["MARS", "TWIX", "SNICKERS", "BOUNTY"]],
    ["Planets", ["VENUS", "SATURN", "JUPITER", "MERCURY"]],
  ],
  [
    ["Body parts", ["ARM", "LEG", "HIP", "TOE"]],
    ["Things you can break", ["FAST", "RECORD", "NEWS", "ICE"]],
    ["Units of time", ["SECOND", "MINUTE", "HOUR", "WEEK"]],
    ["___fish", ["STAR", "CAT", "GOLD", "SWORD"]],
  ],
  [
    ["Colors", ["RED", "BLUE", "PINK", "TEAL"]],
    ["Card games", ["POKER", "BRIDGE", "RUMMY", "HEARTS"]],
    ["Found in a bathroom", ["SINK", "TOWEL", "MIRROR", "TUB"]],
    ["Poker actions", ["FOLD", "CALL", "RAISE", "CHECK"]],
  ],
  [
    ["Vegetables", ["KALE", "LEEK", "BEET", "CORN"]],
    ["Music genres", ["ROCK", "JAZZ", "FOLK", "SOUL"]],
    ["Famous Michaels", ["JORDAN", "JACKSON", "PHELPS", "SCOTT"]],
    ["Dances", ["TANGO", "SALSA", "WALTZ", "SWING"]],
  ],
  [
    ["Farm animals", ["COW", "PIG", "HEN", "GOAT"]],
    ["Social apps", ["SNAP", "TIKTOK", "REDDIT", "DISCORD"]],
    ["___board", ["KEY", "SKATE", "SURF", "DASH"]],
    ["Camera terms", ["LENS", "FLASH", "ZOOM", "FOCUS"]],
  ],
  [
    ["Currencies", ["DOLLAR", "EURO", "YEN", "PESO"]],
    ["Superheroes", ["BATMAN", "FLASH", "THOR", "HULK"]],
    ["3D shapes", ["CUBE", "CONE", "PRISM", "SPHERE"]],
    ["___man", ["SNOW", "SPIDER", "IRON", "SAND"]],
  ],
  [
    ["Pizza toppings", ["OLIVE", "BACON", "ONION", "PEPPER"]],
    ["Shakespeare plays", ["HAMLET", "MACBETH", "OTHELLO", "TEMPEST"]],
    ["Sneaker brands", ["NIKE", "PUMA", "VANS", "REEBOK"]],
    ["Apple products", ["MAC", "IPAD", "WATCH", "AIRPODS"]],
  ],
  [
    ["School subjects", ["MATH", "HISTORY", "ART", "MUSIC"]],
    ["Zodiac signs", ["LEO", "ARIES", "LIBRA", "VIRGO"]],
    ["Streaming services", ["NETFLIX", "HULU", "PEACOCK", "MAX"]],
    ["Kitchen tools", ["WHISK", "LADLE", "SPATULA", "GRATER"]],
  ],
  [
    ["Sports", ["GOLF", "TENNIS", "RUGBY", "POLO"]],
    ["Car brands", ["FORD", "AUDI", "KIA", "TESLA"]],
    ["Seen in the sky", ["SUN", "MOON", "STAR", "CLOUD"]],
    ["___print", ["BLUE", "FOOT", "FINGER", "PAW"]],
  ],
  [
    ["Metals", ["GOLD", "IRON", "TIN", "COPPER"]],
    ["Cooking methods", ["BAKE", "FRY", "GRILL", "ROAST"]],
    ["Desserts", ["PIE", "CAKE", "TART", "FLAN"]],
    ["Golden ___", ["GATE", "RETRIEVER", "RATIO", "HOUR"]],
  ],
  [
    ["Fast food chains", ["SUBWAY", "CHIPOTLE", "POPEYES", "SONIC"]],
    ["Public transit", ["BUS", "TRAM", "FERRY", "METRO"]],
    ["At the beach", ["SAND", "SHELL", "WAVE", "TOWEL"]],
    ["___fall", ["WATER", "NIGHT", "RAIN", "FREE"]],
  ],
  [
    ["Instruments", ["DRUM", "HARP", "FLUTE", "CELLO"]],
    ["Greek letters", ["ALPHA", "BETA", "DELTA", "OMEGA"]],
    ["Halloween", ["GHOST", "WITCH", "PUMPKIN", "BAT"]],
    ["Jackets", ["BOMBER", "DENIM", "PUFFER", "BLAZER"]],
  ],
  [
    ["Ice cream flavors", ["VANILLA", "MINT", "PISTACHIO", "CHERRY"]],
    ["Programming languages", ["PYTHON", "RUBY", "SWIFT", "RUST"]],
    ["Things you can crack", ["CODE", "EGG", "JOKE", "KNUCKLE"]],
    ["One-name pop stars", ["DRAKE", "ADELE", "RIHANNA", "BEYONCE"]],
  ],
  [
    ["In a wallet", ["CASH", "CARD", "ID", "RECEIPT"]],
    ["Poker hands", ["FLUSH", "PAIR", "STRAIGHT", "TRIPS"]],
    ["Inside Out emotions", ["JOY", "FEAR", "ANGER", "DISGUST"]],
    ["___way", ["HIGH", "SUB", "DRIVE", "RUN"]],
  ],
  [
    ["Breakfast foods", ["BAGEL", "WAFFLE", "OMELET", "CEREAL"]],
    ["NBA teams", ["HEAT", "JAZZ", "MAGIC", "THUNDER"]],
    ["Sticky things", ["GLUE", "TAPE", "HONEY", "GUM"]],
    ["___ball", ["FIRE", "PIN", "MEAT", "ODD"]],
  ],
  [
    ["Parts of a story", ["PLOT", "THEME", "SETTING", "CLIMAX"]],
    ["Landforms", ["HILL", "VALLEY", "PLAIN", "CLIFF"]],
    ["Airplane words", ["WING", "PILOT", "CABIN", "AISLE"]],
    ["Bee sounds & actions", ["BUZZ", "STING", "HUM", "SWARM"]],
  ],
  [
    ["Cheeses", ["BRIE", "FETA", "GOUDA", "SWISS"]],
    ["Fonts", ["ARIAL", "CALIBRI", "GEORGIA", "VERDANA"]],
    ["US states", ["TEXAS", "OHIO", "MAINE", "UTAH"]],
    ["Things you can run", ["MILE", "RACE", "ERRAND", "BUSINESS"]],
  ],
  [
    ["Sea creatures", ["CRAB", "SEAL", "SQUID", "SHARK"]],
    ["Breads", ["RYE", "PITA", "NAAN", "SOURDOUGH"]],
    ["Hairstyles", ["BUN", "BOB", "BRAID", "MULLET"]],
    ["Golf scores", ["PAR", "EAGLE", "BIRDIE", "BOGEY"]],
  ],
  [
    ["Citrus fruits", ["LEMON", "LIME", "ORANGE", "GRAPEFRUIT"]],
    ["Things that are cold", ["ICE", "SNOW", "FREEZER", "WINTER"]],
    ["Web browsers", ["CHROME", "SAFARI", "EDGE", "OPERA"]],
    ["___ blue", ["NAVY", "ROYAL", "SKY", "BABY"]],
  ],
  [
    ["Pets", ["CAT", "DOG", "HAMSTER", "PARROT"]],
    ["Board games", ["CHESS", "RISK", "CLUE", "SORRY"]],
    ["Things with teeth", ["COMB", "SAW", "ZIPPER", "GEAR"]],
    ["Apology words", ["OOPS", "PARDON", "MY BAD", "EXCUSE ME"]],
  ],
  [
    ["Shoes", ["BOOT", "LOAFER", "SANDAL", "CLOG"]],
    ["Car parts", ["TRUNK", "HOOD", "BUMPER", "WIPER"]],
    ["Elephant features", ["TUSK", "EAR", "TAIL", "HIDE"]],
    ["Things you can hail", ["TAXI", "CAB", "HERO", "KING"]],
  ],
  [
    ["Soft drinks", ["COKE", "SPRITE", "FANTA", "PEPSI"]],
    ["Mythical creatures", ["DRAGON", "UNICORN", "GRIFFIN", "PHOENIX"]],
    ["Things in a toolbox", ["HAMMER", "WRENCH", "PLIERS", "LEVEL"]],
    ["Video game consoles", ["SWITCH", "XBOX", "WII", "GAMECUBE"]],
  ],
];
