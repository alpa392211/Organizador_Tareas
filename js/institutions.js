/**
 * Módulo de Instituciones Escolares
 * Contiene datos, rutas a los archivos oficiales de escudos/logos en assets/
 * y configuración dinámica de grados/periodos académicos.
 */

window.InstitutionsModule = (() => {
    const INSTITUTIONS = {
        unam: {
            id: 'unam',
            name: 'UNAM',
            fullName: 'Universidad Nacional Autónoma de México',
            shortBadge: 'UNAM',
            systemType: 'Semestral',
            slogan: 'Por mi raza hablará el espíritu',
            icon: 'assets/unam.svg',
            colors: {
                primary: '#002B7A', // Azul Marino Puma
                secondary: '#D4AF37', // Oro Pumas
                accent: '#E6B800',
                badgeBg: 'bg-[#002B7A]',
                badgeText: 'text-[#D4AF37]'
            },
            periods: [
                '1.º Semestre', '2.º Semestre', '3.º Semestre', '4.º Semestre',
                '5.º Semestre', '6.º Semestre', '7.º Semestre', '8.º Semestre',
                '9.º Semestre', '10.º Semestre'
            ],
            defaultPeriod: '1.º Semestre'
        },
        ipn: {
            id: 'ipn',
            name: 'IPN (Poli)',
            fullName: 'Instituto Politécnico Nacional',
            shortBadge: 'IPN',
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
            periods: [
                '1.º Semestre', '2.º Semestre', '3.º Semestre', '4.º Semestre',
                '5.º Semestre', '6.º Semestre', '7.º Semestre', '8.º Semestre',
                '9.º Semestre', '10.º Semestre'
            ],
            defaultPeriod: '1.º Semestre'
        },
        uam: {
            id: 'uam',
            name: 'UAM',
            fullName: 'Universidad Autónoma Metropolitana',
            shortBadge: 'UAM',
            systemType: 'Trimestral',
            slogan: 'Casa abierta al tiempo',
            icon: 'assets/uam.svg',
            colors: {
                primary: '#E84D0E', // Naranja UAM
                secondary: '#1C1C1C',
                accent: '#FF6B2B',
                aura: '#E84D0E', // Resplandor naranja institucional radiante
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
            systemType: 'Anual Preparatoria',
            slogan: 'Amor, Orden y Progreso',
            icon: 'assets/enp.svg',
            colors: {
                primary: '#002B7A',
                secondary: '#F59E0B',
                accent: '#1D4ED8',
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
            systemType: 'Semestral Politécnico',
            slogan: 'Espíritu Politécnico al servicio del país',
            icon: 'assets/cecyt.svg',
            colors: {
                primary: '#6C1D45',
                secondary: '#D97706',
                accent: '#831843',
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
            systemType: 'Semestral Bachillerato',
            slogan: 'Formación integral para la vida',
            icon: 'assets/colbach.svg',
            colors: {
                primary: '#006847', // Verde Colbach
                secondary: '#85C441', // Verde Lima
                accent: '#047857',
                badgeBg: 'bg-[#006847]',
                badgeText: 'text-white'
            },
            periods: [
                '1.º Semestre', '2.º Semestre', '3.º Semestre',
                '4.º Semestre', '5.º Semestre', '6.º Semestre'
            ],
            defaultPeriod: '1.º Semestre'
        },
        general: {
            id: 'general',
            name: 'General / Otra institución',
            fullName: 'Organizador Escolar Multidisciplinario',
            shortBadge: 'PRO',
            systemType: 'Flexible',
            slogan: 'Enfócate, organízate y alcanza el éxito escolar',
            icon: 'assets/general.svg',
            colors: {
                primary: '#4F46E5', // Indigo vibrante
                secondary: '#10B981',
                accent: '#6366F1',
                badgeBg: 'bg-indigo-600',
                badgeText: 'text-white'
            },
            periods: [
                '1.º Semestre', '2.º Semestre', '3.º Semestre', '4.º Semestre',
                '5.º Semestre', '6.º Semestre', '7.º Semestre', '8.º Semestre',
                '9.º Semestre', '10.º Semestre',
                '1.º Cuatrimestre', '2.º Cuatrimestre', '3.º Cuatrimestre', '4.º Cuatrimestre',
                '5.º Cuatrimestre', '6.º Cuatrimestre', '7.º Cuatrimestre', '8.º Cuatrimestre',
                '9.º Cuatrimestre', '10.º Cuatrimestre'
            ],
            defaultPeriod: '1.º Semestre'
        }
    };

    function getInstitution(id) {
        return INSTITUTIONS[id] || INSTITUTIONS.unam;
    }

    function renderIconHtml(inst, containerSizeOrClass = 'w-11 h-11', imgClass = 'w-full h-full object-contain') {
        const item = typeof inst === 'string' ? getInstitution(inst) : inst;
        if (!item) return '';

        let containerClass = containerSizeOrClass || 'w-11 h-11';
        containerClass = containerClass.replace(/object-contain|object-cover/g, '').trim();

        const rounded = containerClass.includes('rounded-') ? '' : 'rounded-2xl';
        const padding = containerClass.includes('p-') ? '' : 'p-1';

        return `<div class="school-logo-frame ${containerClass} ${rounded} ${padding} bg-white border border-slate-200/90 dark:border-slate-700 shadow-xs flex items-center justify-center shrink-0 transition-transform duration-200 hover:scale-105" style="background-color: #ffffff !important;">` +
               `<img src="${item.icon}" alt="Escudo ${item.name}" class="${imgClass}" style="background-color: transparent; max-height: 88%; max-width: 88%; object-fit: contain;" loading="lazy">` +
               `</div>`;
    }

    return {
        INSTITUTIONS,
        getInstitution,
        renderIconHtml
    };
})();
