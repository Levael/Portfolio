const AudioContext = {

	getContext: function () {

		if ( _context === undefined ) {

			_context = new ( window.AudioContext || window.webkitAudioContext )();

		}

		return _context;

	},

	setContext: function ( value ) {

		_context = value;

	}

};

const Cache = {

	enabled: false,

	files: {},

	add: function ( key, file ) {

		if ( this.enabled === false ) return;

		// console.log( 'THREE.Cache', 'Adding key:', key );

		this.files[ key ] = file;

	},

	get: function ( key ) {

		if ( this.enabled === false ) return;

		// console.log( 'THREE.Cache', 'Checking key:', key );

		return this.files[ key ];

	},

	remove: function ( key ) {

		delete this.files[ key ];

	},

	clear: function () {

		this.files = {};

	}

};

function DefaultLoadingManager( onLoad, onProgress, onError ) {

	const scope = this;

	let isLoading = false;
	let itemsLoaded = 0;
	let itemsTotal = 0;
	let urlModifier = undefined;
	const handlers = [];

	// Refer to #5689 for the reason why we don't set .onStart
	// in the constructor

	this.onStart = undefined;
	this.onLoad = onLoad;
	this.onProgress = onProgress;
	this.onError = onError;

	this.itemStart = function ( url ) {

		itemsTotal ++;

		if ( isLoading === false ) {

			if ( scope.onStart !== undefined ) {

				scope.onStart( url, itemsLoaded, itemsTotal );

			}

		}

		isLoading = true;

	};

	this.itemEnd = function ( url ) {

		itemsLoaded ++;

		if ( scope.onProgress !== undefined ) {

			scope.onProgress( url, itemsLoaded, itemsTotal );

		}

		if ( itemsLoaded === itemsTotal ) {

			isLoading = false;

			if ( scope.onLoad !== undefined ) {

				scope.onLoad();

			}

		}

	};

	this.itemError = function ( url ) {

		if ( scope.onError !== undefined ) {

			scope.onError( url );

		}

	};

	this.resolveURL = function ( url ) {

		if ( urlModifier ) {

			return urlModifier( url );

		}

		return url;

	};

	this.setURLModifier = function ( transform ) {

		urlModifier = transform;

		return this;

	};

	this.addHandler = function ( regex, loader ) {

		handlers.push( regex, loader );

		return this;

	};

	this.removeHandler = function ( regex ) {

		const index = handlers.indexOf( regex );

		if ( index !== - 1 ) {

			handlers.splice( index, 2 );

		}

		return this;

	};

	this.getHandler = function ( file ) {

		for ( let i = 0, l = handlers.length; i < l; i += 2 ) {

			const regex = handlers[ i ];
			const loader = handlers[ i + 1 ];

			if ( regex.global ) regex.lastIndex = 0; // see #17920

			if ( regex.test( file ) ) {

				return loader;

			}

		}

		return null;

	};

}

function Loader( manager ) {

	this.manager = ( manager !== undefined ) ? manager : DefaultLoadingManager;

	this.crossOrigin = 'anonymous';
	this.withCredentials = false;
	this.path = '';
	this.resourcePath = '';
	this.requestHeader = {};

}

Object.assign( Loader.prototype, {

	load: function ( /* url, onLoad, onProgress, onError */ ) {},

	loadAsync: function ( url, onProgress ) {

		const scope = this;

		return new Promise( function ( resolve, reject ) {

			scope.load( url, resolve, onProgress, reject );

		} );

	},

	parse: function ( /* data */ ) {},

	setCrossOrigin: function ( crossOrigin ) {

		this.crossOrigin = crossOrigin;
		return this;

	},

	setWithCredentials: function ( value ) {

		this.withCredentials = value;
		return this;

	},

	setPath: function ( path ) {

		this.path = path;
		return this;

	},

	setResourcePath: function ( resourcePath ) {

		this.resourcePath = resourcePath;
		return this;

	},

	setRequestHeader: function ( requestHeader ) {

		this.requestHeader = requestHeader;
		return this;

	}

} );
const loading = {};

function FileLoader( manager ) {

	Loader.call( this, manager );

}

FileLoader.prototype = Object.assign( Object.create( Loader.prototype ), {

	constructor: FileLoader,

	load: function ( url, onLoad, onProgress, onError ) {

		if ( url === undefined ) url = '';

		if ( this.path !== undefined ) url = this.path + url;

		url = this.manager.resolveURL( url );

		const scope = this;

		const cached = Cache.get( url );

		if ( cached !== undefined ) {

			scope.manager.itemStart( url );

			setTimeout( function () {

				if ( onLoad ) onLoad( cached );

				scope.manager.itemEnd( url );

			}, 0 );

			return cached;

		}

		// Check if request is duplicate

		if ( loading[ url ] !== undefined ) {

			loading[ url ].push( {

				onLoad: onLoad,
				onProgress: onProgress,
				onError: onError

			} );

			return;

		}

		// Check for data: URI
		const dataUriRegex = /^data:(.*?)(;base64)?,(.*)$/;
		const dataUriRegexResult = url.match( dataUriRegex );
		let request;

		// Safari can not handle Data URIs through XMLHttpRequest so process manually
		if ( dataUriRegexResult ) {

			const mimeType = dataUriRegexResult[ 1 ];
			const isBase64 = !! dataUriRegexResult[ 2 ];

			let data = dataUriRegexResult[ 3 ];
			data = decodeURIComponent( data );

			if ( isBase64 ) data = atob( data );

			try {

				let response;
				const responseType = ( this.responseType || '' ).toLowerCase();

				switch ( responseType ) {

					case 'arraybuffer':
					case 'blob':

						const view = new Uint8Array( data.length );

						for ( let i = 0; i < data.length; i ++ ) {

							view[ i ] = data.charCodeAt( i );

						}

						if ( responseType === 'blob' ) {

							response = new Blob( [ view.buffer ], { type: mimeType } );

						} else {

							response = view.buffer;

						}

						break;

					case 'document':

						const parser = new DOMParser();
						response = parser.parseFromString( data, mimeType );

						break;

					case 'json':

						response = JSON.parse( data );

						break;

					default: // 'text' or other

						response = data;

						break;

				}

				// Wait for next browser tick like standard XMLHttpRequest event dispatching does
				setTimeout( function () {

					if ( onLoad ) onLoad( response );

					scope.manager.itemEnd( url );

				}, 0 );

			} catch ( error ) {

				// Wait for next browser tick like standard XMLHttpRequest event dispatching does
				setTimeout( function () {

					if ( onError ) onError( error );

					scope.manager.itemError( url );
					scope.manager.itemEnd( url );

				}, 0 );

			}

		} else {

			// Initialise array for duplicate requests

			loading[ url ] = [];

			loading[ url ].push( {

				onLoad: onLoad,
				onProgress: onProgress,
				onError: onError

			} );

			request = new XMLHttpRequest();

			request.open( 'GET', url, true );

			request.addEventListener( 'load', function ( event ) {

				const response = this.response;

				const callbacks = loading[ url ];

				delete loading[ url ];

				if ( this.status === 200 || this.status === 0 ) {

					// Some browsers return HTTP Status 0 when using non-http protocol
					// e.g. 'file://' or 'data://'. Handle as success.

					if ( this.status === 0 ) console.warn( 'THREE.FileLoader: HTTP Status 0 received.' );

					// Add to cache only on HTTP success, so that we do not cache
					// error response bodies as proper responses to requests.
					Cache.add( url, response );

					for ( let i = 0, il = callbacks.length; i < il; i ++ ) {

						const callback = callbacks[ i ];
						if ( callback.onLoad ) callback.onLoad( response );

					}

					scope.manager.itemEnd( url );

				} else {

					for ( let i = 0, il = callbacks.length; i < il; i ++ ) {

						const callback = callbacks[ i ];
						if ( callback.onError ) callback.onError( event );

					}

					scope.manager.itemError( url );
					scope.manager.itemEnd( url );

				}

			}, false );

			request.addEventListener( 'progress', function ( event ) {

				const callbacks = loading[ url ];

				for ( let i = 0, il = callbacks.length; i < il; i ++ ) {

					const callback = callbacks[ i ];
					if ( callback.onProgress ) callback.onProgress( event );

				}

			}, false );

			request.addEventListener( 'error', function ( event ) {

				const callbacks = loading[ url ];

				delete loading[ url ];

				for ( let i = 0, il = callbacks.length; i < il; i ++ ) {

					const callback = callbacks[ i ];
					if ( callback.onError ) callback.onError( event );

				}

				scope.manager.itemError( url );
				scope.manager.itemEnd( url );

			}, false );

			request.addEventListener( 'abort', function ( event ) {

				const callbacks = loading[ url ];

				delete loading[ url ];

				for ( let i = 0, il = callbacks.length; i < il; i ++ ) {

					const callback = callbacks[ i ];
					if ( callback.onError ) callback.onError( event );

				}

				scope.manager.itemError( url );
				scope.manager.itemEnd( url );

			}, false );

			if ( this.responseType !== undefined ) request.responseType = this.responseType;
			if ( this.withCredentials !== undefined ) request.withCredentials = this.withCredentials;

			if ( request.overrideMimeType ) request.overrideMimeType( this.mimeType !== undefined ? this.mimeType : 'text/plain' );

			for ( const header in this.requestHeader ) {

				request.setRequestHeader( header, this.requestHeader[ header ] );

			}

			request.send( null );

		}

		scope.manager.itemStart( url );

		return request;

	},

	setResponseType: function ( value ) {

		this.responseType = value;
		return this;

	},

	setMimeType: function ( value ) {

		this.mimeType = value;
		return this;

	}

} );

class AudioLoader extends Loader {

	constructor( manager ) {

		super( manager );

	}

	load( url, onLoad, onProgress, onError ) {

		const scope = this;

		const loader = new FileLoader( this.manager );
		loader.setResponseType( 'arraybuffer' );
		loader.setPath( this.path );
		loader.setRequestHeader( this.requestHeader );
		loader.setWithCredentials( this.withCredentials );
		loader.load( url, function ( buffer ) {

			try {

				// Create a copy of the buffer. The `decodeAudioData` method
				// detaches the buffer when complete, preventing reuse.
				const bufferCopy = buffer.slice( 0 );

				const context = AudioContext.getContext();
				context.decodeAudioData( bufferCopy, function ( audioBuffer ) {

					onLoad( audioBuffer );

				} );

			} catch ( e ) {

				if ( onError ) {

					onError( e );

				} else {

					console.error( e );

				}

				scope.manager.itemError( url );

			}

		}, onProgress, onError );

	}

}

THREE.AudioLoader = AudioLoader;
