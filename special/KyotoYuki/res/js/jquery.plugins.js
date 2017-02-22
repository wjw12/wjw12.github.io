/** Utility tools, mostly jQuery specific */
/**
 * Combines into one file/TCP request: autoDownsizeText(),
 * setImportantStyle(), hScroll(), downscale(), touchSupported()
 * jquery migration plugin-browser components, jquery.history plugin, 
 * and opacityrollover plugin
 **/


// ----------------------------------------------------------
// A short snippet for detecting versions of IE (5-11) or Edge (12-14+)
// If you're not in IE (or IE version is less than 5) then:
//     ie === undefined
// Thus, to detect IE:
//     if (ie) {}
// And to detect the version:
//     ie === 6 // IE6
//     ie > 7 // IE8, IE9 ...
// ----------------------------------------------------------
var ie = (function(){
	var v = 3,
		div = document.createElement('div'),
		all = div.getElementsByTagName('i');

	while (
		div.innerHTML = '<!--[if gt IE ' + (++v) + ']><i></i><![endif]-->',
		all[0]
	);
	if (v <= 4) { // Check for IE>9 using user agent
		var match = navigator.userAgent.match(/(?:MSIE |Trident\/.*; rv:|Edge\/)(\d+)/);
		v = match ? parseInt(match[1]) : undefined;
	}
	return v;
}());

if (ie) {
	$('html').addClass('ie' + ie);
	if (ie <=8)
		$('html').addClass('ieLTE8');
    if (ie <=6)
		$('html').addClass('ieLTE6');
}

// Detects support for background-size: cover
var bsCoverSupport = (function(){
    var supported = ('backgroundSize' in document.documentElement.style);
    if(supported){
        var temp = document.createElement('div');
        temp.style.backgroundSize = 'cover';
        supported = temp.style.backgroundSize == 'cover';
    };
    return supported;
})();

/** Replace background icon images with foreground png images (needed for when background-size: cover isn't supported, e.g.) */
$.fn.addFgPngIcon = function () {
	if (!bsCoverSupport) {
		$(this).css('background-image', 'none');
		var iconName = $(this).attr("class").match(/ic-([\w\-]+)/)[1];
		$(this).html("<img title='' src='./res/icons/png/" + iconName + ".png' />");
	}
	return $(this);
}

/* check whether (2D CSS) transforms are supported, returns name of supported prefix if supported */
function transformSupported() {
    var prefixes = 'transform WebkitTransform MozTransform OTransform msTransform'.split(' ');
    var div = document.createElement('div');
    for(var i = 0; i < prefixes.length; i++) {
        if(div && div.style[prefixes[i]] !== undefined) {
            return prefixes[i];
        }
    }
    return false;
}
if (!transformSupported()) {
	$('html').addClass('noTransform');
}

/* simple check to see whether any elements are returned by a jQuery query , eg $('.myclass').exists() */
$.fn.exists = function () {
    return this.length !== 0;
}

/** Set a css style with !important designation (to override lightroom) [.css() fails at least in firefox, .style() has other drawbacks] */
function setImportantStyle(element, attrName, attrValue) {
    //remove previously defined property
    if (typeof element.style.setProperty === "function")
        element.style.setProperty(attrName, ''); // Remove fails on chrome
    else
        element.style.setAttribute(attrName, '');

    //insert the new style with all the old rules
    element.setAttribute('style', element.style.cssText + '; ' +
        attrName + ':' + attrValue + ' !important;');
}

/**
 * Detect browser support for touch events.
 * Caveats - doesn't mean they don't also have and use a mouse; doesn't
 * even mean they necessarily have a touchscreen; even some touch devices
 * (old palm pilots, eg) don't. 
 * If need to check this often, use this solution: http://stackoverflow.com/a/4734092 
 **/
var touchSupported = (function() {
	return 'ontouchstart' in window || !!(navigator.msMaxTouchPoints);
})();

/** 
 * Use CSS transform to downscale content having minimum (full size)
 * width minWidth to fit within the specified fixed size container 
 **/
$.fn.downscale = function (container, minWidth) {
	var availWidth = $(container).innerWidth();
	var ratio = minWidth / availWidth;
	if (ratio<1) {
		var scaleStr = "scale("+ratio+","+ratio+")";
		$(this).css({'min-width': minWidth, '-ms-transform': scaleStr, '-webkit-transform': scaleStr, 'transform': scaleStr, '-ms-transform-origin:':'top left', '-webkit-transform-origin:':'top left', 'transform-origin':'top left', 'zoom':ratio+'\9'}); /* zoom untested (unsure of origin), used to support on IE6-8; '\9' used to avoid being used on IE9+ */
	} else {
		$(this).css({'width':'100%', '-ms-transform': '', '-webkit-transform': '', 'transform': '', 'zoom':'1.0\9'});
	}
	return $(this);
}

/** Downsize text to fit into container (max initial font size = 54px, min final font size = 4px) */
$.fn.autoDownsizeText = function (resetFirst) { // resetFirst clears the element's font-size property before beginning (assumes fonts are defined outside this tag)
	var el, elements, _i;
	elements = $(this);
	if (elements.length > 0) {
		for (_i = 0; _i < elements.length; _i++) {
			el = elements[_i];
			if (resetFirst) 
				if (typeof el.style.setProperty === "function")
					el.style.setProperty('font-size',''); // remove fails on chrome
				else 
					el.style.removeAttribute('font-size');
			function resizeText() {
				var elNewFontSize = (parseInt($(el).css('font-size').slice(0, -2)) - 1) + 'px';
				setImportantStyle(el, 'font-size', elNewFontSize);
				if (elNewFontSize=="4px")  return true; // enforce minimum size of 4px
				else  return false;
			};
			var count = 0, reachedMinimum = false;
			while (el.scrollHeight > el.offsetHeight && !reachedMinimum && count < 50) {
				reachedMinimum = resizeText(); count++;
			}
			if ( count==50 || (reachedMinimum && el.scrollHeight > el.offsetHeight) ) { console.warn("autoDownsizeText failed"); } // be sure container isn't sized in units of font size (em/ex).
		}
	}
	return $(this);
};

/** 
  * Enable scrolling an element horizontal using up/down mousewheel events
  * (when over the element). Amount is the number of pixels to move per
  * pixel (default 120) 
  **/
$.fn.hScroll = function (amount) {
	amount = amount || 120;
	$(this).bind("DOMMouseScroll mousewheel", function (event) {
		var origEvent = event.originalEvent, direction = origEvent.detail ? origEvent.detail * -amount : origEvent.wheelDelta, position = $(this).scrollLeft();
		position += direction > 0 ? -amount : amount;
		$(this).scrollLeft(position);
		event.preventDefault();
	})
};

/* returns actual document height: http://james.padolsey.com/javascript/get-document-height-cross-browser/ */
$.getDocHeight = function(){
    return Math.max(
        $(document).height(),
        $(window).height(),
        /* For opera: */
        document.documentElement.clientHeight
    );
};

/**
 * Subset of jQuery migration plugin for browser checking post jQuery 1.9 (needed by jQuery.history)
 *
 * Only used to support legacy plugins; better to check for browser features using eg: Modernizer
 *
 * See http://stackoverflow.com/questions/9645803/whats-the-replacement-for-browser
 *
 */
jQuery.uaMatch = function( ua ) {
	ua = ua.toLowerCase();
	var match = /(chrome)[ \/]([\w.]+)/.exec( ua ) ||
		/(webkit)[ \/]([\w.]+)/.exec( ua ) ||
		/(opera)(?:.*version|)[ \/]([\w.]+)/.exec( ua ) ||
		/(msie) ([\w.]+)/.exec( ua ) ||
		ua.indexOf("compatible") < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec( ua ) || [];
	return {
		browser: match[ 1 ] || "",
		version: match[ 2 ] || "0"
	};
};
if ( !jQuery.browser ) {
	var
	matched = jQuery.uaMatch( navigator.userAgent ),
	browser = {};
	if ( matched.browser ) {
		browser[ matched.browser ] = true;
		browser.version = matched.version;
	}
	// Chrome is Webkit, but Webkit is also Safari.
	if ( browser.chrome ) {
		browser.webkit = true;
	} else if ( browser.webkit ) {
		browser.safari = true;
	}
	jQuery.browser = browser;
}

/**
 * jQuery history plugin
 *
 * The MIT License
 *
 * Copyright (c) 2006-2009 Taku Sano (Mikage Sawatari)
 * Copyright (c) 2010 Takayuki Miwa
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

(function($) {
	var locationWrapper = {
		put: function(hash, win) {
			(win || window).location.hash = this.encoder(hash);
		},
		get: function(win) {
			var hash = ((win || window).location.hash).replace(/^#/, '');
			try {
				return $.browser.mozilla ? hash : decodeURIComponent(hash);
			}
			catch (error) {
				return hash;
			}
		},
		encoder: encodeURIComponent
	};

	var iframeWrapper = {
		id: "__jQuery_history",
		init: function() {
			var html = '<iframe id="'+ this.id +'" style="display:none" src="javascript:false;" />';
			$("body").prepend(html);
			return this;
		},
		_document: function() {
			return $("#"+ this.id)[0].contentWindow.document;
		},
		put: function(hash) {
			var doc = this._document();
			doc.open();
			doc.close();
			locationWrapper.put(hash, doc);
		},
		get: function() {
			return locationWrapper.get(this._document());
		}
	};

	function initObjects(options) {
		options = $.extend({
				unescape: false
			}, options || {});

		locationWrapper.encoder = encoder(options.unescape);

		function encoder(unescape_) {
			if(unescape_ === true) {
				return function(hash){ return hash; };
			}
			if(typeof unescape_ == "string" &&
			   (unescape_ = partialDecoder(unescape_.split("")))
			   || typeof unescape_ == "function") {
				return function(hash) { return unescape_(encodeURIComponent(hash)); };
			}
			return encodeURIComponent;
		}

		function partialDecoder(chars) {
			var re = new RegExp($.map(chars, encodeURIComponent).join("|"), "ig");
			return function(enc) { return enc.replace(re, decodeURIComponent); };
		}
	}

	var implementations = {};

	implementations.base = {
		callback: undefined,
		type: undefined,

		check: function() {},
		load:  function(hash) {},
		init:  function(callback, options) {
			initObjects(options);
			self.callback = callback;
			self._options = options;
			self._init();
		},

		_init: function() {},
		_options: {}
	};

	implementations.timer = {
		_appState: undefined,
		_init: function() {
			var current_hash = locationWrapper.get();
			self._appState = current_hash;
			self.callback(current_hash);
			setInterval(self.check, 100);
		},
		check: function() {
			var current_hash = locationWrapper.get();
			if(current_hash != self._appState) {
				self._appState = current_hash;
				self.callback(current_hash);
			}
		},
		load: function(hash) {
			if(hash != self._appState) {
				locationWrapper.put(hash);
				self._appState = hash;
				self.callback(hash);
			}
		}
	};

	implementations.iframeTimer = {
		_appState: undefined,
		_init: function() {
			var current_hash = locationWrapper.get();
			self._appState = current_hash;
			iframeWrapper.init().put(current_hash);
			self.callback(current_hash);
			setInterval(self.check, 100);
		},
		check: function() {
			var iframe_hash = iframeWrapper.get(),
				location_hash = locationWrapper.get();

			if (location_hash != iframe_hash) {
				if (location_hash == self._appState) {	  // user used Back or Forward button
					self._appState = iframe_hash;
					locationWrapper.put(iframe_hash);
					self.callback(iframe_hash);
				} else {							  // user loaded new bookmark
					self._appState = location_hash;
					iframeWrapper.put(location_hash);
					self.callback(location_hash);
				}
			}
		},
		load: function(hash) {
			if(hash != self._appState) {
				locationWrapper.put(hash);
				iframeWrapper.put(hash);
				self._appState = hash;
				self.callback(hash);
			}
		}
	};

	implementations.hashchangeEvent = {
		_init: function() {
			self.callback(locationWrapper.get());
			$(window).bind('hashchange', self.check);
		},
		check: function() {
			self.callback(locationWrapper.get());
		},
		load: function(hash) {
			locationWrapper.put(hash);
		}
	};

	var self = $.extend({}, implementations.base);

	if($.browser.msie && ($.browser.version < 8 || document.documentMode < 8)) {
		self.type = 'iframeTimer';
	} else if("onhashchange" in window) {
		self.type = 'hashchangeEvent';
	} else {
		self.type = 'timer';
	}

	$.extend(self, implementations[self.type]);
	$.history = self;
})(jQuery);