// js/components/exampleComponent.js

class ExampleComponent extends ComponentBase {
  constructor() {
    super('ExampleComponent');

    // Log component creation
    this.log.lifecycle('constructor');

    // Initialize properties
    this.data = [];
    this.selectedItem = null;

    // Log initial state
    this.log.debug('Component initialized with empty state', {
      dataLength: this.data.length,
      selectedItem: this.selectedItem,
    });

    // Bind methods
    this.loadData = this.createTracedMethod('loadData', this.loadData.bind(this));
    this.selectItem = this.createTracedMethod('selectItem', this.selectItem.bind(this));
  }

  async loadData() {
    this.log.lifecycle('loadData started');

    try {
      // Simulate API call
      this.log.debug('Fetching data...');

      // Log state before
      this.log.stateChange('loading', false, true);

      // Simulate async operation
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock data
      this.data = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
      ];

      // Log success
      this.log.info('Data loaded successfully', {
        count: this.data.length,
        items: this.data,
      });

      // Log state after
      this.log.stateChange('loading', true, false);

      return this.data;
    } catch (error) {
      this.log.error('Failed to load data', error);
      throw error;
    }
  }

  selectItem(id) {
    this.log.event('itemSelected', { id });

    const oldSelection = this.selectedItem;
    this.selectedItem = this.data.find((item) => item.id === id);

    if (this.selectedItem) {
      this.log.stateChange('selectedItem', oldSelection, this.selectedItem);
      this.log.info('Item selected', this.selectedItem);
    } else {
      this.log.warn('Item not found', { id, availableIds: this.data.map((i) => i.id) });
    }

    return this.selectedItem;
  }
}

// Make globally available
window.ExampleComponent = ExampleComponent;
