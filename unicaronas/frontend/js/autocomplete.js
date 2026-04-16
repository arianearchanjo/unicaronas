/**
 * Componente de Autocomplete de Endereços usando Nominatim API (OpenStreetMap)
 * Otimizado para a Região Metropolitana de Curitiba - PR, Brasil.
 */

class AddressAutocomplete {
    constructor(inputElement, options = {}) {
        this.input = inputElement;
        this.resultsContainer = null;
        this.onSelect = options.onSelect || (() => {});
        this.abortController = null;
        this.debounceTimer = null;
        this.minChars = 3;
        this.debounceMs = 300;

        // Configurações Geográficas (Região Metropolitana de Curitiba)
        // Viewbox expandido para cobrir toda a RMC (Adrianópolis até Tijucas do Sul / Lapa até Piraquara)
        // Formato: min_lon, min_lat, max_lon, max_lat
        this.viewbox = "-50.0000,-26.1000,-48.5000,-24.5000";

        this.init();
    }

    init() {
        // Envolver o input em um container se necessário
        const wrapper = document.createElement('div');
        wrapper.className = 'autocomplete-container';
        this.input.parentNode.insertBefore(wrapper, this.input);
        wrapper.appendChild(this.input);

        // Criar container de resultados
        this.resultsContainer = document.createElement('div');
        this.resultsContainer.className = 'autocomplete-results';
        wrapper.appendChild(this.resultsContainer);

        // Eventos
        this.input.addEventListener('input', () => this.handleInput());
        
        // Fechar resultados ao clicar fora
        document.addEventListener('click', (e) => {
            if (!wrapper.contains(e.target)) {
                this.hideResults();
            }
        });

        // Adicionar classe ao input
        this.input.classList.add('autocomplete-input');
    }

    handleInput() {
        const query = this.input.value.trim();

        clearTimeout(this.debounceTimer);
        if (this.abortController) {
            this.abortController.abort();
        }

        if (query.length < this.minChars) {
            this.hideResults();
            return;
        }

        this.debounceTimer = setTimeout(() => {
            this.search(query);
        }, this.debounceMs);
    }

    async search(query) {
        this.showLoading();

        this.abortController = new AbortController();
        const { signal } = this.abortController;

        const url = new URL('https://nominatim.openstreetmap.org/search');
        url.searchParams.set('q', query);
        url.searchParams.set('format', 'jsonv2');
        url.searchParams.set('addressdetails', '1');
        url.searchParams.set('limit', '5');
        url.searchParams.set('countrycodes', 'br');
        url.searchParams.set('viewbox', this.viewbox);
        url.searchParams.set('bounded', '1');
        url.searchParams.set('accept-language', 'pt-BR');

        try {
            const response = await fetch(url, { signal });
            if (!response.ok) throw new Error('Falha na requisição');
            
            const results = await response.json();
            this.renderResults(results);
        } catch (error) {
            if (error.name === 'AbortError') return;
            console.error('Erro na busca de endereços:', error);
            this.renderError();
        }
    }

    renderResults(results) {
        this.resultsContainer.innerHTML = '';
        
        // Filtrar por tipos relevantes (incluindo universidades, pontos de interesse e prédios)
        const relevantTypes = [
            'road', 'residential', 'house', 'secondary', 'tertiary', 'primary', 
            'service', 'unclassified', 'trunk', 'pedestrian',
            'university', 'college', 'school', 'amenity', 'building', 'office'
        ];
        
        const filteredResults = results.filter(item => 
            relevantTypes.includes(item.type) || 
            relevantTypes.includes(item.addresstype) ||
            item.class === 'amenity' || 
            item.class === 'building' ||
            item.class === 'office'
        );

        if (filteredResults.length === 0) {
            this.renderNoResults();
            return;
        }

        filteredResults.forEach(item => {
            const div = document.createElement('div');
            div.className = 'autocomplete-item';
            
            const formattedName = this.formatAddress(item.address);
            div.textContent = formattedName;
            
            div.addEventListener('click', () => {
                this.input.value = formattedName;
                this.onSelect(item);
                this.hideResults();
            });
            
            this.resultsContainer.appendChild(div);
        });

        this.showResults();
    }

    /**
     * Formata o endereço no padrão: "Nome (se POI), Rua, Bairro - Cidade"
     */
    formatAddress(address) {
        // Tenta pegar o nome do local (universidade, prédio, faculdade, etc)
        const name = address.university || address.college || address.school || address.amenity || address.building || address.office || '';
        const street = address.road || address.pedestrian || address.path || '';
        const neighborhood = address.neighbourhood || address.suburb || address.city_district || '';
        const city = address.city || address.town || address.village || '';
        
        let parts = [];
        
        if (name) parts.push(name);
        if (street && street !== name) parts.push(street);
        if (neighborhood && neighborhood !== street && neighborhood !== name) {
            parts.push(neighborhood);
        }

        let formatted = parts.join(', ');

        if (city) {
            formatted += (formatted ? ` - ${city}` : city);
        }

        return formatted || 'Endereço não identificado';
    }

    showLoading() {
        this.resultsContainer.innerHTML = '<div class="autocomplete-loading">Buscando...</div>';
        this.showResults();
    }

    renderNoResults() {
        this.resultsContainer.innerHTML = '<div class="autocomplete-no-results">Nenhum endereço encontrado</div>';
        this.showResults();
    }

    renderError() {
        this.resultsContainer.innerHTML = '<div class="autocomplete-no-results">Erro ao buscar endereços</div>';
        this.showResults();
    }

    showResults() {
        this.resultsContainer.classList.add('active');
    }

    hideResults() {
        this.resultsContainer.classList.remove('active');
    }
}
