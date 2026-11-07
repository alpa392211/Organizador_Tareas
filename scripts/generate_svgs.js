const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.resolve(__dirname, '../assets');

const svgs = {
    'itesm.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <linearGradient id="itesm-blue" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0039A6"/>
      <stop offset="100%" stop-color="#001F5C"/>
    </linearGradient>
    <linearGradient id="itesm-flame" x1="0%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" stop-color="#F59E0B"/>
      <stop offset="100%" stop-color="#EF4444"/>
    </linearGradient>
  </defs>
  <rect x="12" y="12" width="176" height="176" rx="36" fill="url(#itesm-blue)" stroke="#3B82F6" stroke-width="3"/>
  <circle cx="100" cy="100" r="72" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-dasharray="3 3"/>
  <!-- Antorcha del saber -->
  <path d="M92 110 L94 145 H106 L108 110 Z" fill="#D4AF37" stroke="#FFFFFF" stroke-width="1.5"/>
  <path d="M86 108 H114 L110 114 H90 Z" fill="#F59E0B"/>
  <!-- Llamas de la antorcha -->
  <path d="M100 62 C88 78 88 92 96 106 C102 96 106 90 100 84 C110 92 112 100 106 106 C116 94 114 80 100 62 Z" fill="url(#itesm-flame)"/>
  <circle cx="100" cy="88" r="4" fill="#FDE047"/>
  <!-- Libro abierto de sabiduría -->
  <path d="M60 148 C75 142 90 144 100 148 C110 142 125 142 140 148 V156 C125 150 110 150 100 156 C90 150 75 150 60 156 Z" fill="#FFFFFF"/>
  <text x="100" y="52" fill="#FFFFFF" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="12" font-weight="900" text-anchor="middle" letter-spacing="3">TEC</text>
  <text x="100" y="174" fill="#93C5FD" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="8.5" font-weight="700" text-anchor="middle" letter-spacing="1">MONTERREY</text>
</svg>`,

    'udeg.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <linearGradient id="udeg-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#003366"/>
      <stop offset="100%" stop-color="#001A33"/>
    </linearGradient>
  </defs>
  <rect x="12" y="12" width="176" height="176" rx="36" fill="url(#udeg-bg)" stroke="#C59B27" stroke-width="3"/>
  <!-- Escudo heráldico UdeG -->
  <path d="M60 48 H140 V105 C140 135 100 155 100 155 C100 155 60 135 60 105 Z" fill="#002244" stroke="#C59B27" stroke-width="3"/>
  <!-- Cruz y leones heráldicos -->
  <line x1="100" y1="52" x2="100" y2="148" stroke="#C59B27" stroke-width="2"/>
  <line x1="64" y1="95" x2="136" y2="95" stroke="#C59B27" stroke-width="2"/>
  <!-- Cuadrantes: libro y cruz roja -->
  <path d="M72 68 H88 V82 H72 Z" fill="#FFFFFF" opacity="0.9"/>
  <path d="M116 68 H124 V82 H116 Z M112 72 H128 V78 H112 Z" fill="#DC2626"/>
  <path d="M74 108 L86 122 M86 108 L74 122" stroke="#C59B27" stroke-width="2.5" stroke-linecap="round"/>
  <circle cx="120" cy="115" r="7" fill="#C59B27"/>
  <!-- Texto institucional -->
  <text x="100" y="40" fill="#C59B27" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="13" font-weight="900" text-anchor="middle" letter-spacing="2">UDEG</text>
  <text x="100" y="174" fill="#F3F4F6" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="8" font-weight="700" text-anchor="middle" letter-spacing="1">PIENSA Y TRABAJA</text>
</svg>`,

    'uanl.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <linearGradient id="uanl-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#003B71"/>
      <stop offset="100%" stop-color="#001E3D"/>
    </linearGradient>
  </defs>
  <rect x="12" y="12" width="176" height="176" rx="36" fill="url(#uanl-bg)" stroke="#F1A80A" stroke-width="3"/>
  <!-- Flama de la Verdad UANL -->
  <path d="M100 45 C78 72 75 92 86 115 C92 102 98 96 100 86 C105 98 114 105 110 116 C125 96 122 72 100 45 Z" fill="#F1A80A"/>
  <path d="M100 65 C90 82 90 94 96 108 C100 100 104 96 101 88 C106 96 110 102 106 110 C114 98 112 82 100 65 Z" fill="#FFFFFF"/>
  <!-- Pebetero / Base -->
  <path d="M72 120 H128 L122 134 H78 Z" fill="#D97706" stroke="#FFFFFF" stroke-width="1.5"/>
  <rect x="86" y="134" width="28" height="14" fill="#F1A80A" rx="2"/>
  <!-- Letras UANL -->
  <text x="100" y="38" fill="#F1A80A" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="14" font-weight="900" text-anchor="middle" letter-spacing="3">UANL</text>
  <text x="100" y="168" fill="#FCD34D" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="7.5" font-weight="700" text-anchor="middle" letter-spacing="1">ALERE FLAMMAM VERITATIS</text>
</svg>`,

    'unal.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <linearGradient id="unal-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#005522"/>
      <stop offset="100%" stop-color="#002B11"/>
    </linearGradient>
  </defs>
  <rect x="12" y="12" width="176" height="176" rx="36" fill="url(#unal-bg)" stroke="#22C55E" stroke-width="3"/>
  <!-- Emblema Geométrico UNAL -->
  <g transform="translate(100, 96)">
    <!-- Rombo exterior -->
    <rect x="-48" y="-48" width="96" height="96" fill="none" stroke="#FFFFFF" stroke-width="3.5" transform="rotate(45)"/>
    <!-- Escudo central con cóndor y sol -->
    <circle cx="0" cy="-6" r="24" fill="#15803D" stroke="#FFFFFF" stroke-width="2"/>
    <path d="M-18 -6 Q0 -22 18 -6 Q8 -2 0 6 Q-8 -2 -18 -6 Z" fill="#FFFFFF"/>
    <circle cx="0" cy="-6" r="5" fill="#EAB308"/>
    <!-- Libro base -->
    <path d="M-22 16 Q0 12 22 16 L20 24 Q0 20 -20 24 Z" fill="#FFFFFF"/>
  </g>
  <text x="100" y="38" fill="#FFFFFF" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="14" font-weight="900" text-anchor="middle" letter-spacing="3">UNAL</text>
  <text x="100" y="174" fill="#86EFAC" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="8.5" font-weight="700" text-anchor="middle" letter-spacing="1">COLOMBIA</text>
</svg>`,

    'uniandes.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <linearGradient id="uniandes-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1A1A1A"/>
      <stop offset="100%" stop-color="#0A0A0A"/>
    </linearGradient>
  </defs>
  <rect x="12" y="12" width="176" height="176" rx="36" fill="url(#uniandes-bg)" stroke="#FDB813" stroke-width="3"/>
  <!-- Círculo dorado con Séneca / Sabiduría -->
  <circle cx="100" cy="95" r="50" fill="#FDB813" stroke="#FFFFFF" stroke-width="2"/>
  <!-- Perfil clásico del filósofo Séneca -->
  <path d="M92 65 C96 62 108 62 112 68 C115 72 112 78 116 80 C120 82 122 86 118 89 C114 91 118 94 116 98 C114 102 108 106 102 108 C96 110 90 120 86 124 H76 C78 116 82 108 84 100 C80 94 80 84 84 76 C86 70 88 66 92 65 Z" fill="#1A1A1A"/>
  <!-- Cordillera de los Andes detrás -->
  <path d="M56 125 L75 105 L92 120 L115 95 L144 125 Z" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linejoin="round"/>
  <text x="100" y="38" fill="#FDB813" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="13" font-weight="900" text-anchor="middle" letter-spacing="2">UNIANDES</text>
  <text x="100" y="172" fill="#FFFFFF" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="8.5" font-weight="700" text-anchor="middle" letter-spacing="1">UNIVERSIDAD DE LOS ANDES</text>
</svg>`,

    'udea.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <linearGradient id="udea-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0F6938"/>
      <stop offset="100%" stop-color="#073B1F"/>
    </linearGradient>
  </defs>
  <rect x="12" y="12" width="176" height="176" rx="36" fill="url(#udea-bg)" stroke="#FFFFFF" stroke-width="3"/>
  <!-- Escudo oval UdeA -->
  <ellipse cx="100" cy="98" rx="46" ry="54" fill="#0A4C27" stroke="#FFFFFF" stroke-width="2.5"/>
  <!-- Estrella radiante de sabiduría -->
  <polygon points="100,56 103,68 115,68 105,75 109,87 100,80 91,87 95,75 85,68 97,68" fill="#FACC15"/>
  <!-- Libro abierto y corona de laurel -->
  <path d="M72 108 Q100 100 100 114 Q100 100 128 108 L126 128 Q100 120 100 132 Q100 120 74 128 Z" fill="#FFFFFF"/>
  <line x1="100" y1="114" x2="100" y2="132" stroke="#0F6938" stroke-width="2"/>
  <text x="100" y="38" fill="#FFFFFF" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="14" font-weight="900" text-anchor="middle" letter-spacing="3">UDEA</text>
  <text x="100" y="172" fill="#86EFAC" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="8" font-weight="700" text-anchor="middle" letter-spacing="1">ANTIOQUIA • 1803</text>
</svg>`,

    'javeriana.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <linearGradient id="jav-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#003087"/>
      <stop offset="100%" stop-color="#001C52"/>
    </linearGradient>
  </defs>
  <rect x="12" y="12" width="176" height="176" rx="36" fill="url(#jav-bg)" stroke="#FCC200" stroke-width="3"/>
  <!-- Escudo Javeriano -->
  <path d="M62 50 H138 V105 C138 135 100 154 100 154 C100 154 62 135 62 105 Z" fill="#002366" stroke="#FCC200" stroke-width="2.5"/>
  <!-- Radiante sol jesuita IHS -->
  <circle cx="100" cy="85" r="22" fill="#FCC200"/>
  <!-- Cruz y monograma central -->
  <path d="M100 70 V92 M90 77 H110" stroke="#003087" stroke-width="3" stroke-linecap="round"/>
  <circle cx="100" cy="120" r="10" fill="none" stroke="#FFFFFF" stroke-width="2"/>
  <path d="M96 116 L104 124 M104 116 L96 124" stroke="#FFFFFF" stroke-width="2"/>
  <!-- Lises doradas -->
  <circle cx="78" cy="70" r="3" fill="#FCC200"/>
  <circle cx="122" cy="70" r="3" fill="#FCC200"/>
  <text x="100" y="40" fill="#FCC200" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="12" font-weight="900" text-anchor="middle" letter-spacing="2">JAVERIANA</text>
  <text x="100" y="174" fill="#FFFFFF" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="8.5" font-weight="700" text-anchor="middle" letter-spacing="1">PONTIFICIA • 1623</text>
</svg>`,

    'uba.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <linearGradient id="uba-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#003A70"/>
      <stop offset="100%" stop-color="#001F3D"/>
    </linearGradient>
  </defs>
  <rect x="12" y="12" width="176" height="176" rx="36" fill="url(#uba-bg)" stroke="#75AADB" stroke-width="3"/>
  <!-- Sol de Mayo UBA -->
  <circle cx="100" cy="92" r="26" fill="#F59E0B" stroke="#FFFFFF" stroke-width="1.5"/>
  <!-- Rayos flamígeros del Sol de Mayo -->
  <g stroke="#F59E0B" stroke-width="3" stroke-linecap="round">
    <line x1="100" y1="56" x2="100" y2="62"/>
    <line x1="100" y1="122" x2="100" y2="128"/>
    <line x1="64" y1="92" x2="70" y2="92"/>
    <line x1="130" y1="92" x2="136" y2="92"/>
    <line x1="75" y1="67" x2="80" y2="72"/>
    <line x1="125" y1="117" x2="120" y2="112"/>
    <line x1="75" y1="117" x2="80" y2="112"/>
    <line x1="125" y1="67" x2="120" y2="72"/>
  </g>
  <!-- Rostro sereno del Sol -->
  <circle cx="93" cy="88" r="2" fill="#78350F"/>
  <circle cx="107" cy="88" r="2" fill="#78350F"/>
  <path d="M94 99 Q100 104 106 99" stroke="#78350F" stroke-width="2" fill="none"/>
  <!-- Libro abierto UBA -->
  <path d="M65 136 C80 130 95 132 100 136 C105 132 120 130 135 136 V145 C120 139 105 141 100 145 C95 141 80 139 65 145 Z" fill="#FFFFFF"/>
  <text x="100" y="42" fill="#FFFFFF" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="15" font-weight="900" text-anchor="middle" letter-spacing="3">UBA</text>
  <text x="100" y="172" fill="#93C5FD" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="8.5" font-weight="700" text-anchor="middle" letter-spacing="1">BUENOS AIRES • 1821</text>
</svg>`,

    'unlp.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <linearGradient id="unlp-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#004F71"/>
      <stop offset="100%" stop-color="#002A3D"/>
    </linearGradient>
  </defs>
  <rect x="12" y="12" width="176" height="176" rx="36" fill="url(#unlp-bg)" stroke="#94A3B8" stroke-width="3"/>
  <!-- Estrella de La Plata y roble de sabiduría -->
  <circle cx="100" cy="94" r="50" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-dasharray="4 4"/>
  <polygon points="100,54 112,82 142,82 118,100 127,128 100,110 73,128 82,100 58,82 88,82" fill="#FFFFFF" opacity="0.95"/>
  <circle cx="100" cy="94" r="14" fill="#004F71" stroke="#F1F5F9" stroke-width="2"/>
  <path d="M96 90 L100 84 L104 90 L100 102 Z" fill="#38BDF8"/>
  <!-- Hojas de roble estilizadas -->
  <path d="M68 140 C80 134 95 135 100 142 C105 135 120 134 132 140" fill="none" stroke="#94A3B8" stroke-width="3" stroke-linecap="round"/>
  <text x="100" y="40" fill="#FFFFFF" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="14" font-weight="900" text-anchor="middle" letter-spacing="3">UNLP</text>
  <text x="100" y="172" fill="#BAE6FD" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="8.5" font-weight="700" text-anchor="middle" letter-spacing="1">POR LA CIENCIA Y LA PATRIA</text>
</svg>`,

    'unc.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <linearGradient id="unc-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#7A1C20"/>
      <stop offset="100%" stop-color="#450D10"/>
    </linearGradient>
  </defs>
  <rect x="12" y="12" width="176" height="176" rx="36" fill="url(#unc-bg)" stroke="#B8860B" stroke-width="3"/>
  <!-- Escudo jesuita colonial UNC -->
  <path d="M64 52 H136 V105 C136 135 100 152 100 152 C100 152 64 135 64 105 Z" fill="#581316" stroke="#B8860B" stroke-width="2.5"/>
  <!-- Cruz y halo de Córdoba -->
  <path d="M100 66 V115 M86 78 H114" stroke="#FBBF24" stroke-width="4" stroke-linecap="round"/>
  <circle cx="100" cy="78" r="16" fill="none" stroke="#FBBF24" stroke-width="1.5" stroke-dasharray="2 2"/>
  <!-- Libro abierto y lema -->
  <path d="M76 122 C88 118 100 120 100 126 C100 120 112 118 124 122 V132 C112 128 100 130 100 136 C100 130 88 128 76 132 Z" fill="#FFFFFF"/>
  <text x="100" y="42" fill="#FBBF24" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="14" font-weight="900" text-anchor="middle" letter-spacing="3">UNC</text>
  <text x="100" y="174" fill="#FDE68A" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="8.5" font-weight="700" text-anchor="middle" letter-spacing="1">CÓRDOBA • 1613</text>
</svg>`,

    'utn.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <linearGradient id="utn-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#002C6C"/>
      <stop offset="100%" stop-color="#001438"/>
    </linearGradient>
  </defs>
  <rect x="12" y="12" width="176" height="176" rx="36" fill="url(#utn-bg)" stroke="#0070BA" stroke-width="3"/>
  <!-- Engranaje tecnológico central -->
  <g transform="translate(100, 94)">
    <circle cx="0" cy="0" r="42" fill="#0070BA"/>
    <!-- Dientes del engranaje -->
    <path d="M-8 -48 H8 V-38 H-8 Z M-8 38 H8 V48 H-8 Z M-48 -8 V8 H-38 V-8 Z M38 -8 V8 H48 V-8 Z" fill="#0070BA"/>
    <g transform="rotate(45)">
      <path d="M-8 -48 H8 V-38 H-8 Z M-8 38 H8 V48 H-8 Z M-48 -8 V8 H-38 V-8 Z M38 -8 V8 H48 V-8 Z" fill="#0070BA"/>
    </g>
    <circle cx="0" cy="0" r="28" fill="#002C6C" stroke="#FFFFFF" stroke-width="2"/>
    <!-- Rayo de energía e ingenio -->
    <polygon points="4,-18 -10,0 -2,0 -6,18 12,-2 2,-2" fill="#FACC15"/>
  </g>
  <text x="100" y="40" fill="#FFFFFF" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="15" font-weight="900" text-anchor="middle" letter-spacing="3">UTN</text>
  <text x="100" y="172" fill="#7DD3FC" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="8" font-weight="700" text-anchor="middle" letter-spacing="1">TECNOLÓGICA NACIONAL</text>
</svg>`,

    'uchile.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <linearGradient id="uchile-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#002A68"/>
      <stop offset="100%" stop-color="#001438"/>
    </linearGradient>
  </defs>
  <rect x="12" y="12" width="176" height="176" rx="36" fill="url(#uchile-bg)" stroke="#E31B23" stroke-width="3"/>
  <!-- Escudo de Chile / U. de Chile -->
  <path d="M64 52 H136 V96 C136 128 100 148 100 148 C100 148 64 128 64 96 Z" fill="#001F4D" stroke="#FFFFFF" stroke-width="2.5"/>
  <!-- Mitad azul y mitad roja con estrella -->
  <path d="M66 96 H134 V96 C134 126 100 145 100 145 C100 145 66 126 66 96 Z" fill="#E31B23"/>
  <!-- Estrella solitaria de Chile -->
  <polygon points="100,64 105,78 120,78 108,87 112,101 100,92 88,101 92,87 80,78 95,78" fill="#FFFFFF"/>
  <text x="100" y="40" fill="#FFFFFF" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="13" font-weight="900" text-anchor="middle" letter-spacing="2">U. DE CHILE</text>
  <text x="100" y="172" fill="#FCA5A5" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="8.5" font-weight="700" text-anchor="middle" letter-spacing="1">TODO POR LA PATRIA</text>
</svg>`,

    'uc_cl.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <linearGradient id="uccl-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#003366"/>
      <stop offset="100%" stop-color="#001A38"/>
    </linearGradient>
  </defs>
  <rect x="12" y="12" width="176" height="176" rx="36" fill="url(#uccl-bg)" stroke="#D99B00" stroke-width="3"/>
  <!-- Escudo UC Chile -->
  <path d="M64 52 H136 V100 C136 130 100 150 100 150 C100 150 64 130 64 100 Z" fill="#002244" stroke="#D99B00" stroke-width="2.5"/>
  <!-- Cruz central roja bordeada en blanco -->
  <path d="M92 56 H108 V140 H92 Z" fill="#DC2626" stroke="#FFFFFF" stroke-width="1.5"/>
  <path d="M68 84 H132 V98 H68 Z" fill="#DC2626" stroke="#FFFFFF" stroke-width="1.5"/>
  <!-- Llaves cruzadas pontificias en oro -->
  <circle cx="82" cy="72" r="5" fill="#D99B00"/>
  <circle cx="118" cy="72" r="5" fill="#D99B00"/>
  <text x="100" y="40" fill="#D99B00" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="14" font-weight="900" text-anchor="middle" letter-spacing="2">UC CHILE</text>
  <text x="100" y="172" fill="#FFFFFF" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="8" font-weight="700" text-anchor="middle" letter-spacing="1">PONTIFICIA • 1888</text>
</svg>`,

    'usach.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <linearGradient id="usach-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#002F6C"/>
      <stop offset="100%" stop-color="#001838"/>
    </linearGradient>
  </defs>
  <rect x="12" y="12" width="176" height="176" rx="36" fill="url(#usach-bg)" stroke="#E05A10" stroke-width="3"/>
  <!-- Sol naciente y rueda industrial de la USACH -->
  <circle cx="100" cy="94" r="44" fill="#E05A10" stroke="#FFFFFF" stroke-width="2"/>
  <!-- Sol amarillo -->
  <path d="M70 94 A30 30 0 0 1 130 94 Z" fill="#FACC15"/>
  <!-- Engranaje base -->
  <path d="M60 94 H140 V106 C140 124 100 134 100 134 C100 134 60 124 60 106 Z" fill="#002F6C"/>
  <line x1="80" y1="102" x2="80" y2="114" stroke="#FFFFFF" stroke-width="3"/>
  <line x1="100" y1="104" x2="100" y2="120" stroke="#FFFFFF" stroke-width="3"/>
  <line x1="120" y1="102" x2="120" y2="114" stroke="#FFFFFF" stroke-width="3"/>
  <text x="100" y="40" fill="#E05A10" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="14" font-weight="900" text-anchor="middle" letter-spacing="3">USACH</text>
  <text x="100" y="172" fill="#FFFFFF" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="8.5" font-weight="700" text-anchor="middle" letter-spacing="1">LABOR ET SCIENTIA</text>
</svg>`,

    'udec.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <linearGradient id="udec-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#002B49"/>
      <stop offset="100%" stop-color="#001424"/>
    </linearGradient>
  </defs>
  <rect x="12" y="12" width="176" height="176" rx="36" fill="url(#udec-bg)" stroke="#F2A900" stroke-width="3"/>
  <!-- El emblemático Campanil de la UdeC -->
  <g fill="#FFFFFF">
    <rect x="94" y="62" width="12" height="68"/>
    <polygon points="100,48 91,62 109,62"/>
    <rect x="88" y="130" width="24" height="12"/>
    <circle cx="100" cy="74" r="3.5" fill="#002B49"/>
  </g>
  <!-- Rayos dorados de sabiduría alrededor del campanil -->
  <line x1="72" y1="68" x2="82" y2="76" stroke="#F2A900" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="128" y1="68" x2="118" y2="76" stroke="#F2A900" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="68" y1="92" x2="80" y2="92" stroke="#F2A900" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="132" y1="92" x2="120" y2="92" stroke="#F2A900" stroke-width="2.5" stroke-linecap="round"/>
  <text x="100" y="38" fill="#F2A900" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="14" font-weight="900" text-anchor="middle" letter-spacing="3">UDEC</text>
  <text x="100" y="172" fill="#FFFFFF" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="8" font-weight="700" text-anchor="middle" letter-spacing="1">CONCEPCIÓN • 1919</text>
</svg>`,

    'unmsm.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <linearGradient id="unmsm-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#781D22"/>
      <stop offset="100%" stop-color="#3D0B0E"/>
    </linearGradient>
  </defs>
  <rect x="12" y="12" width="176" height="176" rx="36" fill="url(#unmsm-bg)" stroke="#D4AF37" stroke-width="3"/>
  <!-- León Alado de San Marcos con Halo -->
  <circle cx="100" cy="92" r="48" fill="#521013" stroke="#D4AF37" stroke-width="2"/>
  <!-- Corona Real Imperial -->
  <path d="M84 56 L88 64 L100 58 L112 64 L116 56 L112 68 H88 Z" fill="#D4AF37"/>
  <!-- Silueta heráldica del León de San Marcos -->
  <path d="M82 108 C80 94 90 84 100 84 C110 84 118 92 118 102 C118 112 110 118 100 118 C90 118 82 114 82 108 Z" fill="#D4AF37"/>
  <path d="M102 78 C115 75 128 85 130 98 Q118 96 112 104 Z" fill="#FFFFFF" opacity="0.9"/>
  <!-- Libro abierto con cruz -->
  <rect x="88" y="112" width="24" height="14" rx="2" fill="#FFFFFF"/>
  <line x1="100" y1="112" x2="100" y2="126" stroke="#781D22" stroke-width="1.5"/>
  <text x="100" y="38" fill="#D4AF37" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="13" font-weight="900" text-anchor="middle" letter-spacing="2">UNMSM</text>
  <text x="100" y="172" fill="#FDE68A" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="8" font-weight="700" text-anchor="middle" letter-spacing="1">DECANA DE AMÉRICA • 1551</text>
</svg>`,

    'pucp.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <linearGradient id="pucp-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#002855"/>
      <stop offset="100%" stop-color="#001229"/>
    </linearGradient>
  </defs>
  <rect x="12" y="12" width="176" height="176" rx="36" fill="url(#pucp-bg)" stroke="#6BA4B8" stroke-width="3"/>
  <!-- Escudo PUCP -->
  <path d="M64 52 H136 V102 C136 132 100 150 100 150 C100 150 64 132 64 102 Z" fill="#001D40" stroke="#6BA4B8" stroke-width="2.5"/>
  <!-- Cruz Latina radiante -->
  <path d="M95 64 H105 V128 H95 Z" fill="#FFFFFF"/>
  <path d="M80 80 H120 V90 H80 Z" fill="#FFFFFF"/>
  <circle cx="100" cy="85" r="5" fill="#6BA4B8"/>
  <!-- Estrellas y resplandor -->
  <polygon points="76,66 78,71 83,71 79,74 80,79 76,76 72,79 73,74 69,71 74,71" fill="#FBBF24"/>
  <polygon points="124,66 126,71 131,71 127,74 128,79 124,76 120,79 121,74 117,71 122,71" fill="#FBBF24"/>
  <text x="100" y="40" fill="#FFFFFF" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="14" font-weight="900" text-anchor="middle" letter-spacing="3">PUCP</text>
  <text x="100" y="172" fill="#BAE6FD" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="7.5" font-weight="700" text-anchor="middle" letter-spacing="1">ET LUX IN TENEBRIS LUCET</text>
</svg>`,

    'uni.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <linearGradient id="uni-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#800000"/>
      <stop offset="100%" stop-color="#420000"/>
    </linearGradient>
  </defs>
  <rect x="12" y="12" width="176" height="176" rx="36" fill="url(#uni-bg)" stroke="#FFFFFF" stroke-width="3"/>
  <!-- Triángulo de la Ingeniería UNI -->
  <polygon points="100,50 148,136 52,136" fill="#5E0000" stroke="#FFFFFF" stroke-width="3"/>
  <!-- Antorcha y engranaje del conocimiento técnico -->
  <circle cx="100" cy="104" r="18" fill="none" stroke="#F59E0B" stroke-width="3"/>
  <path d="M96 92 L98 120 H102 L104 92 Z" fill="#FFFFFF"/>
  <polygon points="100,78 94,92 106,92" fill="#F59E0B"/>
  <!-- Texto UNI -->
  <text x="100" y="38" fill="#FFFFFF" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="15" font-weight="900" text-anchor="middle" letter-spacing="3">UNI</text>
  <text x="100" y="168" fill="#FCA5A5" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="8" font-weight="700" text-anchor="middle" letter-spacing="1">INGENIERÍA • PERÚ</text>
</svg>`,

    'ucm.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <linearGradient id="ucm-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#9E1B32"/>
      <stop offset="100%" stop-color="#540C19"/>
    </linearGradient>
  </defs>
  <rect x="12" y="12" width="176" height="176" rx="36" fill="url(#ucm-bg)" stroke="#D4AF37" stroke-width="3"/>
  <!-- Cisne de Cisneros UCM -->
  <circle cx="100" cy="94" r="48" fill="#6E1222" stroke="#D4AF37" stroke-width="2"/>
  <!-- Cisne estilizado en blanco -->
  <path d="M82 110 C86 98 94 92 98 84 C100 80 97 76 93 76 C91 76 89 78 87 79 C88 74 93 70 98 70 C106 70 110 77 106 86 C102 94 94 100 92 108 H120 C118 116 108 122 96 122 C84 122 78 118 82 110 Z" fill="#FFFFFF"/>
  <!-- Estrellas de sabiduría -->
  <circle cx="72" cy="74" r="2.5" fill="#D4AF37"/>
  <circle cx="128" cy="74" r="2.5" fill="#D4AF37"/>
  <circle cx="100" cy="56" r="3" fill="#D4AF37"/>
  <text x="100" y="38" fill="#D4AF37" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="14" font-weight="900" text-anchor="middle" letter-spacing="3">UCM</text>
  <text x="100" y="172" fill="#FDE68A" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="8" font-weight="700" text-anchor="middle" letter-spacing="1">COMPLUTENSE DE MADRID</text>
</svg>`,

    'ub.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <linearGradient id="ub-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#003865"/>
      <stop offset="100%" stop-color="#001C33"/>
    </linearGradient>
  </defs>
  <rect x="12" y="12" width="176" height="176" rx="36" fill="url(#ub-bg)" stroke="#FFD100" stroke-width="3"/>
  <!-- Escudo UB con Senyera y Cruz -->
  <path d="M64 52 H136 V102 C136 132 100 150 100 150 C100 150 64 132 64 102 Z" fill="#002240" stroke="#FFD100" stroke-width="2.5"/>
  <!-- Barras rojas y amarillas de la Senyera -->
  <g transform="translate(74, 62)">
    <rect x="0" y="0" width="52" height="42" fill="#FFD100"/>
    <rect x="7" y="0" width="6" height="42" fill="#DC2626"/>
    <rect x="20" y="0" width="6" height="42" fill="#DC2626"/>
    <rect x="33" y="0" width="6" height="42" fill="#DC2626"/>
    <rect x="46" y="0" width="6" height="42" fill="#DC2626"/>
  </g>
  <!-- Libro abierto base -->
  <path d="M72 115 C85 110 100 112 100 118 C100 112 115 110 128 115 V125 C115 120 100 122 100 128 C100 122 85 120 72 125 Z" fill="#FFFFFF"/>
  <text x="100" y="40" fill="#FFD100" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="15" font-weight="900" text-anchor="middle" letter-spacing="3">UB</text>
  <text x="100" y="172" fill="#FFFFFF" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="8.5" font-weight="700" text-anchor="middle" letter-spacing="1">UNIVERSITAT DE BARCELONA</text>
</svg>`,

    'uam_es.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <linearGradient id="uames-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#004B49"/>
      <stop offset="100%" stop-color="#002423"/>
    </linearGradient>
  </defs>
  <rect x="12" y="12" width="176" height="176" rx="36" fill="url(#uames-bg)" stroke="#5EEAD4" stroke-width="3"/>
  <!-- Emblema UAM Madrid -->
  <circle cx="100" cy="94" r="48" fill="#003533" stroke="#FFFFFF" stroke-width="2"/>
  <!-- Madroño / Árbol de la ciencia con estrellas -->
  <path d="M96 90 L96 126 H104 L104 90 Z" fill="#8A9EA7"/>
  <circle cx="100" cy="80" r="22" fill="#14B8A6"/>
  <circle cx="86" cy="84" r="14" fill="#0D9488"/>
  <circle cx="114" cy="84" r="14" fill="#0D9488"/>
  <!-- Estrellas de Madrid -->
  <polygon points="100,50 102,54 106,54 103,57 104,61 100,58 96,61 97,57 94,54 98,54" fill="#FACC15"/>
  <text x="100" y="38" fill="#5EEAD4" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="13" font-weight="900" text-anchor="middle" letter-spacing="2">UAM</text>
  <text x="100" y="172" fill="#CCFBF1" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="8.5" font-weight="700" text-anchor="middle" letter-spacing="1">AUTÓNOMA DE MADRID</text>
</svg>`,

    'upv.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <linearGradient id="upv-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#D32F2F"/>
      <stop offset="100%" stop-color="#7F0000"/>
    </linearGradient>
  </defs>
  <rect x="12" y="12" width="176" height="176" rx="36" fill="url(#upv-bg)" stroke="#FFFFFF" stroke-width="3"/>
  <!-- Cuadrado / Rombo geométrico UPV -->
  <g transform="translate(100, 94)">
    <rect x="-42" y="-42" width="84" height="84" fill="#1C1C1C" stroke="#FFFFFF" stroke-width="2.5" rx="8"/>
    <!-- Bandas de la senyera estilizadas con tecnología -->
    <rect x="-28" y="-28" width="56" height="8" fill="#FACC15"/>
    <rect x="-28" y="-12" width="56" height="8" fill="#DC2626"/>
    <rect x="-28" y="4" width="56" height="8" fill="#FACC15"/>
    <rect x="-28" y="20" width="56" height="8" fill="#DC2626"/>
  </g>
  <text x="100" y="40" fill="#FFFFFF" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="15" font-weight="900" text-anchor="middle" letter-spacing="3">UPV</text>
  <text x="100" y="172" fill="#FEE2E2" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="8" font-weight="700" text-anchor="middle" letter-spacing="1">POLITÈCNICA DE VALÈNCIA</text>
</svg>`,

    'udelar.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <linearGradient id="udelar-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#002B5C"/>
      <stop offset="100%" stop-color="#00142B"/>
    </linearGradient>
  </defs>
  <rect x="12" y="12" width="176" height="176" rx="36" fill="url(#udelar-bg)" stroke="#FFD700" stroke-width="3"/>
  <!-- Sol de Mayo de Uruguay -->
  <circle cx="100" cy="92" r="26" fill="#FFD700" stroke="#FFFFFF" stroke-width="1.5"/>
  <g stroke="#FFD700" stroke-width="3" stroke-linecap="round">
    <line x1="100" y1="56" x2="100" y2="62"/>
    <line x1="100" y1="122" x2="100" y2="128"/>
    <line x1="64" y1="92" x2="70" y2="92"/>
    <line x1="130" y1="92" x2="136" y2="92"/>
    <line x1="75" y1="67" x2="80" y2="72"/>
    <line x1="125" y1="117" x2="120" y2="112"/>
    <line x1="75" y1="117" x2="80" y2="112"/>
    <line x1="125" y1="67" x2="120" y2="72"/>
  </g>
  <!-- Libro abierto de la República -->
  <path d="M68 134 C82 128 96 130 100 135 C104 130 118 128 132 134 V144 C118 138 104 140 100 145 C96 140 82 138 68 144 Z" fill="#FFFFFF"/>
  <text x="100" y="40" fill="#FFD700" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="14" font-weight="900" text-anchor="middle" letter-spacing="2">UDELAR</text>
  <text x="100" y="172" fill="#FFFFFF" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="8" font-weight="700" text-anchor="middle" letter-spacing="1">REPÚBLICA • URUGUAY</text>
</svg>`,

    'ucv.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <linearGradient id="ucv-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#003366"/>
      <stop offset="100%" stop-color="#001833"/>
    </linearGradient>
  </defs>
  <rect x="12" y="12" width="176" height="176" rx="36" fill="url(#ucv-bg)" stroke="#C49A45" stroke-width="3"/>
  <!-- Torre del Reloj de la Ciudad Universitaria UCV -->
  <g fill="#FFFFFF">
    <rect x="94" y="55" width="12" height="74" rx="1"/>
    <circle cx="100" cy="70" r="4.5" fill="#C49A45"/>
    <rect x="88" y="129" width="24" height="12" rx="2"/>
    <!-- Escultura reloj perforada -->
    <rect x="97" y="85" width="6" height="18" fill="#003366"/>
  </g>
  <!-- Laureles y sol -->
  <circle cx="70" cy="80" r="4" fill="#C49A45"/>
  <circle cx="130" cy="80" r="4" fill="#C49A45"/>
  <text x="100" y="40" fill="#C49A45" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="15" font-weight="900" text-anchor="middle" letter-spacing="3">UCV</text>
  <text x="100" y="172" fill="#FDE68A" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="8" font-weight="700" text-anchor="middle" letter-spacing="1">VENEZUELA • 1721</text>
</svg>`,

    'ucr.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <linearGradient id="ucr-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0083CA"/>
      <stop offset="100%" stop-color="#004A73"/>
    </linearGradient>
  </defs>
  <rect x="12" y="12" width="176" height="176" rx="36" fill="url(#ucr-bg)" stroke="#FFD100" stroke-width="3"/>
  <!-- Girasol y sol de la UCR "Lucem Aspicio" -->
  <circle cx="100" cy="94" r="46" fill="#005A8C" stroke="#FFFFFF" stroke-width="2"/>
  <!-- Cordillera y Sol de Costa Rica -->
  <path d="M60 115 L80 95 L100 110 L120 90 L140 115 Z" fill="#15803D"/>
  <circle cx="100" cy="80" r="14" fill="#FFD100"/>
  <!-- Rayos solares -->
  <path d="M100 58 V64 M84 66 L88 71 M116 66 L112 71" stroke="#FFD100" stroke-width="2.5" stroke-linecap="round"/>
  <!-- Libro abierto -->
  <path d="M72 124 C85 119 100 120 100 126 C100 120 115 119 128 124 V134 C115 129 100 130 100 136 C100 130 85 129 72 134 Z" fill="#FFFFFF"/>
  <text x="100" y="40" fill="#FFD100" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="15" font-weight="900" text-anchor="middle" letter-spacing="3">UCR</text>
  <text x="100" y="172" fill="#FFFFFF" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="8.5" font-weight="700" text-anchor="middle" letter-spacing="1">LUCEM ASPICIO • 1940</text>
</svg>`,

    'usfq.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <linearGradient id="usfq-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#B31B1B"/>
      <stop offset="100%" stop-color="#5E0000"/>
    </linearGradient>
  </defs>
  <rect x="12" y="12" width="176" height="176" rx="36" fill="url(#usfq-bg)" stroke="#002B49" stroke-width="3"/>
  <!-- Dragón / Pegasus de las Artes Liberales USFQ -->
  <circle cx="100" cy="94" r="48" fill="#780A0A" stroke="#FFFFFF" stroke-width="2"/>
  <!-- Silueta del dragón rampante con antorcha -->
  <path d="M86 112 C82 98 90 85 104 80 C114 76 122 80 126 88 C116 86 108 90 106 96 C114 96 120 100 122 108 C114 106 106 108 100 114 Z" fill="#FFFFFF"/>
  <circle cx="108" cy="74" r="4" fill="#FACC15"/>
  <!-- Línea del Ecuador y libro -->
  <line x1="60" y1="94" x2="140" y2="94" stroke="#FACC15" stroke-width="1.5" stroke-dasharray="3 3"/>
  <rect x="88" y="122" width="24" height="12" rx="2" fill="#002B49" stroke="#FFFFFF" stroke-width="1"/>
  <text x="100" y="40" fill="#FFFFFF" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="14" font-weight="900" text-anchor="middle" letter-spacing="3">USFQ</text>
  <text x="100" y="172" fill="#FECACA" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="8" font-weight="700" text-anchor="middle" letter-spacing="1">ARTES LIBERALES • QUITO</text>
</svg>`
};

let count = 0;
for (const [filename, content] of Object.entries(svgs)) {
    const filePath = path.join(ASSETS_DIR, filename);
    fs.writeFileSync(filePath, content.trim() + '\n', 'utf8');
    const stats = fs.statSync(filePath);
    console.log(`Saved ${filename} (${stats.size} bytes)`);
    count++;
}
console.log(`Successfully generated all ${count} SVG icons!`);
