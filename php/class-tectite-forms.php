<?php

/*
 * Adapted from: https://github.com/rjz/wp-plugin-demos
 * by RJ Zaworski (http://rjzaworski.com)
 */

if ( !class_exists ( 'WPTF_Tectite_Forms' ) ) {
	require 'functions.php';
	require 'class-plugin-base.php';
	require 'class-httpget.php';

	/**
	 * Contains the logic for the WordPress Plugin providing Tectite Forms.
	 *
	 * @author russellr
	 */
	class WPTF_Tectite_Forms extends WPTF_Plugin_Base {

		const FORMDESIGNERUSERCSS_VER = '9'; /* version ID for formdesigneruser.css */
		const FORMVALJS_VER = '7'; /* version ID for formval.js */

		protected

				// the action hooks this plugin describes
				$_aActions = array(
					'admin_menu',
					'admin_init',
					'init',
//					'widgets_init'
						),
				$_aFilters = array(
					'plugin_action_links',
					'the_content',
						),
				// the default options this plugin set/uses
				$_aOptions = array(
//					'foo' => 'bar'
		);
		private $_sTectiteURL = 'https://www.tectite.com/hf';

		public function __construct ( $s_basepath = '' ) {
			parent::__construct ( 'tectite-forms', $s_basepath );
			if ( IS_DEVELOPMENT )
				$this->_sTectiteURL = 'http://ttweb.opco.pro/hf';
			elseif ( IS_TESTING )
				$this->_sTectiteURL = 'http://newweb.tectite.com/hf';
		}

		public function admin_init () {
			wp_register_style ( 'WPTF_Tectite_Admin_Styles', $this->getCSSURL ( 'adminstyles.css' ) );
			wp_enqueue_style ( 'WPTF_Tectite_Admin_Styles' );
			wp_register_script ( 'WPTF_Tectite_Admin_Script', $this->getJSURL ( 'admin.js' ), array( 'jquery' ), false, true );
			wp_enqueue_script ( 'WPTF_Tectite_Admin_Script' );
			if ( isset ( $_POST[ 'tectite_forms_submitted' ] ) ) {
				update_option ( 'tectite_forms_button', isset ( $_POST[ 'tectite_forms_button' ] ) ? $_POST[ 'tectite_forms_button' ] : false );
			}
		}

		public function admin_menu () {
			add_options_page ( 'Tectite Forms Setup', 'Tectite Forms', 'manage_options', 'WPTF_AdminPage', array( $this, 'displayAdmin' ) );
		}

		public function displayAdmin () {
			$this->loadView ( 'admin' );
		}

		public function init () {
			if ( !is_admin () ) {
				ob_start ();
				if ( !session_id () )
					session_start ();
				/* NOTE: these style names are important - RJR HF:_Check4WP */
				wp_register_style ( 'WPTF_Tectite_Form_Styles', $this->getCSSURL ( 'styles.css' ) );
				wp_register_style ( 'WPTF_Tectite_Form_UserStyles', $this->getCSSURL ( 'formdesigneruser.css' ), false, self::FORMDESIGNERUSERCSS_VER );
				wp_enqueue_style ( 'WPTF_Tectite_Form_Styles' );
				wp_enqueue_style ( 'WPTF_Tectite_Form_UserStyles' );
				wp_register_script ( 'tectiteformval', $this->getJSURL ( 'formval.js' ), array( 'jquery' ), self::FORMVALJS_VER, true );
				wp_enqueue_script ( 'tectiteformval' );
				wp_localize_script ( 'tectiteformval', 'tectite_form_environ', array(
					'img_url' => $this->getImgURL ( '' ),
				) );
			}
		}

		function the_content ( $content ) {
			if ( preg_match_all ( '/\[tectiteform=([^\]]*)\]/', $content, $a_matches, PREG_SET_ORDER ) ) {
				$n_forms = count ( $a_matches );
				for ( $ii = 0; $ii < $n_forms; $ii++ ) {
					$s_form_html = $this->_getForm ( $a_matches[ $ii ][ 1 ] );
					$s_form_html = $this->_addFields ( $s_form_html );
					$content = str_replace ( $a_matches[ $ii ][ 0 ], $s_form_html, $content );
				}
				$content = '<div class="TectiteForm">' . $content . '</div>';
			}
			return $content;
		}

		private function _addFields ( $s_html ) {
//			$s_code = '<input type="hidden" name="somefield" value="somevalue" />';
//			$s_new = preg_replace ( '#<\s*/\s*form\s*>#i', $s_code . '$0', $s_html );
//			if ( $s_new )
//				return ($s_new);
//			else
			return ($s_html);
		}

		private function _formatError ( $s_mesg ) {
			return ("<span class=\"error\">A problem occurred with your form: $s_mesg</span");
		}

		private function _readURL ( $s_url, $n_depth = 0 ) {
			$m_buf = '';
			$http_get = new WPTF_HTTPGet ( $s_url );
			if ( ($a_lines = $http_get->Read ()) === FALSE ) {
				$http_get->Close ();
				list($i_error, $i_sys_err, $s_sys_msg) = $http_get->GetError ();
				switch ( $i_error ) {
					case $http_get->nErrParse:
						return ($this->_formatError ( 'error in the URL - did you copy and paste correctly?' ));
					case $http_get->nErrScheme:
						$a_parts = $http_get->GetURLSplit ();
						return ($this->_formatError ( 'error in the URL scheme "' . $a_parts[ "scheme" ] . '"' ));
					default:
						return ($this->_formatError ( "error connecting to the server: ($i_sys_err) $s_sys_msg" ));
				}
			} else {
				$http_get->Close ();
				//
				// check the HTTP response for actual status.  Anything outside
				// 200-299 is a failure, but we also handle redirects.
				//
				list($i_http_code, $s_http_status) = $http_get->GetHTTPStatus ();

				if ( $i_http_code < 200 || $i_http_code > 299 ) {
					switch ( $i_http_code ) {
						case 300: // multiple choices (we'll take the first)
						case 301: // moved permanently
						case 302: // found
						case 303: // see other
						case 307: // temporary redirect
							//
							// a "location" header must be present for us to continue
							// In the case of infinite redirects, we need to stop.
							// So, we limit to a maximum of 10 redirects.
							//
							if ( $n_depth < 10 ) {
								if ( ($s_location = $http_get->FindHeader ( "location" )) !== false ) {
									WPTF_Debug ( "Redirect from '$s_url' to '$s_location'" );
									$m_buf = $this->_readURL ( $s_location, $n_depth + 1 );
									break;
								}
								WPTF_Debug ( "Redirect FAILED - no location header" );
							}
							else
								WPTF_Debug ( "Redirect FAILED depth=$n_depth" );
						// FALL THRU
						default:
							return ($this->_formatError ( "server reported error $s_http_status on URL $s_url" ));
					}
				}
				else
					$m_buf = implode ( "", $a_lines );
			}
			return ($m_buf);
		}

		private function _getForm ( $s_form_id ) {
			$s_url = $this->_sTectiteURL . '/form?id=' . $s_form_id;
			if (($s_link = get_option('tectite_forms_button')) !== false)
				$s_url .= "&link=$s_link";
			$s_form = $this->_readURL ( $s_url );

//			if ( preg_match ( '/<\s*form\s[^>]*action="([^"]*)"/ims', $s_form, $a_matches, PREG_OFFSET_CAPTURE ) === 1 ) {
//				$s_url = $a_matches[ 1 ][ 0 ];
//				$i_url_pos = $a_matches[ 1 ][ 1 ];
//				$i_len = strlen ( $s_url );
//				$s_form = substr ( $s_form, 0, $i_url_pos ) . substr ( $s_form, $i_url_pos + $i_len );
//			}

			return ($s_form);
		}

		function plugin_action_links ( $links, $file ) {

			if ( basename ( $file ) == 'tectite-forms.php' ) {
				$links[ ] = '<a href="options-general.php?page=WPTF_AdminPage">' . __ ( 'Settings' ) . '</a>';
			}

			return $links;
		}
		//
		//	Called manually to update the plugin's options
		//
//	public function muddle_an_option() {
//
//			if ($this->get_option('foo') == 'bar') {
//			$this->update_option('foo', '!bar');
//			}
//
//			echo $this->get_option ( 'foo' ); // !bar
//		}
		//
		//	Demonstrate loading a view
		//
//	public function test_view () {
//
//			$data = array(
//				'message' => 'hello, world!'
//			);
//
//			$this->loadView ( 'hello_world', $data );
//		}
		//
		//	Called by the WP 'widgets_init' hook
		//
//	public function widgets_init () {
//			$this->muddle_an_option ();
//			$this->test_view ();
//		}
	}
	new WPTF_Tectite_Forms();
}
