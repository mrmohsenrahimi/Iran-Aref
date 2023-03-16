/**
 * Global variables
 */
"use strict";

var userAgent = navigator.userAgent.toLowerCase(),
	initialDate = new Date(),

	$document = $( document ),
	$html = $( "html" ),

	isDesktop = $html.hasClass( "desktop" ),
	isIE = userAgent.indexOf( "msie" ) != -1 ? parseInt( userAgent.split( "msie" )[ 1 ] ) : userAgent.indexOf( "trident" ) != -1 ? 11 : userAgent.indexOf( "edge" ) != -1 ? 12 : false,
	isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test( navigator.userAgent ),
	isNoviBuilder,

	plugins = {
		responsiveTabs: $( ".responsive-tabs" ),
		rdInputLabel: $( ".form-label" ),
		rdNavbar: $( ".rd-navbar" ),
		regula: $( "[data-constraints]" ),
		photoSwipeGallery: $( "[data-photo-swipe-item]" ),
		isotope: $( ".isotope" ),
		customToggle: $( "[data-custom-toggle]" ),
		search: $( ".rd-search" ),
		searchResults: $( '.rd-search-results' ),
		rdMailForm: $( ".rd-mailform" ),
		copyrightYear: $( "#copyright-year" ),
		materialParallax: $( ".parallax-container" ),
		maps: $( ".google-map-container" ),
		lightGallery: $( "[data-lightgallery='group']" ),
		lightGalleryItem: $( "[data-lightgallery='item']" ),
		lightDynamicGalleryItem: $( "[data-lightgallery='dynamic']" )
	};

/**
 * Initialize All Scripts
 */
$document.ready( function () {
	isNoviBuilder = window.xMode;

	/**
	 * Google map function for getting latitude and longitude
	 */
	function getLatLngObject ( str, marker, map, callback ) {
		var coordinates = {};
		try {
			coordinates = JSON.parse( str );
			callback( new google.maps.LatLng(
				coordinates.lat,
				coordinates.lng
			), marker, map )
		} catch ( e ) {
			map.geocoder.geocode( { 'address': str }, function ( results, status ) {
				if ( status === google.maps.GeocoderStatus.OK ) {
					var latitude = results[ 0 ].geometry.location.lat();
					var longitude = results[ 0 ].geometry.location.lng();

					callback( new google.maps.LatLng(
						parseFloat( latitude ),
						parseFloat( longitude )
					), marker, map )
				}
			} )
		}
	}

	/**
	 * Live Search
	 * @description  create live search results
	 */
	function liveSearch ( options ) {
		$( '#' + options.live ).removeClass( 'cleared' ).html();
		options.current++;
		options.spin.addClass( 'loading' );
		$.get( handler, {
			s: decodeURI( options.term ),
			liveSearch: options.live,
			dataType: "html",
			liveCount: options.liveCount,
			filter: options.filter,
			template: options.template
		}, function ( data ) {
			options.processed++;
			var live = $( '#' + options.live );
			if ( options.processed == options.current && !live.hasClass( 'cleared' ) ) {
				live.find( '> #search-results' ).removeClass( 'active' );
				live.html( data );
				setTimeout( function () {
					live.find( '> #search-results' ).addClass( 'active' );
				}, 50 );
			}
			options.spin.parents( '.rd-search' ).find( '.input-group-addon' ).removeClass( 'loading' );
		} )
	}

	/**
	 * attachFormValidator
	 * @description  attach form validation to elements
	 */
	function attachFormValidator ( elements ) {
		for ( var i = 0; i < elements.length; i++ ) {
			var o = $( elements[ i ] ), v;
			o.addClass( "form-control-has-validation" ).after( "<span class='form-validation'></span>" );
			v = o.parent().find( ".form-validation" );
			if ( v.is( ":last-child" ) ) {
				o.addClass( "form-control-last-child" );
			}
		}

		elements
			.on( 'input change propertychange blur', function ( e ) {
				var $this = $( this ), results;

				if ( e.type !== "blur" ) {
					if ( !$this.parent().hasClass( "has-error" ) ) {
						return;
					}
				}

				if ( $this.parents( '.rd-mailform' ).hasClass( 'success' ) ) {
					return;
				}

				if ( (results = $this.regula( 'validate' )).length ) {
					for ( i = 0; i < results.length; i++ ) {
						$this.siblings( ".form-validation" ).text( results[ i ].message ).parent().addClass( "has-error" )
					}
				} else {
					$this.siblings( ".form-validation" ).text( "" ).parent().removeClass( "has-error" )
				}
			} )
			.regula( 'bind' );

		var regularConstraintsMessages = [
			{
				type: regula.Constraint.Required,
				newMessage: "The text field is required."
			},
			{
				type: regula.Constraint.Email,
				newMessage: "The email is not a valid email."
			},
			{
				type: regula.Constraint.Numeric,
				newMessage: "Only numbers are required"
			},
			{
				type: regula.Constraint.Selected,
				newMessage: "Please choose an option."
			}
		];

		for ( var i = 0; i < regularConstraintsMessages.length; i++ ) {
			var regularConstraint = regularConstraintsMessages[ i ];

			regula.override( {
				constraintType: regularConstraint.type,
				defaultMessage: regularConstraint.newMessage
			} );
		}
	}

	/**
	 * isValidated
	 * @description  check if all elemnts pass validation
	 */
	function isValidated ( elements, captcha ) {
		var results, errors = 0;

		if ( elements.length ) {
			for ( j = 0; j < elements.length; j++ ) {

				var $input = $( elements[ j ] );
				if ( (results = $input.regula( 'validate' )).length ) {
					for ( k = 0; k < results.length; k++ ) {
						errors++;
						$input.siblings( ".form-validation" ).text( results[ k ].message ).parent().addClass( "has-error" );
					}
				} else {
					$input.siblings( ".form-validation" ).text( "" ).parent().removeClass( "has-error" )
				}
			}

			if ( captcha ) {
				if ( captcha.length ) {
					return validateReCaptcha( captcha ) && errors == 0
				}
			}

			return errors == 0;
		}
		return true;
	}

	/**
	 * validateReCaptcha
	 * @description  validate google reCaptcha
	 */
	function validateReCaptcha ( captcha ) {
		var captchaToken = captcha.find( '.g-recaptcha-response' ).val();

		if ( captchaToken.length === 0 ) {
			captcha
				.siblings( '.form-validation' )
				.html( 'Please, prove that you are not robot.' )
				.addClass( 'active' );
			captcha
				.closest( '.form-group' )
				.addClass( 'has-error' );

			captcha.on( 'propertychange', function () {
				var $this = $( this ),
					captchaToken = $this.find( '.g-recaptcha-response' ).val();

				if ( captchaToken.length > 0 ) {
					$this
						.closest( '.form-group' )
						.removeClass( 'has-error' );
					$this
						.siblings( '.form-validation' )
						.removeClass( 'active' )
						.html( '' );
					$this.off( 'propertychange' );
				}
			} );

			return false;
		}

		return true;
	}

	/**
	 * onloadCaptchaCallback
	 * @description  init google reCaptcha
	 */
	window.onloadCaptchaCallback = function () {
		for ( i = 0; i < plugins.captcha.length; i++ ) {
			var $capthcaItem = $( plugins.captcha[ i ] );

			grecaptcha.render(
				$capthcaItem.attr( 'id' ),
				{
					sitekey: $capthcaItem.attr( 'data-sitekey' ),
					size: $capthcaItem.attr( 'data-size' ) ? $capthcaItem.attr( 'data-size' ) : 'normal',
					theme: $capthcaItem.attr( 'data-theme' ) ? $capthcaItem.attr( 'data-theme' ) : 'light',
					callback: function ( e ) {
						$( '.recaptcha' ).trigger( 'propertychange' );
					}
				}
			);
			$capthcaItem.after( "<span class='form-validation'></span>" );
		}
	};

	// IE Classes
	if ( isIE ) {
		if ( isIE < 10 ) $html.addClass( "lt-ie-10" );
		if ( isIE < 11 ) $html.addClass( "ie-10" );
		if ( isIE === 11 ) $( "html" ).addClass( "ie-11" );
		if ( isIE >= 12 ) $( "html" ).addClass( "ie-edge" );
	}

	// Copyright Year
	if ( plugins.copyrightYear.length ) {
		plugins.copyrightYear.text( initialDate.getFullYear() );
	}

	// Responsive Tabs
	if ( plugins.responsiveTabs.length ) {
		var i = 0;
		for ( i = 0; i < plugins.responsiveTabs.length; i++ ) {
			var $this = $( plugins.responsiveTabs[ i ] );
			$this.easyResponsiveTabs( {
				type: $this.attr( "data-type" ),
				tabidentify: $this.find( ".resp-tabs-list" ).attr( "data-group" ) || "tab"
			} );
		}
	}

	// RD Input Label
	if ( plugins.rdInputLabel.length ) {
		plugins.rdInputLabel.RDInputLabel();
	}

	// Regula
	if ( plugins.regula.length ) {
		attachFormValidator( plugins.regula );
	}

	// WOW
	if ( !isNoviBuilder && $html.hasClass( 'desktop' ) && $html.hasClass( "wow-animation" ) && $( ".wow" ).length ) {
		new WOW().init();
	}

	// Isotope
	if ( plugins.isotope.length ) {
		var i, isogroup = [];
		for ( i = 0; i < plugins.isotope.length; i++ ) {
			var
				isotopeItem = plugins.isotope[ i ],
				iso = new Isotope( isotopeItem, {
					itemSelector: '.isotope-item',
					layoutMode: isotopeItem.getAttribute( 'data-isotope-layout' ) ? isotopeItem.getAttribute( 'data-isotope-layout' ) : 'masonry',
					filter: '*'
				} );

			isogroup.push( iso );
		}

		setTimeout( function () {
			for ( var i = 0; i < isogroup.length; i++ ) {
				var isotope = isogroup[ i ];
				isotope.element.className += " isotope--loaded";
				isotope.layout();
				window.addEventListener( 'resize', (function () {
					this.layout();
				}).bind( isotope ) );
			}
		}, 600 );

		$( "[data-isotope-filter]" ).on( "click", function ( e ) {
			e.preventDefault();
			var filter = $( this );
			filter.parents( ".isotope-filters" ).find( '.active' ).removeClass( "active" );
			filter.addClass( "active" );
			var iso = $( '.isotope[data-isotope-group="' + this.getAttribute( "data-isotope-group" ) + '"]' );
			iso.isotope( {
				itemSelector: '.isotope-item',
				layoutMode: iso.attr( 'data-isotope-layout' ) ? iso.attr( 'data-isotope-layout' ) : 'masonry',
				filter: this.getAttribute( "data-isotope-filter" ) == '*' ? '*' : '[data-filter*="' + this.getAttribute( "data-isotope-filter" ) + '"]'
			} );
		} ).eq( 0 ).trigger( "click" );


	}

	// RD Navbar
	if ( plugins.rdNavbar.length ) {
		var navbar = plugins.rdNavbar,
			aliases = { '0': '-', '480': '-xs-', '768': '-sm-', '992': '-md-', '1200': '-lg-' },
			responsiveNavbar = {};

		for ( var alias in aliases ) {
			responsiveNavbar[ alias ] = {};
			if ( navbar.attr( 'data' + aliases[ alias ] + 'layout' ) ) responsiveNavbar[ alias ].layout = navbar.attr( 'data' + aliases[ alias ] + 'layout' );
			else responsiveNavbar[ alias ].layout = 'rd-navbar-fixed';
			if ( navbar.attr( 'data' + aliases[ alias ] + 'device-layout' ) ) responsiveNavbar[ alias ].deviceLayout = navbar.attr( 'data' + aliases[ alias ] + 'device-layout' );
			else responsiveNavbar[ alias ].deviceLayout = 'rd-navbar-fixed';
			if ( navbar.attr( 'data' + aliases[ alias ] + 'hover-on' ) ) responsiveNavbar[ alias ].focusOnHover = navbar.attr( 'data' + aliases[ alias ] + 'hover-on' ) === 'true';
			if ( navbar.attr( 'data' + aliases[ alias ] + 'auto-height' ) ) responsiveNavbar[ alias ].autoHeight = navbar.attr( 'data' + aliases[ alias ] + 'auto-height' ) === 'true';
			if ( navbar.attr( 'data' + aliases[ alias ] + 'stick-up-offset' ) ) responsiveNavbar[ alias ].stickUpOffset = navbar.attr( 'data' + aliases[ alias ] + 'stick-up-offset' );
			if ( navbar.attr( 'data' + aliases[ alias ] + 'stick-up' ) && !isNoviBuilder ) responsiveNavbar[ alias ].stickUp = navbar.attr( 'data' + aliases[ alias ] + 'stick-up' ) === 'true';
			else responsiveNavbar[ alias ].stickUp = false;

			if ( $.isEmptyObject( responsiveNavbar[ alias ] ) ) delete responsiveNavbar[ alias ];
		}

		navbar.RDNavbar( {
			stickUpClone: ( !isNoviBuilder && navbar.attr( "data-stick-up-clone" ) ) ? navbar.attr( "data-stick-up-clone" ) === 'true' : false,
			stickUpOffset: ( navbar.attr( "data-stick-up-offset" ) ) ? navbar.attr( "data-stick-up-offset" ) : 1,
			anchorNavOffset: -78,
			anchorNav: !isNoviBuilder,
			anchorNavEasing: 'linear',
			focusOnHover: !isNoviBuilder,
			responsive: responsiveNavbar,
			onDropdownOver: function () {
				return !isNoviBuilder;
			}
		} );

		if ( navbar.attr( "data-body-class" ) ) {
			document.body.className += ' ' + navbar.attr( "data-body-class" );
		}
	}

	// RD Search
	if ( plugins.search.length || plugins.searchResults ) {
		var handler = "bat/rd-search.php";
		var defaultTemplate = '<h5 class="search_title"><a target="_top" href="#{href}" class="search_link">#{title}</a></h5>' +
			'<p>...#{token}...</p>' +
			'<p class="match"><em>Terms matched: #{count} - URL: #{href}</em></p>';
		var defaultFilter = '*.html';

		if ( plugins.search.length ) {

			for ( i = 0; i < plugins.search.length; i++ ) {
				var searchItem = $( plugins.search[ i ] ),
					options = {
						element: searchItem,
						filter: (searchItem.attr( 'data-search-filter' )) ? searchItem.attr( 'data-search-filter' ) : defaultFilter,
						template: (searchItem.attr( 'data-search-template' )) ? searchItem.attr( 'data-search-template' ) : defaultTemplate,
						live: (searchItem.attr( 'data-search-live' )) ? searchItem.attr( 'data-search-live' ) : false,
						liveCount: (searchItem.attr( 'data-search-live-count' )) ? parseInt( searchItem.attr( 'data-search-live' ) ) : 4,
						current: 0, processed: 0, timer: {}
					};

				if ( $( '.rd-navbar-search-toggle' ).length ) {
					var toggle = $( '.rd-navbar-search-toggle' );
					toggle.on( 'click', function () {
						if ( !($( this ).hasClass( 'active' )) ) {
							searchItem.find( 'input' ).val( '' ).trigger( 'propertychange' );
						}
					} );
				}

				if ( options.live ) {
					searchItem.find( 'input' ).on( "keyup input propertychange", $.proxy( function () {
						this.term = this.element.find( 'input' ).val().trim();
						this.spin = this.element.find( '.input-group-addon' );
						clearTimeout( this.timer );

						if ( this.term.length > 2 ) {
							this.timer = setTimeout( liveSearch( this ), 200 );
						} else if ( this.term.length == 0 ) {
							$( '#' + this.live ).addClass( 'cleared' ).html( '' );
						}
					}, options, this ) );
				}

				searchItem.submit( $.proxy( function () {
					$( '<input />' ).attr( 'type', 'hidden' )
						.attr( 'name', "filter" )
						.attr( 'value', this.filter )
						.appendTo( this.element );
					return true;
				}, options, this ) )
			}
		}

		if ( plugins.searchResults.length ) {
			var regExp = /\?.*s=([^&]+)\&filter=([^&]+)/g;
			var match = regExp.exec( location.search );

			if ( match != null ) {
				$.get( handler, {
					s: decodeURI( match[ 1 ] ),
					dataType: "html",
					filter: match[ 2 ],
					template: defaultTemplate,
					live: ''
				}, function ( data ) {
					plugins.searchResults.html( data );
				} )
			}
		}
	}

	// UI To Top
	if ( !isNoviBuilder && isDesktop ) {
		$().UItoTop( {
			easingType: 'easeOutQuart',
			containerClass: 'ui-to-top icon icon-xs icon-circle icon-darker-filled mdi mdi-chevron-up'
		} );
	}

	// RD Mailform
	if ( plugins.rdMailForm.length ) {
		var i, j, k,
			msg = {
				'MF000': 'Successfully sent!',
				'MF001': 'Recipients are not set!',
				'MF002': 'Form will not work locally!',
				'MF003': 'Please, define email field in your form!',
				'MF004': 'Please, define type of your form!',
				'MF254': 'Something went wrong with PHPMailer!',
				'MF255': 'Aw, snap! Something went wrong.'
			};

		for ( i = 0; i < plugins.rdMailForm.length; i++ ) {
			var $form = $( plugins.rdMailForm[ i ] ),
				formHasCaptcha = false;

			$form.attr( 'novalidate', 'novalidate' ).ajaxForm( {
				data: {
					"form-type": $form.attr( "data-form-type" ) || "contact",
					"counter": i
				},
				beforeSubmit: function ( arr, $form, options ) {

					var form = $( plugins.rdMailForm[ this.extraData.counter ] ),
						inputs = form.find( "[data-constraints]" ),
						output = $( "#" + form.attr( "data-form-output" ) ),
						captcha = form.find( '.recaptcha' ),
						captchaFlag = true;

					output.removeClass( "active error success" );

					if ( isValidated( inputs, captcha ) ) {

						// veify reCaptcha
						if ( captcha.length ) {
							var captchaToken = captcha.find( '.g-recaptcha-response' ).val(),
								captchaMsg = {
									'CPT001': 'Please, setup you "site key" and "secret key" of reCaptcha',
									'CPT002': 'Something wrong with google reCaptcha'
								};

							formHasCaptcha = true;

							$.ajax( {
								method: "POST",
								url: "bat/reCaptcha.php",
								data: { 'g-recaptcha-response': captchaToken },
								async: false
							} )
								.done( function ( responceCode ) {
									if ( responceCode !== 'CPT000' ) {
										if ( output.hasClass( "snackbars" ) ) {
											output.html( '<p><span class="icon text-middle mdi mdi-check icon-xxs"></span><span>' + captchaMsg[ responceCode ] + '</span></p>' )

											setTimeout( function () {
												output.removeClass( "active" );
											}, 3500 );

											captchaFlag = false;
										} else {
											output.html( captchaMsg[ responceCode ] );
										}

										output.addClass( "active" );
									}
								} );
						}

						if ( !captchaFlag ) {
							return false;
						}

						form.addClass( 'form-in-process' );

						if ( output.hasClass( "snackbars" ) ) {
							output.html( '<p><span class="icon text-middle fa fa-circle-o-notch fa-spin icon-xxs"></span><span>Sending</span></p>' );
							output.addClass( "active" );
						}
					} else {
						return false;
					}
				},
				error: function ( result ) {

					var output = $( "#" + $( plugins.rdMailForm[ this.extraData.counter ] ).attr( "data-form-output" ) ),
						form = $( plugins.rdMailForm[ this.extraData.counter ] );

					output.text( msg[ result ] );
					form.removeClass( 'form-in-process' );

					if ( formHasCaptcha ) {
						grecaptcha.reset();
					}
				},
				success: function ( result ) {

					var form = $( plugins.rdMailForm[ this.extraData.counter ] ),
						output = $( "#" + form.attr( "data-form-output" ) ),
						select = form.find( 'select' );

					form
						.addClass( 'success' )
						.removeClass( 'form-in-process' );

					if ( formHasCaptcha ) {
						grecaptcha.reset();
					}

					result = result.length === 5 ? result : 'MF255';
					output.text( msg[ result ] );

					if ( result === "MF000" ) {
						if ( output.hasClass( "snackbars" ) ) {
							output.html( '<p><span class="icon text-middle mdi mdi-check icon-xxs"></span><span>' + msg[ result ] + '</span></p>' );
						} else {
							output.addClass( "active success" );
						}
					} else {
						if ( output.hasClass( "snackbars" ) ) {
							output.html( ' <p class="snackbars-left"><span class="icon icon-xxs mdi mdi-alert-outline text-middle"></span><span>' + msg[ result ] + '</span></p>' );
						} else {
							output.addClass( "active error" );
						}
					}

					form.clearForm();

					if ( select.length ) {
						select.select2( "val", "" );
					}

					form.find( 'input, textarea' ).trigger( 'blur' );

					setTimeout( function () {
						output.removeClass( "active error success" );
						form.removeClass( 'success' );
					}, 3500 );
				}
			} );
		}
	}

	// Custom Toggles
	if ( plugins.customToggle.length ) {
		var i;
		for ( i = 0; i < plugins.customToggle.length; i++ ) {
			var $this = $( plugins.customToggle[ i ] );
			$this.on( 'click', function ( e ) {
				e.preventDefault();
				$( "#" + $( this ).attr( 'data-custom-toggle' ) ).add( this ).toggleClass( 'active' );
			} );

			if ( $this.attr( "data-custom-toggle-disable-on-blur" ) === "true" ) {
				$( "body" ).on( "click", $this, function ( e ) {
					if ( e.target !== e.data[ 0 ] && $( "#" + e.data.attr( 'data-custom-toggle' ) ).find( $( e.target ) ).length == 0 && e.data.find( $( e.target ) ).length == 0 ) {
						$( "#" + e.data.attr( 'data-custom-toggle' ) ).add( e.data[ 0 ] ).removeClass( 'active' );
					}
				} )
			}
		}
	}

	// Material Parallax
	if ( plugins.materialParallax.length ) {
		if ( !isNoviBuilder && !isIE && !isMobile ) {
			plugins.materialParallax.parallax();
		} else {
			for ( var i = 0; i < plugins.materialParallax.length; i++ ) {
				var $parallax = $( plugins.materialParallax[ i ] );

				$parallax.addClass( 'parallax-disabled' );
				$parallax.css( { "background-image": 'url(' + $parallax.data( "parallax-img" ) + ')' } );
			}
		}
	}

	// Google maps
	if ( plugins.maps.length ) {
		var key;

		for ( var i = 0; i < plugins.maps.length; i++ ) {
			if ( plugins.maps[ i ].hasAttribute( "data-key" ) ) {
				key = plugins.maps[ i ].getAttribute( "data-key" );
				break;
			}
		}

		$.getScript( '//maps.google.com/maps/api/js?' + ( key ? 'key=' + key + '&' : '' ) + 'sensor=false&libraries=geometry,places&v=3.7', function () {
			var head = document.getElementsByTagName( 'head' )[ 0 ],
				insertBefore = head.insertBefore;

			head.insertBefore = function ( newElement, referenceElement ) {
				if ( newElement.href && newElement.href.indexOf( '../../https@fonts.googleapis.com/css@family=Roboto' ) !== -1 || newElement.innerHTML.indexOf( 'gm-style' ) !== -1 ) {
					return;
				}
				insertBefore.call( head, newElement, referenceElement );
			};
			var geocoder = new google.maps.Geocoder;
			for ( var i = 0; i < plugins.maps.length; i++ ) {
				var zoom = parseInt( plugins.maps[ i ].getAttribute( "data-zoom" ), 10 ) || 11;
				var styles = plugins.maps[ i ].hasAttribute( 'data-styles' ) ? JSON.parse( plugins.maps[ i ].getAttribute( "data-styles" ) ) : [];
				var center = plugins.maps[ i ].getAttribute( "data-center" ) || "New York";

				// Initialize map
				var map = new google.maps.Map( plugins.maps[ i ].querySelectorAll( ".google-map" )[ 0 ], {
					zoom: zoom,
					styles: styles,
					scrollwheel: false,
					center: { lat: 0, lng: 0 }
				} );

				// Add map object to map node
				plugins.maps[ i ].map = map;
				plugins.maps[ i ].geocoder = geocoder;
				plugins.maps[ i ].google = google;

				// Get Center coordinates from attribute
				getLatLngObject( center, null, plugins.maps[ i ], function ( location, markerElement, mapElement ) {
					mapElement.map.setCenter( location );
				} );

				// Add markers from google-map-markers array
				var markerItems = plugins.maps[ i ].querySelectorAll( ".google-map-markers li" );

				if ( markerItems.length ) {
					var markers = [];
					for ( var j = 0; j < markerItems.length; j++ ) {
						var markerElement = markerItems[ j ];
						getLatLngObject( markerElement.getAttribute( "data-location" ), markerElement, plugins.maps[ i ], function ( location, markerElement, mapElement ) {
							var icon = markerElement.getAttribute( "data-icon" ) || mapElement.getAttribute( "data-icon" );
							var activeIcon = markerElement.getAttribute( "data-icon-active" ) || mapElement.getAttribute( "data-icon-active" );
							var info = markerElement.getAttribute( "data-description" ) || "";
							var infoWindow = new google.maps.InfoWindow( {
								content: info
							} );
							markerElement.infoWindow = infoWindow;
							var markerData = {
								position: location,
								map: mapElement.map
							}
							if ( icon ) {
								markerData.icon = icon;
							}
							var marker = new google.maps.Marker( markerData );
							markerElement.gmarker = marker;
							markers.push( { markerElement: markerElement, infoWindow: infoWindow } );
							marker.isActive = false;
							// Handle infoWindow close click
							google.maps.event.addListener( infoWindow, 'closeclick', (function ( markerElement, mapElement ) {
								var markerIcon = null;
								markerElement.gmarker.isActive = false;
								markerIcon = markerElement.getAttribute( "data-icon" ) || mapElement.getAttribute( "data-icon" );
								markerElement.gmarker.setIcon( markerIcon );
							}).bind( this, markerElement, mapElement ) );


							// Set marker active on Click and open infoWindow
							google.maps.event.addListener( marker, 'click', (function ( markerElement, mapElement ) {
								if ( markerElement.infoWindow.getContent().length === 0 ) return;
								var gMarker, currentMarker = markerElement.gmarker, currentInfoWindow;
								for ( var k = 0; k < markers.length; k++ ) {
									var markerIcon;
									if ( markers[ k ].markerElement === markerElement ) {
										currentInfoWindow = markers[ k ].infoWindow;
									}
									gMarker = markers[ k ].markerElement.gmarker;
									if ( gMarker.isActive && markers[ k ].markerElement !== markerElement ) {
										gMarker.isActive = false;
										markerIcon = markers[ k ].markerElement.getAttribute( "data-icon" ) || mapElement.getAttribute( "data-icon" )
										gMarker.setIcon( markerIcon );
										markers[ k ].infoWindow.close();
									}
								}

								currentMarker.isActive = !currentMarker.isActive;
								if ( currentMarker.isActive ) {
									if ( markerIcon = markerElement.getAttribute( "data-icon-active" ) || mapElement.getAttribute( "data-icon-active" ) ) {
										currentMarker.setIcon( markerIcon );
									}

									currentInfoWindow.open( map, marker );
								} else {
									if ( markerIcon = markerElement.getAttribute( "data-icon" ) || mapElement.getAttribute( "data-icon" ) ) {
										currentMarker.setIcon( markerIcon );
									}
									currentInfoWindow.close();
								}
							}).bind( this, markerElement, mapElement ) )
						} )
					}
				}
			}
		} );
	}

	// lightGallery
	function initLightGallery ( itemsToInit, addClass ) {
		$( itemsToInit ).lightGallery( {
			thumbnail: $( itemsToInit ).attr( "data-lg-thumbnail" ) !== "false",
			selector: "[data-lightgallery='item']",
			autoplay: $( itemsToInit ).attr( "data-lg-autoplay" ) === "true",
			pause: parseInt( $( itemsToInit ).attr( "data-lg-autoplay-delay" ) ) || 5000,
			addClass: addClass,
			mode: $( itemsToInit ).attr( "data-lg-animation" ) || "lg-slide",
			loop: $( itemsToInit ).attr( "data-lg-loop" ) !== "false"
		} );
	}

	function initDynamicLightGallery ( itemsToInit, addClass ) {
		$( itemsToInit ).on( "click", function () {
			$( itemsToInit ).lightGallery( {
				thumbnail: $( itemsToInit ).attr( "data-lg-thumbnail" ) !== "false",
				selector: "[data-lightgallery='item']",
				autoplay: $( itemsToInit ).attr( "data-lg-autoplay" ) === "true",
				pause: parseInt( $( itemsToInit ).attr( "data-lg-autoplay-delay" ) ) || 5000,
				addClass: addClass,
				mode: $( itemsToInit ).attr( "data-lg-animation" ) || "lg-slide",
				loop: $( itemsToInit ).attr( "data-lg-loop" ) !== "false",
				dynamic: true,
				dynamicEl:
				JSON.parse( $( itemsToInit ).attr( "data-lg-dynamic-elements" ) ) || []
			} );
		} );
	}

	function initLightGalleryItem ( itemToInit, addClass ) {
		$( itemToInit ).lightGallery( {
			selector: "this",
			addClass: addClass,
			counter: false,
			youtubePlayerParams: {
				modestbranding: 1,
				showinfo: 0,
				rel: 0,
				controls: 0
			},
			vimeoPlayerParams: {
				byline: 0,
				portrait: 0
			}
		} );
	}

	if ( !isNoviBuilder && plugins.lightGallery.length ) {
		for ( var i = 0; i < plugins.lightGallery.length; i++ ) initLightGallery( plugins.lightGallery[ i ] );
	}

	if ( !isNoviBuilder && plugins.lightGalleryItem.length ) {
		for ( var i = 0; i < plugins.lightGalleryItem.length; i++ ) initLightGalleryItem( plugins.lightGalleryItem[ i ] );
	}

	if ( !isNoviBuilder && plugins.lightDynamicGalleryItem.length ) {
		for ( var i = 0; i < plugins.lightDynamicGalleryItem.length; i++ ) initDynamicLightGallery( plugins.lightDynamicGalleryItem[ i ] );
	}
} );
