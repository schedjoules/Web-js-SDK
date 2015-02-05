document.addEventListener("DOMContentLoaded", function(event) { 

	/**
	 * Utilities singleton for use by all the things
	 */
	var Utils = (function() {
		/**
		 * Constructor
		 */
		var Utils = function() {}

		/**
		 * Add class to element
		 */
		Utils.prototype.add_class = function($element, $class) {
			if ($element.classList) {
				$element.classList.add($class);
			} else {
				$element.className += ' ' + $class;
			}

			return $element;
		}

		/**
		 * Check if element has class
		 */
		Utils.prototype.has_class = function($element, $class) {
			if($element.classList) {
				return $element.classList.contains($class);
			} else {
				return new RegExp('(^| )' + $class + '( |$)', 'gi').test($element.$class);
			}
		}
	
		return new Utils();
	})();

	/**
	 * Onchange handler for country select
	 */
	function switch_location(e) {
		var $select = e.currentTarget;
		var $page_id = $select.options[$select.selectedIndex].value;

		$history = [];

		get_page($page_id);
	}

	/**
	 * Switch main content with new content
	 */
	function replace_main_content($content) {
		var $container = document.getElementsByTagName('main')[0];
		var $wrapper = document.getElementsByClassName('wrapper')[0];
	
		// Remove current container, add new page
		$container.remove();
		$wrapper.appendChild($content);
	}

	/**
	 * Create step dots
	 */
	function render_steps($history) {
		// Create container
		var $steps = document.createElement('div');
		Utils.add_class($steps, 'steps');

		// Add a step for each page in history
		for(var $z = 0; $z < $history.length; $z++) {
			// Create anchor
			var $step = document.createElement('a');
			Utils.add_class($step, 'step');

			if($z == $history.length - 1) {
				// Add final class to last step
				Utils.add_class($step, 'active');
			} else {
				// Set data-id etc.
				$step.setAttribute('href', '#');
				$step.setAttribute('data-id', $history[$z]);

				// Load step on click
				$step.addEventListener('click', function(e) {
					e.preventDefault();

					go_to_step(e.currentTarget);
				});
			}

			$steps.appendChild($step);
		}

		return $steps;
	}

	/**
	 * Go to step in history
	 */
	function go_to_step($step) {
		var $item_id = $step.getAttribute('data-id');
		var $new_history = [];

		// Walk the history array till we find the page to create new history
		for(var $x = 0; $x < $history.length; $x++) {
			// Don't add the item we need to new history, get_page will do that
			if($history[$x] == $item_id) {
				$history_item = $history[$x];

				break;
			}

			$new_history.push($history[$x]);
		}

		// Switch old with new history
		$history = $new_history;

		// Load the page
		get_page($item_id);
	}

	/**
	 * Bind event handlers to anchors
	 */
	function configure_anchors($page) {
		// Bind event handlers for click to all anchors in page
		var $anchors = $page.container.getElementsByTagName('a');

		for(var $y = 0; $y < $anchors.length; $y++) {
			// Add event listener to open next item
			$anchors[$y].addEventListener('click', function(e) {
				e.preventDefault();
				var $item_id = e.currentTarget.getAttribute('data-id');

				// Load the page or calendar
				if(e.currentTarget.getAttribute('data-item-class') == 'calendar') {
					// Is calendar
					get_calendar($item_id);
				} else {
					// Is page
					get_page($item_id);
				}
			});

			// Add class to anchor for styling purposes
			Utils.add_class($anchors[$y], $anchors[$y].getAttribute('data-item-class'));
		}

		return $page;
	}

	/**
	 * Get page from API and render it as desired
	 */
	function get_page($item_id) {
		$history.push($item_id);

		// Get page with custom render action
		var $page = SJ.get_page($item_id, {
			on_update: function($page) {
				$page.render($page);
				configure_anchors($page);
				$page.container.appendChild(render_steps($history));
			}
		});

		replace_main_content($page.container);
	}

	/**
	 * Add classes to call to action button
	 */
	function call_to_action_classes($calendar) {
		var $anchor = $calendar.container.getElementsByTagName('a')[0];
		
		Utils.add_class($anchor, 'btn');
		Utils.add_class($anchor, 'calltoaction');
	}

	/**
	 * Get item from API
	 */
	function get_calendar($item_id) {
		$history.push($item_id);

		// Get calendar with custom render action
		var $calendar = SJ.get_calendar($item_id, {
			on_update: function($calendar) {
				$calendar.render($calendar);
				call_to_action_classes($calendar);
				$calendar.container.appendChild(render_steps($history));
			}
		});

		replace_main_content($calendar.container);
	}

	// Set API key
	SJ.set_api_key('0443a55244bb2b6224fd48e0416f0d9c');

	var $history = [];

	get_page('115673');

	// Get languages select from SDK, this comes with the appropriate event listeners
	// already enabled, so the SDK will handle updating the language
	SJ.locales.load(function($select) {
		var $container = document.getElementsByClassName('locales')[0];

		var $element = $select.render();
		Utils.add_class($element, 'locales');

		// Swap select with new one
		$container.innerHTML = '';
		$container.appendChild($element);
	});

	// Get locations select from SDK
	SJ.locations.load(function($select) {
		var $container = document.getElementsByClassName('locations')[0];

		var $element = $select.render();

		Utils.add_class($element, 'locations');
		
		// Location changes have to be handled manually because the entries for another
		// location are on a seperate page
		$element.addEventListener('change', switch_location);

		// Swap select with new one
		$container.innerHTML = '';
		$container.appendChild($element);
	});

	// Make back to home link work with history
	document.getElementsByClassName('backtohome')[0].addEventListener('click', function(e) {
		e.preventDefault();
		var $steps = document.getElementsByClassName('step');

		// Only go back if we can
		if($steps.length > 1) {
			go_to_step($steps[0]);
		}
	});
});
