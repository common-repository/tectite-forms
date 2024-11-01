<?php

/*
 * Adapted from: https://github.com/rjz/wp-plugin-demos
 * by RJ Zaworski (http://rjzaworski.com)
 */
if ( !class_exists ( 'WPTF_Plugin_Base' ) ) {

	abstract class WPTF_Plugin_Base {

		private
		/**
		 * 	@type	string
		 */
		$_sOptionName = '';
		protected
				/**
				 * 	The absolute path to this plugin's root directory. That's
				 * 	usually just up one level from here...
				 *
				 * 	@type	string
				 */
				$_sBasePath = '',
				/**
				 * The name of the plugin.
				 * @type string 
				 */
				$_sPluginName = '',
				/**
				 * The name of the folder to hold stylesheets.
				 * @type string 
				 */
				$_sCSSFolder = 'css',
				/**
				 * The name of the folder to hold javascript files.
				 * @type string 
				 */
				$_sJSFolder = 'js',
				/**
				 * The name of the folder to hold images.
				 * @type string 
				 */
				$_sImgFolder = 'images',
				/**
				 * 	A list of the action hooks the plugin provides
				 * 	@type	array
				 */
				$_aActions = array( ),
				/**
				 * 	A list of the filters the plugin provides
				 * 	@type	array
				 */
				$_aFilters = array( ),
				/**
				 *
				 * 	@type	array
				 */
				$_aOptions = array( );

		/**
		 * 	Setup the environmental information and hook into Wordpress.
		 *
		 * 	@param	string	(optional) the path to this plugin's root directory
		 */
		public function __construct ( $s_plugin_name, $s_basepath = '' ) {

			if ( $s_basepath == '' ) {
				//
				// WP says plugins are not supposed to use WP_PLUGIN_DIR, but
				// it also doesn't provide a solution for symlinks.
				// This technique does the job.
				$s_basepath = WP_PLUGIN_DIR;
			}
			$s_basepath = trailingslashit ( $s_basepath ) . $s_plugin_name;

			$this->_sPluginName = untrailingslashit ( $s_plugin_name );
			$this->_sBasePath = untrailingslashit ( $s_basepath );
			$this->_sOptionName = get_class ( $this ) . '_options';

			$option = get_option ( $this->_sOptionName );

			if ( isset ( $option ) && $option ) {
				$this->_aOptions = array_merge ( $this->_aOptions, $option );
			} else {
				$this->_saveOptions ( $this->_aOptions );
			}

			foreach ( $this->_aActions as $action ) {
				add_action ( $action, array( $this, $action ) );
			}

			foreach ( $this->_aFilters as $filter ) {
				add_filter ( $filter, array( $this, $filter ), 10, 2 );
			}
		}

		protected function _ShowError ( $s_mesg ) {
			echo __CLASS__ . ': error detected: ' . $s_mesg;
		}

		protected function _getURL ( $s_path ) {
			return (plugins_url ( $this->_sPluginName . '/' . $s_path ));
		}

		public function getCSSURL ( $s_file ) {
			return ($this->_getURL ( trailingslashit ( $this->_sCSSFolder ) . $s_file ));
		}

		public function getJSURL ( $s_file ) {
			return ($this->_getURL ( trailingslashit ( $this->_sJSFolder ) . $s_file ));
		}

		public function getImgURL ( $s_file ) {
			return ($this->_getURL ( trailingslashit ( $this->_sImgFolder ) . $s_file ));
		}

		/**
		 * 	Show a view
		 *
		 * 	@param	string	the name of the view
		 * 	@param	array	(optional) variables to pass to the view
		 * 	@param	boolean	echo the view? (default: true)
		 */
		public function loadView ( $view, $data = null, $echo = true ) {

			$view = $view . '.php';
			$viewfile = trailingslashit ( $this->_sBasePath ) . get_class ( $this ) . '/views/' . $view;

			if ( !file_exists ( $viewfile ) ) {

				$viewfile = trailingslashit ( $this->_sBasePath ) . 'views/' . $view;

				if ( !file_exists ( $viewfile ) ) {
					$this->_ShowError ( "failed to load view '$viewfile'" );
				}
			}

			if ( is_array ( $data ) ) {
				foreach ( $data as $key => $value ) {
					${$key} = $value;
				}
			}

			ob_start ();
			include $viewfile;
			$result = ob_get_contents ();
			ob_end_clean ();

			if ( $echo ) {
				echo $result;
			} else {
				return $result;
			}
		}

		/**
		 * 	Get an option
		 * 	@param	string	key
		 * 	@return	string 	value
		 */
		protected function _getOption ( $key ) {

			if ( array_key_exists ( $key, $this->_aOptions ) ) {

				$value = $this->_aOptions[ $key ];

				if ( is_array ( $value ) ) {
					return $this->_stripSlashesDeep ( $value );
				} elseif ( is_string ( $value ) ) {
					return stripslashes ( $value );
				}
			}
			return null;
		}

		/**
		 * 	Update an option
		 * 	@param	string	key
		 * 	@param	mixed 	value
		 */
		protected function _updateOption ( $key, $value ) {

			$this->_aOptions[ $key ] = $value;
			$this->_saveOptions ();
		}

		/**
		 * 	Update a bunch of options en masse
		 * 	@param	array	an array containing all of the new options
		 */
		protected function _updateOptions ( $instance ) {

			foreach ( $this->_aOptions as $key => $value ) {
				if ( isset ( $instance[ $key ] ) ) {
					$this->_aOptions[ $key ] = $instance[ $key ];
				}
			}

			$this->_saveOptions ();
		}

		/**
		 * 	Save options to the database
		 */
		protected function _saveOptions () {
			update_option ( $this->_sOptionName, $this->_aOptions );
		}

		/**
		 * 	Recursively strips slashes from a variable
		 * 	@param	mixed	an array or string to be stripped
		 * 	@return	mixed	a "safe" version of the input variable
		 */
		private function _stripSlashesDeep ( $value ) {
			$value = is_array ( $value ) ?
					array_map ( array( $this, '_stripSlashesDeep' ), $value ) :
					stripslashes ( $value );

			return $value;
		}
	}
}	
