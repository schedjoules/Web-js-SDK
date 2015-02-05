/*
 *           _              _  _             _           
 *  ___  ___| |__   ___  __| |(_) ___  _   _| | ___  ___ 
 * / __|/ __| '_ \ / _ \/ _` || |/ _ \| | | | |/ _ \/ __|
 * \__ \ (__| | | |  __/ (_| || | (_) | |_| | |  __/\__ \
 * |___/\___|_| |_|\___|\__,_|/ |\___/ \__,_|_|\___||___/
 *                          |__/                         
 * @author 	Johan Schuijt
 * @version	0.3.2
 *
 */

var SJ = (function () {
	/**
	 * Prototype object that other objects extend. Holds common functions
	 */
	var Configurable = (function() {
		/**
		 * Constructor
		 */
		function Configurable() {}

		/**
		 * Load config from object and append to object passed as first argument
		 */
		Configurable.prototype.extend = function($config) {
			$config = $config || {};

			for (var $i = 1; $i < arguments.length; $i++) {
				if ( ! arguments[$i]) {
					continue;
				}

				for (var key in arguments[$i]) {
					if (arguments[$i].hasOwnProperty(key)) {
						$config[key] = arguments[$i][key];
					}
				}
			}

			return $config;
		}

		/**
		 * Extend config to this object
		 */
		Configurable.prototype.configure = function() {
			// Create array of the arguments
			var $arguments_array = Array.prototype.slice.call(arguments);

			// Prepend this object to the array and call extend with the new arguments
			return this.extend.apply(null, [this].concat($arguments_array));
		}

		return Configurable;
	})();

	/**
	 * Loadable prototype object
	 */
	var Loader = (function() {
		/**
		 * Constructor
		 */
		function Loader($config) {
			var $defaults = {
				uri: 'https://api.schedjoules.com',
				version: 'v1',
				locale: 'en',
				location: 'us'
			}

			this.configure($defaults, $config);
		}

		// Make loader a subclass of configurable
		Loader.prototype = Object.create(Configurable.prototype);
		Loader.prototype.constructor = Loader;

		/**
		 * Fetch data from API
		 */
		Loader.prototype.load_data = function($path, $on_success) {
			var request = new XMLHttpRequest();

			// Check for CORS support
			if ("withCredentials" in request) {
				var $url = this.get_url($path);

				// Open a async get request to URL
				request.open('GET', $url, true);

				// Set headers
				request.setRequestHeader('Authorization', 'Token token="'+this.api_key+'"');

				// Stuff to do when all is fine
				request.onload = function() {
					if (request.status >= 200 && request.status < 400) {
						// Success, call on_success method with data
						$on_success(JSON.parse(request.responseText));
					} else {
						// We reached our target server, but it returned an error
						console.log('The Schedjoules API returned an error.');
					}
				};

				// Nope nope nope
				request.onerror = function() {
					// There was a connection error of some sort
					console.log('An error occurred while connection to the Schedjoules API.');
				};

				request.send();
			}

		}

		/**
		 * Build url with locale from path
		 */
		Loader.prototype.get_url = function($path) {
			// Add parameters to URL when needed
			var $param_string = '';
			if(this.locale != "en") {
				$param_string += '?locale='+this.locale;
			}

			// Build complete url
			return this.uri+$path+$param_string;
		}


		return Loader;
	})();

	/**
	 * Item class is prototype class for calendar and page
	 */
	var Item = (function() {
		/**
		 * Constructor
		 */
		function Item($config) {
			var $defaults = {
				container: this.get_container(),
				on_update: this.render
			};

			this.configure($defaults, $config);
		}

		// item is a configurable
		Item.prototype = Object.create(Configurable.prototype);
		Item.prototype.constructor = Item;

		/**
		 * Update data & throw update event
		 */
		Item.prototype.update = function($data) {
			this.configure($data);

			this.trigger_event('sj-updated');
		}

		/**
		 * Build container object that's used to pass events
		 */
		Item.prototype.get_container = function() {
			var $container = document.createElement('main');
			$container.setAttribute('role', 'main');

			return $container;
		}

		/**
		 * Create custom event
		 */
		Item.prototype.create_event = function($name) {
			var $event;

			if (document.createEvent) {
				$event = document.createEvent("HTMLEvents");
				$event.initEvent($name, true, true);
			} else {
				$event = document.createEventObject();
				$event.eventType = $name;
			}

			$event.eventName = $name;

			return $event;
		}

		/**
		 * Trigger a custom event
		 */
		Item.prototype.trigger_event = function($name) {
			var $event = this.create_event($name)

			if (document.createEvent) {
				this.container.dispatchEvent($event);
			} else {
				this.container.fireEvent("on" + $event.eventType, $event);
			}
		}

		return Item;
	})();

	/**
	 * Calendar object that stores data and renders dom object
	 */
	var Calendar = (function() {
		/**
		 * Constructor
		 */
		function Calendar($config) {
			Item.call(this, $config);
		}

		// Calendar is an item
		Calendar.prototype = Object.create(Item.prototype);
		Calendar.prototype.constructor = Calendar;

		/**
		 * Initialize the calendar
		 */
		Calendar.prototype.init = function() {
			var _ = this;

			if( ! _.initialized) {
				// Bind handler
				_.container.addEventListener('sj-updated', function() {
					// Only call on_update when this is in the domtree
					_.on_update(_);
				});

				// Trigger event
				_.trigger_event('sj-updated');

				_.initialized = true
			}

			return _;
		}

		/**
		 * Return dom object representing the calendar item
		 */
		Calendar.prototype.render = function() {
			// Remove (possible) old elements
			this.container.innerHTML = '';

			// Add heading
			var $heading = document.createElement('h1');
			$heading.innerHTML = this.category+' - '+this.name;
			this.container.appendChild($heading);

			// Create section with text and link
			var $section = document.createElement('section');
			$section.textContent = this.url;

			// Add button link
			var $anchor = document.createElement('a');
			$anchor.setAttribute('href', this.url);
			$anchor.textContent = 'Download ICS file';
			$section.appendChild($anchor);

			this.container.appendChild($section);

			return this.container;
		}

		return Calendar;
	})();

	/**
	 * Page object that loads & stores data and renders DOM objects
	 */
	var Page = (function() {
		/**
		 * Constructor
		 */
		function Page($config) {
			Item.call(this, $config);
		}

		// Page is an item
		Page.prototype = Object.create(Item.prototype);
		Page.prototype.constructor = Page;
		
		/**
		 * Initialize, Bind event handlers etc
		 */
		Page.prototype.init = function() {
			var _ = this;

			if( ! _.initialized) {
				_.load();

				// Run update logic on update
				_.container.addEventListener('sj-updated', function() {
					// Only call on_update when this is in the domtree
					if(document.body.contains(_.container)) {
						_.on_update(_);
					}
				});
			
				_.initialized = true;
			}

			return _;
		}

		/**
		 * Load data over ajax
		 */
		Page.prototype.load = function() {
			var _ = this;

			var $path = '/pages/'+_.item_id;

			// Load data
			this.sdk.loader.load_data($path, function($data) {
				// Cache items from the data
				_.sdk.cache_items($data);

				// Update the data
				_.update($data);

				// Announce we're done loading data
				_.trigger_event('sj-loaded');
			});
		}

		/**
		 * Render a item for a section
		 */
		Page.prototype.render_item = function($item_data) {
			var $row = document.createElement('li');
			var $anchor = document.createElement('a');
			var $image = document.createElement('img');
			
			// Create anchor
			$anchor.setAttribute('href', '#');
			$anchor.setAttribute('data-id', $item_data.item.item_id);
			$anchor.setAttribute('data-item-class', $item_data.item_class);
			$anchor.setAttribute('title', $item_data.item.category+' - '+$item_data.item.name);

			// Create image when there is one
			if($item_data.item.icon) {
				$image.setAttribute('src', $item_data.item.icon);
				$image.setAttribute('alt', $item_data.item.category+' - '+$item_data.item.name+' icon');
				$anchor.appendChild($image);
			}

			// Add text
			$anchor.appendChild(document.createTextNode($item_data.item.name));

			// Add anchor to row
			$row.appendChild($anchor);

			return $row;
		}

		/**
		 * Render a page section
		 */
		Page.prototype.render_section = function($section_data) {
			var $section = document.createElement('section');
			var $heading = document.createElement('h1');
			var $list = document.createElement('ul');

			// Set heading and append to section
			$heading.innerHTML = $section_data.name;
			$section.appendChild($heading);

			// Render each item and append the item list to this section
			for(var $i = 0; $i < $section_data.items.length; $i++) {
				$list.appendChild(this.render_item($section_data.items[$i]));
			}
			$section.appendChild($list);

			return $section;
		}

		/**
		 * Build DOM objects and pass on to callback
		 */
		Page.prototype.render = function($page) {
			// Remove old elements
			this.container.innerHTML = '';

			// Add page sections
			for(var $x = 0; $x < this.page_sections.length; $x++) {
				$page.container.appendChild(this.render_section(this.page_sections[$x]));
			}

			return $page;
		}

		return Page;
	})();

	/**
	 * Base select object, this will be extended by locales and locations
	 */
	var Select = (function() {
		function Select($config) {
			var $defaults = {
				selected: '',
				options: []
			}

			this.configure($defaults, $config);
		}

		// Select is configurable
		Select.prototype = Object.create(Configurable.prototype);
		Select.prototype.constructor = Select;

		/**
		 * Load data from the server
		 */
		Select.prototype.load = function($path, $callback) {
			var _ = this;

			// Load data
			this.sdk.loader.load_data($path, function($data) {
				// Update the data
				_.set_options($data);

				// Announce we're done loading data
				$callback(_);
			});
		}
	
		/**
		 * Render select
		 */
		Select.prototype.render = function() {
			var $select = document.createElement('select');

			// Add all options to select
			for(var $i in this.options) {
				var $option = document.createElement('option');
				$option.setAttribute('value', this.options[$i].value);
				$option.innerHTML = this.options[$i].text;

				// Add selected attribute to current language
				if(this.options[$i].value == this.selected) {
					$option.setAttribute('selected', true);
				}

				$select.appendChild($option);
			}

			// Pass on our newly created select element to the users callback
			return $select;
		}

		return Select;
	})();

	/**
	 * Locales select object
	 */
	var Locales = (function() {
		function Locales($config) {
			Select.call(this, $config);
		}

		// Locales is select
		Locales.prototype = Object.create(Select.prototype);
		Locales.prototype.constructor = Locales;

		/**
		 * Load options from data
		 */
		Locales.prototype.set_options = function($data) {
			// Add option for each data entry
			for(var $key in $data) {
				this.options.push({
					value: $data[$key].iso_639_1,
					text: $data[$key].name
				});
			}
		}

		/**
		 * Load data from the server
		 */
		Locales.prototype.load = function($callback) {
			Select.prototype.load.call(this, '/languages', $callback);
		}

		/**
		 * Render locales select
		 */
		Locales.prototype.render = function() {
			var _ = this;
			var $select = Select.prototype.render.call(this);

			$select.addEventListener('change', function(e) {
				_.update(e);
			})
			
			return $select;
		}

		/**
		 * Update selected locale
		 */
		Locales.prototype.update = function(e) {
			var $select = e.currentTarget;
			var $locale = $select.options[$select.selectedIndex].value;

			this.selected = $locale;

			SJ.set_locale($locale);
		}

		return Locales;
	})();

	/**
	 * Locations select object
	 */
	var Locations = (function() {
		function Locations($config) {
			Select.call(this, $config);
		}

		// Locations is select
		Locations.prototype = Object.create(Select.prototype);
		Locations.prototype.constructor = Locations;

		/**
		 * Load options from data
		 */
		Locations.prototype.set_options = function($data) {
			// Add option for each data entry
			for(var $key in $data) {
				this.options.push({
					value: $data[$key].page_id,
					text: $data[$key].name_translation
				});

				// Set selected based on iso code, this way we can pass iso codes to config
				if($data[$key].iso_3166 == this.selected) {
					this.selected = $data[$key].page_id;
				}
			}
		}

		/**
		 * Load data from the server
		 */
		Locations.prototype.load = function($callback) {
			Select.prototype.load.call(this, '/countries', $callback);
		}

		/**
		 * Render Locations select
		 */
		Locations.prototype.render = function() {
			var _ = this;
			var $select = Select.prototype.render.call(this);

			$select.addEventListener('change', function(e) {
				var $select = e.currentTarget;
				this.selected = $select.options[$select.selectedIndex].value;
			});

			return $select;
		}

		return Locations;
	})();

	/**
	 * Main control of all moving parts
	 */
	var SDK = (function() {
		function SDK() {
			var $location = 'us';
			var $locale = 'en';

			var $defaults = {
				items: {},

				// All ajax related stuff
				loader: new Loader({
					location: $location,
					locale: $locale,
				}),

				// Locale selection, updates automatically
				locales: new Locales({
					selected: $locale,
					sdk: this
				}),

				// Location selection, user has to bind event handlers
				locations: new Locations({
					selected: $location,
					sdk: this
				})
			}

			this.configure($defaults);
		}

		// SDK is configurable
		SDK.prototype = Object.create(Configurable.prototype);
		SDK.prototype.constructor = SDK;

		/**
		 * Set API key for all calls
		 */
		SDK.prototype.set_api_key = function($key) {
			this.loader.configure({
				api_key: $key
			});
		}

		/**
		 * Set language
		 */
		SDK.prototype.set_locale = function($locale) {
			// Only set locale if it's different as the current
			if(this.loader.locale != $locale) {
				this.loader.locale = $locale;

				// Update all page data on change
				this.update_pages();
			}
		}

		/**
		 * Get page with item_id from API or cache
		 */
		SDK.prototype.get_page = function($item_id, $config) {
			var _ = this;
			var $page;

			// Check cache
			if(typeof(_.items[$item_id]) !== 'undefined') {
				$page = _.items[$item_id];
			} else {
				$page = new Page({
					item_id: $item_id,
					sdk: _
				});

				// Cache results
				_.items[$item_id] = $page;
			}

			// Return initialized page
			return $page.configure($config).init();
		}

		/**
		 * Get calendar with item_id from cache
		 */
		SDK.prototype.get_calendar = function($item_id, $config) {
			var _ = this;

			if(typeof(_.items[$item_id]) !== 'undefined') {
				return _.items[$item_id].configure($config).init();
			}
		}

		/**
		 * Cache all items from page sections
		 */
		SDK.prototype.cache_items = function($page_data) {
			var _ = this;

			// Create an item for each item in page sections
			for(var $section in $page_data.page_sections) {
				var $items = $page_data.page_sections[$section].items;

				for(var $item in $items) {
					var $item_data = $items[$item].item;

					// Check if item is already in cache
					if(typeof(_.items[$item_data.item_id]) !== 'undefined') {
						// It is there!
						_.items[$item_data.item_id].update($item_data);
					} else {
						// Item is not in cache yet, add SDK to item data so objects can access SDK functions
						$item_data.sdk = _;

						// Check what the item is, create appropriate object
						if($items[$item].item_class == 'page') {
							_.items[$item_data.item_id] = new Page($item_data);
						} else {
							_.items[$item_data.item_id] = new Calendar($item_data);
						}
					}
				}
			}
		}

		/**
		 * Update all pages within the cache
		 */
		SDK.prototype.update_pages = function() {
			for(var $item in this.items) {
				if (this.items.hasOwnProperty($item)) {
					// Reload object if it's a page
					if(this.items[$item] instanceof Page && this.items[$item].initialized) {
						this.items[$item].load();
					}
				}
			}
		}

		return SDK;
	})();

	return new SDK();
}());
