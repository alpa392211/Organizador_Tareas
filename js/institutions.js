/**
 * Módulo de Instituciones Escolares
 * Contiene datos, rutas a los archivos oficiales de escudos/logos en assets/,
 * catálogo de universidades hispanas, soporte para escuelas personalizadas
 * y configuración dinámica de grados/periodos académicos.
 */

window.InstitutionsModule = (() => {
    const COUNTRIES = [
        { code: 'MX', name: 'México', flag: '🇲🇽' },
        { code: 'CO', name: 'Colombia', flag: '🇨🇴' },
        { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
        { code: 'CL', name: 'Chile', flag: '🇨🇱' },
        { code: 'PE', name: 'Perú', flag: '🇵🇪' },
        { code: 'ES', name: 'España', flag: '🇪🇸' },
        { code: 'UY', name: 'Uruguay', flag: '🇺🇾' },
        { code: 'VE', name: 'Venezuela', flag: '🇻🇪' },
        { code: 'CR', name: 'Costa Rica', flag: '🇨🇷' },
        { code: 'EC', name: 'Ecuador', flag: '🇪🇨' }
    ];

    const STANDARD_SEMESTRAL_PERIODS = [
        '1.º Semestre', '2.º Semestre', '3.º Semestre', '4.º Semestre',
        '5.º Semestre', '6.º Semestre', '7.º Semestre', '8.º Semestre',
        '9.º Semestre', '10.º Semestre'
    ];

    const INSTITUTIONS = {
        // --- MÉXICO ---
        unam: {
            id: 'unam',
            name: 'UNAM',
            fullName: 'Universidad Nacional Autónoma de México',
            shortBadge: 'UNAM',
            country: 'México',
            countryCode: 'MX',
            countryFlag: '🇲🇽',
            systemType: 'Semestral',
            slogan: 'Por mi raza hablará el espíritu',
            icon: 'assets/unam.svg',
            colors: {
                primary: '#002B7A', // Azul Marino Puma
                secondary: '#D4AF37', // Oro Pumas
                accent: '#E6B800',
                aura: '#002B7A',
                badgeBg: 'bg-[#002B7A]',
                badgeText: 'text-[#D4AF37]'
            },
            periods: STANDARD_SEMESTRAL_PERIODS,
            defaultPeriod: '1.º Semestre'
        },
        ipn: {
            id: 'ipn',
            name: 'IPN (Poli)',
            fullName: 'Instituto Politécnico Nacional',
            shortBadge: 'IPN',
            country: 'México',
            countryCode: 'MX',
            countryFlag: '🇲🇽',
            systemType: 'Semestral',
            slogan: 'La técnica al servicio de la patria',
            icon: 'assets/ipn.svg',
            colors: {
                primary: '#6C1D45', // Guinda Politécnico
                secondary: '#FFFFFF',
                accent: '#9A2A63',
                aura: '#9A2A63',
                badgeBg: 'bg-[#6C1D45]',
                badgeText: 'text-white'
            },
            periods: STANDARD_SEMESTRAL_PERIODS,
            defaultPeriod: '1.º Semestre'
        },
        uam: {
            id: 'uam',
            name: 'UAM',
            fullName: 'Universidad Autónoma Metropolitana',
            shortBadge: 'UAM',
            country: 'México',
            countryCode: 'MX',
            countryFlag: '🇲🇽',
            systemType: 'Trimestral',
            slogan: 'Casa abierta al tiempo',
            icon: 'assets/uam.svg',
            colors: {
                primary: '#E84D0E', // Naranja UAM
                secondary: '#1C1C1C',
                accent: '#FF6B2B',
                aura: '#E84D0E',
                badgeBg: 'bg-[#E84D0E]',
                badgeText: 'text-white'
            },
            periods: [
                '1.º Trimestre', '2.º Trimestre', '3.º Trimestre', '4.º Trimestre',
                '5.º Trimestre', '6.º Trimestre', '7.º Trimestre', '8.º Trimestre',
                '9.º Trimestre', '10.º Trimestre', '11.º Trimestre', '12.º Trimestre'
            ],
            defaultPeriod: '1.º Trimestre'
        },
        cch: {
            id: 'cch',
            name: 'CCH (UNAM)',
            fullName: 'Colegio de Ciencias y Humanidades',
            shortBadge: 'CCH',
            country: 'México',
            countryCode: 'MX',
            countryFlag: '🇲🇽',
            systemType: 'Semestral Bachillerato',
            slogan: 'Aprender a aprender, aprender a hacer y a ser',
            icon: 'assets/cch.png',
            colors: {
                primary: '#0B3B60',
                secondary: '#F59E0B',
                accent: '#E6B800',
                aura: '#F59E0B',
                badgeBg: 'bg-[#0B3B60]',
                badgeText: 'text-[#F59E0B]'
            },
            periods: [
                '1.º Semestre', '2.º Semestre', '3.º Semestre',
                '4.º Semestre', '5.º Semestre', '6.º Semestre'
            ],
            defaultPeriod: '1.º Semestre'
        },
        enp: {
            id: 'enp',
            name: 'ENP (Prepa UNAM)',
            fullName: 'Escuela Nacional Preparatoria',
            shortBadge: 'ENP',
            country: 'México',
            countryCode: 'MX',
            countryFlag: '🇲🇽',
            systemType: 'Anual Preparatoria',
            slogan: 'Amor, Orden y Progreso',
            icon: 'assets/enp.svg',
            colors: {
                primary: '#002B7A',
                secondary: '#F59E0B',
                accent: '#1D4ED8',
                aura: '#002B7A',
                badgeBg: 'bg-[#002B7A]',
                badgeText: 'text-amber-400'
            },
            periods: [
                '4.º Año de Preparatoria',
                '5.º Año de Preparatoria',
                '6.º Año (Área 1: Físico-Matemáticas)',
                '6.º Año (Área 2: Ciencias Biológicas y Salud)',
                '6.º Año (Área 3: Ciencias Sociales)',
                '6.º Año (Área 4: Humanidades y Artes)'
            ],
            defaultPeriod: '4.º Año de Preparatoria'
        },
        cecyt: {
            id: 'cecyt',
            name: 'CECyT (Voca IPN)',
            fullName: 'Centro de Estudios Científicos y Tecnológicos',
            shortBadge: 'CECyT',
            country: 'México',
            countryCode: 'MX',
            countryFlag: '🇲🇽',
            systemType: 'Semestral Politécnico',
            slogan: 'Espíritu Politécnico al servicio del país',
            icon: 'assets/cecyt.svg',
            colors: {
                primary: '#6C1D45',
                secondary: '#D97706',
                accent: '#831843',
                aura: '#6C1D45',
                badgeBg: 'bg-[#6C1D45]',
                badgeText: 'text-white'
            },
            periods: [
                '1.º Semestre', '2.º Semestre', '3.º Semestre',
                '4.º Semestre', '5.º Semestre', '6.º Semestre'
            ],
            defaultPeriod: '1.º Semestre'
        },
        colbach: {
            id: 'colbach',
            name: 'Colbach',
            fullName: 'Colegio de Bachilleres',
            shortBadge: 'COLBACH',
            country: 'México',
            countryCode: 'MX',
            countryFlag: '🇲🇽',
            systemType: 'Semestral Bachillerato',
            slogan: 'Formación integral para la vida',
            icon: 'assets/colbach.svg',
            colors: {
                primary: '#006847', // Verde Colbach
                secondary: '#85C441', // Verde Lima
                accent: '#047857',
                aura: '#006847',
                badgeBg: 'bg-[#006847]',
                badgeText: 'text-white'
            },
            periods: [
                '1.º Semestre', '2.º Semestre', '3.º Semestre',
                '4.º Semestre', '5.º Semestre', '6.º Semestre'
            ],
            defaultPeriod: '1.º Semestre'
        },
        itesm: {
            id: 'itesm',
            name: 'Tec de Monterrey',
            fullName: 'Instituto Tecnológico y de Estudios Superiores de Monterrey',
            shortBadge: 'ITESM',
            country: 'México',
            countryCode: 'MX',
            countryFlag: '🇲🇽',
            systemType: 'Semestral',
            slogan: 'En el Tec formamos líderes que transforman vidas',
            icon: 'assets/itesm.svg',
            colors: {
                primary: '#0039A6',
                secondary: '#001A72',
                accent: '#0056B3',
                aura: '#0039A6',
                badgeBg: 'bg-[#0039A6]',
                badgeText: 'text-white'
            },
            periods: STANDARD_SEMESTRAL_PERIODS,
            defaultPeriod: '1.º Semestre'
        },
        udeg: {
            id: 'udeg',
            name: 'UdeG',
            fullName: 'Universidad de Guadalajara',
            shortBadge: 'UDEG',
            country: 'México',
            countryCode: 'MX',
            countryFlag: '🇲🇽',
            systemType: 'Semestral',
            slogan: 'Piensa y Trabaja',
            icon: 'assets/udeg.svg',
            colors: {
                primary: '#003366',
                secondary: '#C59B27',
                accent: '#004C99',
                aura: '#003366',
                badgeBg: 'bg-[#003366]',
                badgeText: 'text-[#C59B27]'
            },
            periods: STANDARD_SEMESTRAL_PERIODS,
            defaultPeriod: '1.º Semestre'
        },
        uanl: {
            id: 'uanl',
            name: 'UANL',
            fullName: 'Universidad Autónoma de Nuevo León',
            shortBadge: 'UANL',
            country: 'México',
            countryCode: 'MX',
            countryFlag: '🇲🇽',
            systemType: 'Semestral',
            slogan: 'Alere Flammam Veritatis',
            icon: 'assets/uanl.svg',
            colors: {
                primary: '#003B71',
                secondary: '#F1A80A',
                accent: '#0A5296',
                aura: '#003B71',
                badgeBg: 'bg-[#003B71]',
                badgeText: 'text-[#F1A80A]'
            },
            periods: STANDARD_SEMESTRAL_PERIODS,
            defaultPeriod: '1.º Semestre'
        },

        // --- COLOMBIA ---
        unal: {
            id: 'unal',
            name: 'UNAL',
            fullName: 'Universidad Nacional de Colombia',
            shortBadge: 'UNAL',
            country: 'Colombia',
            countryCode: 'CO',
            countryFlag: '🇨🇴',
            systemType: 'Semestral',
            slogan: 'Investigación y docencia para el desarrollo de la nación',
            icon: 'assets/unal.svg',
            colors: {
                primary: '#005522',
                secondary: '#1E7E34',
                accent: '#28A745',
                aura: '#005522',
                badgeBg: 'bg-[#005522]',
                badgeText: 'text-white'
            },
            periods: STANDARD_SEMESTRAL_PERIODS,
            defaultPeriod: '1.º Semestre'
        },
        uniandes: {
            id: 'uniandes',
            name: 'UniAndes',
            fullName: 'Universidad de los Andes',
            shortBadge: 'UNIANDES',
            country: 'Colombia',
            countryCode: 'CO',
            countryFlag: '🇨🇴',
            systemType: 'Semestral',
            slogan: 'Construyendo país con innovación y excelencia académica',
            icon: 'assets/uniandes.svg',
            colors: {
                primary: '#FDB813',
                secondary: '#1A1A1A',
                accent: '#FFC72C',
                aura: '#FDB813',
                badgeBg: 'bg-[#1A1A1A]',
                badgeText: 'text-[#FDB813]'
            },
            periods: STANDARD_SEMESTRAL_PERIODS,
            defaultPeriod: '1.º Semestre'
        },
        udea: {
            id: 'udea',
            name: 'UdeA',
            fullName: 'Universidad de Antioquia',
            shortBadge: 'UDEA',
            country: 'Colombia',
            countryCode: 'CO',
            countryFlag: '🇨🇴',
            systemType: 'Semestral',
            slogan: 'El saber al servicio de la comunidad',
            icon: 'assets/udea.svg',
            colors: {
                primary: '#0F6938',
                secondary: '#FFFFFF',
                accent: '#168048',
                aura: '#0F6938',
                badgeBg: 'bg-[#0F6938]',
                badgeText: 'text-white'
            },
            periods: STANDARD_SEMESTRAL_PERIODS,
            defaultPeriod: '1.º Semestre'
        },
        javeriana: {
            id: 'javeriana',
            name: 'Javeriana',
            fullName: 'Pontificia Universidad Javeriana',
            shortBadge: 'PUJ',
            country: 'Colombia',
            countryCode: 'CO',
            countryFlag: '🇨🇴',
            systemType: 'Semestral',
            slogan: 'Sabiduría inspirada en el servicio y la excelencia humana',
            icon: 'assets/javeriana.svg',
            colors: {
                primary: '#003087',
                secondary: '#FCC200',
                accent: '#0047AB',
                aura: '#003087',
                badgeBg: 'bg-[#003087]',
                badgeText: 'text-[#FCC200]'
            },
            periods: STANDARD_SEMESTRAL_PERIODS,
            defaultPeriod: '1.º Semestre'
        },

        // --- ARGENTINA ---
        uba: {
            id: 'uba',
            name: 'UBA',
            fullName: 'Universidad de Buenos Aires',
            shortBadge: 'UBA',
            country: 'Argentina',
            countryCode: 'AR',
            countryFlag: '🇦🇷',
            systemType: 'Semestral',
            slogan: 'Argentum et virtus in libertate',
            icon: 'assets/uba.svg',
            colors: {
                primary: '#003A70',
                secondary: '#0072CE',
                accent: '#41748D',
                aura: '#003A70',
                badgeBg: 'bg-[#003A70]',
                badgeText: 'text-white'
            },
            periods: STANDARD_SEMESTRAL_PERIODS,
            defaultPeriod: '1.º Semestre'
        },
        unlp: {
            id: 'unlp',
            name: 'UNLP',
            fullName: 'Universidad Nacional de La Plata',
            shortBadge: 'UNLP',
            country: 'Argentina',
            countryCode: 'AR',
            countryFlag: '🇦🇷',
            systemType: 'Semestral',
            slogan: 'Por la ciencia y por la patria',
            icon: 'assets/unlp.svg',
            colors: {
                primary: '#004F71',
                secondary: '#808285',
                accent: '#006B99',
                aura: '#004F71',
                badgeBg: 'bg-[#004F71]',
                badgeText: 'text-white'
            },
            periods: STANDARD_SEMESTRAL_PERIODS,
            defaultPeriod: '1.º Semestre'
        },
        unc: {
            id: 'unc',
            name: 'UNC',
            fullName: 'Universidad Nacional de Córdoba',
            shortBadge: 'UNC',
            country: 'Argentina',
            countryCode: 'AR',
            countryFlag: '🇦🇷',
            systemType: 'Semestral',
            slogan: 'Ut portet nomen meum',
            icon: 'assets/unc.svg',
            colors: {
                primary: '#7A1C20',
                secondary: '#B8860B',
                accent: '#9E2A2B',
                aura: '#7A1C20',
                badgeBg: 'bg-[#7A1C20]',
                badgeText: 'text-white'
            },
            periods: STANDARD_SEMESTRAL_PERIODS,
            defaultPeriod: '1.º Semestre'
        },
        utn: {
            id: 'utn',
            name: 'UTN',
            fullName: 'Universidad Tecnológica Nacional',
            shortBadge: 'UTN',
            country: 'Argentina',
            countryCode: 'AR',
            countryFlag: '🇦🇷',
            systemType: 'Semestral',
            slogan: 'La universidad federal de las ingenierías',
            icon: 'assets/utn.svg',
            colors: {
                primary: '#002C6C',
                secondary: '#0070BA',
                accent: '#005A9E',
                aura: '#002C6C',
                badgeBg: 'bg-[#002C6C]',
                badgeText: 'text-white'
            },
            periods: STANDARD_SEMESTRAL_PERIODS,
            defaultPeriod: '1.º Semestre'
        },

        // --- CHILE ---
        uchile: {
            id: 'uchile',
            name: 'U. de Chile',
            fullName: 'Universidad de Chile',
            shortBadge: 'UCHILE',
            country: 'Chile',
            countryCode: 'CL',
            countryFlag: '🇨🇱',
            systemType: 'Semestral',
            slogan: 'Todo por la patria, la ciencia y la verdad',
            icon: 'assets/uchile.svg',
            colors: {
                primary: '#002A68',
                secondary: '#E31B23',
                accent: '#004099',
                aura: '#002A68',
                badgeBg: 'bg-[#002A68]',
                badgeText: 'text-white'
            },
            periods: STANDARD_SEMESTRAL_PERIODS,
            defaultPeriod: '1.º Semestre'
        },
        uc_cl: {
            id: 'uc_cl',
            name: 'UC Chile',
            fullName: 'Pontificia Universidad Católica de Chile',
            shortBadge: 'UC',
            country: 'Chile',
            countryCode: 'CL',
            countryFlag: '🇨🇱',
            systemType: 'Semestral',
            slogan: 'Por la patria, Dios y el desarrollo humano',
            icon: 'assets/uc_cl.svg',
            colors: {
                primary: '#003366',
                secondary: '#D99B00',
                accent: '#004C99',
                aura: '#003366',
                badgeBg: 'bg-[#003366]',
                badgeText: 'text-[#D99B00]'
            },
            periods: STANDARD_SEMESTRAL_PERIODS,
            defaultPeriod: '1.º Semestre'
        },
        usach: {
            id: 'usach',
            name: 'USACH',
            fullName: 'Universidad de Santiago de Chile',
            shortBadge: 'USACH',
            country: 'Chile',
            countryCode: 'CL',
            countryFlag: '🇨🇱',
            systemType: 'Semestral',
            slogan: 'Labor et scientia',
            icon: 'assets/usach.svg',
            colors: {
                primary: '#E05A10',
                secondary: '#002F6C',
                accent: '#FF6F1E',
                aura: '#E05A10',
                badgeBg: 'bg-[#002F6C]',
                badgeText: 'text-[#E05A10]'
            },
            periods: STANDARD_SEMESTRAL_PERIODS,
            defaultPeriod: '1.º Semestre'
        },
        udec: {
            id: 'udec',
            name: 'UdeC',
            fullName: 'Universidad de Concepción',
            shortBadge: 'UDEC',
            country: 'Chile',
            countryCode: 'CL',
            countryFlag: '🇨🇱',
            systemType: 'Semestral',
            slogan: 'Por el desarrollo libre del espíritu',
            icon: 'assets/udec.svg',
            colors: {
                primary: '#002B49',
                secondary: '#F2A900',
                accent: '#004475',
                aura: '#002B49',
                badgeBg: 'bg-[#002B49]',
                badgeText: 'text-[#F2A900]'
            },
            periods: STANDARD_SEMESTRAL_PERIODS,
            defaultPeriod: '1.º Semestre'
        },

        // --- PERÚ ---
        unmsm: {
            id: 'unmsm',
            name: 'UNMSM',
            fullName: 'Universidad Nacional Mayor de San Marcos',
            shortBadge: 'UNMSM',
            country: 'Perú',
            countryCode: 'PE',
            countryFlag: '🇵🇪',
            systemType: 'Semestral',
            slogan: 'Decana de América, fundada en 1551',
            icon: 'assets/unmsm.svg',
            colors: {
                primary: '#781D22',
                secondary: '#D4AF37',
                accent: '#93242A',
                aura: '#781D22',
                badgeBg: 'bg-[#781D22]',
                badgeText: 'text-[#D4AF37]'
            },
            periods: STANDARD_SEMESTRAL_PERIODS,
            defaultPeriod: '1.º Semestre'
        },
        pucp: {
            id: 'pucp',
            name: 'PUCP',
            fullName: 'Pontificia Universidad Católica del Perú',
            shortBadge: 'PUCP',
            country: 'Perú',
            countryCode: 'PE',
            countryFlag: '🇵🇪',
            systemType: 'Semestral',
            slogan: 'Et Lux in Tenebris Lucet',
            icon: 'assets/pucp.svg',
            colors: {
                primary: '#002855',
                secondary: '#6BA4B8',
                accent: '#003F7A',
                aura: '#002855',
                badgeBg: 'bg-[#002855]',
                badgeText: 'text-white'
            },
            periods: STANDARD_SEMESTRAL_PERIODS,
            defaultPeriod: '1.º Semestre'
        },
        uni: {
            id: 'uni',
            name: 'UNI',
            fullName: 'Universidad Nacional de Ingeniería',
            shortBadge: 'UNI',
            country: 'Perú',
            countryCode: 'PE',
            countryFlag: '🇵🇪',
            systemType: 'Semestral',
            slogan: 'Ciencia, Técnica y Progreso',
            icon: 'assets/uni.svg',
            colors: {
                primary: '#800000',
                secondary: '#FFFFFF',
                accent: '#A00000',
                aura: '#800000',
                badgeBg: 'bg-[#800000]',
                badgeText: 'text-white'
            },
            periods: STANDARD_SEMESTRAL_PERIODS,
            defaultPeriod: '1.º Semestre'
        },

        // --- ESPAÑA ---
        ucm: {
            id: 'ucm',
            name: 'UCM',
            fullName: 'Universidad Complutense de Madrid',
            shortBadge: 'UCM',
            country: 'España',
            countryCode: 'ES',
            countryFlag: '🇪🇸',
            systemType: 'Semestral',
            slogan: 'Libertas Perfundet Omnia Luce',
            icon: 'assets/ucm.svg',
            colors: {
                primary: '#9E1B32',
                secondary: '#D4AF37',
                accent: '#B8233C',
                aura: '#9E1B32',
                badgeBg: 'bg-[#9E1B32]',
                badgeText: 'text-white'
            },
            periods: STANDARD_SEMESTRAL_PERIODS,
            defaultPeriod: '1.º Semestre'
        },
        ub: {
            id: 'ub',
            name: 'UB',
            fullName: 'Universidad de Barcelona',
            shortBadge: 'UB',
            country: 'España',
            countryCode: 'ES',
            countryFlag: '🇪🇸',
            systemType: 'Semestral',
            slogan: 'Libertas perfundet omnia luce',
            icon: 'assets/ub.svg',
            colors: {
                primary: '#003865',
                secondary: '#FFD100',
                accent: '#004E8C',
                aura: '#003865',
                badgeBg: 'bg-[#003865]',
                badgeText: 'text-[#FFD100]'
            },
            periods: STANDARD_SEMESTRAL_PERIODS,
            defaultPeriod: '1.º Semestre'
        },
        uam_es: {
            id: 'uam_es',
            name: 'UAM (Madrid)',
            fullName: 'Universidad Autónoma de Madrid',
            shortBadge: 'UAM',
            country: 'España',
            countryCode: 'ES',
            countryFlag: '🇪🇸',
            systemType: 'Semestral',
            slogan: 'Quid ultra faciam?',
            icon: 'assets/uam_es.svg',
            colors: {
                primary: '#004B49',
                secondary: '#8A9EA7',
                accent: '#006B68',
                aura: '#004B49',
                badgeBg: 'bg-[#004B49]',
                badgeText: 'text-white'
            },
            periods: STANDARD_SEMESTRAL_PERIODS,
            defaultPeriod: '1.º Semestre'
        },
        upv: {
            id: 'upv',
            name: 'UPV',
            fullName: 'Universitat Politècnica de València',
            shortBadge: 'UPV',
            country: 'España',
            countryCode: 'ES',
            countryFlag: '🇪🇸',
            systemType: 'Semestral',
            slogan: 'Progreso e innovación tecnológica',
            icon: 'assets/upv.svg',
            colors: {
                primary: '#D32F2F',
                secondary: '#212121',
                accent: '#E53935',
                aura: '#D32F2F',
                badgeBg: 'bg-[#D32F2F]',
                badgeText: 'text-white'
            },
            periods: STANDARD_SEMESTRAL_PERIODS,
            defaultPeriod: '1.º Semestre'
        },

        // --- URUGUAY ---
        udelar: {
            id: 'udelar',
            name: 'UdelaR',
            fullName: 'Universidad de la República',
            shortBadge: 'UDELAR',
            country: 'Uruguay',
            countryCode: 'UY',
            countryFlag: '🇺🇾',
            systemType: 'Semestral',
            slogan: 'En el saber está la libertad',
            icon: 'assets/udelar.svg',
            colors: {
                primary: '#002B5C',
                secondary: '#FFD700',
                accent: '#003F8A',
                aura: '#002B5C',
                badgeBg: 'bg-[#002B5C]',
                badgeText: 'text-[#FFD700]'
            },
            periods: STANDARD_SEMESTRAL_PERIODS,
            defaultPeriod: '1.º Semestre'
        },

        // --- VENEZUELA ---
        ucv: {
            id: 'ucv',
            name: 'UCV',
            fullName: 'Universidad Central de Venezuela',
            shortBadge: 'UCV',
            country: 'Venezuela',
            countryCode: 'VE',
            countryFlag: '🇻🇪',
            systemType: 'Semestral',
            slogan: 'La casa que vence las sombras',
            icon: 'assets/ucv.svg',
            colors: {
                primary: '#003366',
                secondary: '#C49A45',
                accent: '#004C99',
                aura: '#003366',
                badgeBg: 'bg-[#003366]',
                badgeText: 'text-[#C49A45]'
            },
            periods: STANDARD_SEMESTRAL_PERIODS,
            defaultPeriod: '1.º Semestre'
        },

        // --- COSTA RICA ---
        ucr: {
            id: 'ucr',
            name: 'UCR',
            fullName: 'Universidad de Costa Rica',
            shortBadge: 'UCR',
            country: 'Costa Rica',
            countryCode: 'CR',
            countryFlag: '🇨🇷',
            systemType: 'Semestral',
            slogan: 'Lucem Aspicio',
            icon: 'assets/ucr.svg',
            colors: {
                primary: '#0083CA',
                secondary: '#FFD100',
                accent: '#0099E6',
                aura: '#0083CA',
                badgeBg: 'bg-[#0083CA]',
                badgeText: 'text-white'
            },
            periods: STANDARD_SEMESTRAL_PERIODS,
            defaultPeriod: '1.º Semestre'
        },

        // --- ECUADOR ---
        usfq: {
            id: 'usfq',
            name: 'USFQ',
            fullName: 'Universidad San Francisco de Quito',
            shortBadge: 'USFQ',
            country: 'Ecuador',
            countryCode: 'EC',
            countryFlag: '🇪🇨',
            systemType: 'Semestral',
            slogan: 'Artes Liberales y Espíritu Emprendedor',
            icon: 'assets/usfq.svg',
            colors: {
                primary: '#B31B1B',
                secondary: '#002B49',
                accent: '#D32F2F',
                aura: '#B31B1B',
                badgeBg: 'bg-[#B31B1B]',
                badgeText: 'text-white'
            },
            periods: STANDARD_SEMESTRAL_PERIODS,
            defaultPeriod: '1.º Semestre'
        }
    };

    /**
     * Retorna la lista oficial ordenada de países soportados
     */
    function getCountries() {
        return [...COUNTRIES];
    }

    /**
     * Retorna todas las instituciones: 33 oficiales del catálogo + escuelas personalizadas
     */
    function getAllInstitutions() {
        const builtIn = Object.values(INSTITUTIONS);
        const custom = window.StorageModule?.getCustomSchools?.() || [];
        return [...builtIn, ...custom];
    }

    /**
     * Obtiene una institución por su ID con fallback seguro a UNAM
     * Si el ID es 'general' o vacío, migra/retorna UNAM.
     * Busca primero en instituciones oficiales y luego en personalizadas.
     */
    function getInstitution(id) {
        if (!id || id === 'general') {
            return INSTITUTIONS.unam;
        }

        if (INSTITUTIONS[id]) {
            return INSTITUTIONS[id];
        }

        // Buscar en escuelas personalizadas guardadas
        const customSchools = window.StorageModule?.getCustomSchools?.() || [];
        const custom = customSchools.find(s => s.id === id);
        if (custom) {
            return custom;
        }

        return INSTITUTIONS.unam;
    }

    /**
     * Genera el HTML del contenedor de marco blanco institucional con escudo oficial o logo personalizado
     */
    function renderIconHtml(inst, containerSizeOrClass = 'w-11 h-11', imgClass = 'w-full h-full object-contain') {
        const item = typeof inst === 'string' ? getInstitution(inst) : inst;
        if (!item) return '';

        let containerClass = containerSizeOrClass || 'w-11 h-11';
        containerClass = containerClass.replace(/object-contain|object-cover/g, '').trim();

        const rounded = containerClass.includes('rounded-') ? '' : 'rounded-2xl';
        const padding = containerClass.includes('p-') ? '' : 'p-1';

        const iconSrc = item.icon || 'assets/unam.svg';

        return `<div class="school-logo-frame ${containerClass} ${rounded} ${padding} bg-white border border-slate-200/90 dark:border-slate-700 shadow-xs flex items-center justify-center shrink-0 transition-transform duration-200 hover:scale-105" style="background-color: #ffffff !important;">` +
               `<img src="${iconSrc}" alt="Escudo ${item.name}" class="${imgClass}" style="background-color: transparent; max-height: 88%; max-width: 88%; object-fit: contain;" loading="lazy">` +
               `</div>`;
    }

    /**
     * Genera la etiqueta o insignia (badge) visual para la institución
     */
    function renderBadgeHtml(inst) {
        const item = typeof inst === 'string' ? getInstitution(inst) : inst;
        if (!item) return '';
        const badgeBg = item.colors?.badgeBg || 'bg-indigo-600';
        const badgeText = item.colors?.badgeText || 'text-white';
        return `<span class="px-2 py-0.5 rounded-full text-xs font-bold ${badgeBg} ${badgeText}">${item.shortBadge || item.name}</span>`;
    }

    return {
        COUNTRIES,
        INSTITUTIONS,
        getCountries,
        getAllInstitutions,
        getInstitution,
        renderIconHtml,
        renderBadgeHtml
    };
})();
