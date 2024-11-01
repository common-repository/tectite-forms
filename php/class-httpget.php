<?php

if ( !class_exists ( 'WPTF_HTTPGet' ) ) {

	require_once 'functions.php';
	require_once 'class-netio.php';

	/*
	 * Class:       WPTF_HTTPGet
	 * Description:     
	 *  A class that implements HTTP GET method.
	 */

	class WPTF_HTTPGet extends WPTF_NetIO {

		var $_sURL;
		var $_aURLSplit;
		var $_sRequest;
		var $_aResponse;
		var $_aRespHeaders;
		var $_sAuthLine;
		var $_sAuthType;
		var $_sAuthUser;
		var $_sAuthPass;
		var $_sAgent;
		var $nErrParse = -1000;   // failed to parse URL
		var $nErrScheme = -1001;   // unsupported URL scheme

		function __construct ( $s_url = "" ) {
			parent::__construct ();
			$this->_aURLSplit = array( );
			if ( ($this->_sURL = $s_url) !== "" )
				$this->_SplitURL ();
		}

		function _SplitURL () {
			WPTF_Debug ( "URL: " . $this->_sURL );
			if ( ($this->_aURLSplit = parse_url ( $this->_sURL )) === FALSE ) {
				$this->_aURLSplit = array( );
				return ($this->_SetError ( $this->nErrParse ));
			}
			return (TRUE);
		}

		function GetURLSplit () {
			return ($this->_aURLSplit);
		}

		function SetURL ( $s_url ) {
			$this->_aURLSplit = array( );
			$this->_sURL = $s_url;
			return ($this->_SplitURL ());
		}

		function _Init () {
			if ( !isset ( $this->_aURLSplit[ "host" ] ) )
				return ($this->_SetError ( $this->nErrInit ));
			$this->SetHost ( $this->_aURLSplit[ "host" ] );
			$i_port = 80;
			if ( isset ( $this->_aURLSplit[ "scheme" ] ) ) {
				switch ( strtolower ( $this->_aURLSplit[ "scheme" ] ) ) {
					case "http":
						break;
					case "https":
						$i_port = 443;
						break;
					default:
						return ($this->_SetError ( $this->nErrScheme ));
				}
			}
			if ( isset ( $this->_aURLSplit[ "port" ] ) )
				$i_port = $this->_aURLSplit[ "port" ];
			if ( $i_port == 443 )
			//
			// we require ssl:// for port 443
				//
            $this->SetPrefix ( "ssl://" );
			$this->SetPort ( $i_port );
			return (TRUE);
		}

		function _SendRequest () {
			WPTF_Debug ( "Path: " . $this->_aURLSplit[ "path" ] );
			if ( !isset ( $this->_aURLSplit[ "path" ] ) || $this->_aURLSplit[ "path" ] === "" )
				$s_path = "/"; // default path
			else
				$s_path = $this->_aURLSplit[ "path" ];
			if ( isset ( $this->_aURLSplit[ "query" ] ) ) {
				//
				// add the query to the path
				// Note that parse_url decodes the query string (urldecode), so
				// we need to split it into its component parameters
				// are re-encode their values.  Calling urlencode($this->_aURLSplit["query"])
				// encodes the '=' between parameters and this breaks things.
				//
            $a_params = explode ( '&', $this->_aURLSplit[ "query" ] );
				foreach ( $a_params as $i_idx => $s_param ) {
					if ( ($i_pos = strpos ( $s_param, "=" )) === false )
						$a_params[ $i_idx ] = urlencode ( $s_param );
					else
						$a_params[ $i_idx ] = substr ( $s_param, 0, $i_pos ) . '=' .
								urlencode ( substr ( $s_param, $i_pos + 1 ) );
				}
				$s_path .= "?" . implode ( '&', $a_params );
			}
			//
			// add the fragment to the path.
			//
        if ( isset ( $this->_aURLSplit[ "fragment" ] ) )
				$s_path .= '#' . urlencode ( $this->_aURLSplit[ "fragment" ] );
			//
			// build the request
			//
        $s_req = "GET $s_path HTTP/1.0\r\n";
			//
			// Add authentication
			//
        if ( isset ( $this->_sAuthLine ) )
				$s_req .= "Authorization: $this->_sAuthLine\r\n";
			elseif ( isset ( $this->_sAuthType ) )
				$s_req .= "Authorization: " . $this->_sAuthType . " " .
						base64_encode ( $this->_sAuthUser . ":" . $this->_sAuthPass ) . "\r\n";
			//
			// Specify the host name
			//
        $s_req .= "Host: " . $this->GetHost () . "\r\n";
			//
			// Specify the user agent
			//
        if ( isset ( $this->_sAgent ) )
				$s_req .= "User-Agent: " . $this->_sAgent . "\r\n";
			//
			// Accept any output
			//
        $s_req .= "Accept: */*\r\n";
			//
			// End of request headers
			//
        $s_req .= "\r\n";
			$this->_sRequest = $s_req;
			return (parent::Write ( $s_req ));
		}

		function _GetResponse () {
			WPTF_Debug ( "Reading" );
			if ( ($a_lines = parent::Read ()) === FALSE )
				return (FALSE);

			$this->_aRespHeaders = $this->_aResponse = array( );
			$b_body = FALSE;
			for ( $ii = 0; $ii < count ( $a_lines ); $ii++ ) {
				if ( $b_body ) {
					//WPTF_Debug("Body line: ".rtrim($a_lines[$ii]));
					$this->_aResponse[ ] = $a_lines[ $ii ];
				} elseif ( $a_lines[ $ii ] == "\r\n" || $a_lines[ $ii ] == "\n" )
					$b_body = TRUE;
				else {
					//WPTF_Debug("Header line: ".rtrim($a_lines[$ii]));
					$this->_aRespHeaders[ ] = $a_lines[ $ii ];
				}
			}
			return (TRUE);
		}

		function GetResponseHeaders () {
			return ($this->_aRespHeaders);
		}

		function FindHeader ( $s_name ) {
			$s_name = strtolower ( $s_name );
			$i_len = strlen ( $s_name );
			for ( $ii = 0; $ii < count ( $this->_aRespHeaders ); $ii++ ) {
				$s_line = $this->_aRespHeaders[ $ii ];
				if ( ($s_hdr = substr ( $s_line, 0, $i_len )) !== false ) {
					$s_hdr = strtolower ( $s_hdr );
					if ( $s_hdr === $s_name && substr ( $s_line, $i_len, 1 ) === ":" )
						return (trim ( substr ( $s_line, $i_len + 1 ) ));
				}
			}
			return (false);
		}

		function GetHTTPStatus () {
			$i_http_code = 0;
			$s_status = "";
			for ( $ii = 0; $ii < count ( $this->_aRespHeaders ); $ii++ ) {
				$s_line = $this->_aRespHeaders[ $ii ];
				if ( substr ( $s_line, 0, 4 ) == "HTTP" ) {
					$i_pos = strpos ( $s_line, " " );
					$s_status = substr ( $s_line, $i_pos + 1 );
					$i_end_pos = strpos ( $s_status, " " );
					if ( $i_end_pos === false )
						$i_end_pos = strlen ( $s_status );
					$i_http_code = ( int ) substr ( $s_status, 0, $i_end_pos );
				}
			}
			return (array( $i_http_code, $s_status ));
		}

		function Resolve () {
			if ( !$this->_Init () )
				return (FALSE);
			return (parent::Resolve ());
		}

		function Read () {
			if ( !$this->_Init () )
				return (FALSE);
			WPTF_Debug ( "Init done" );
			if ( !$this->Open () )
				return (FALSE);
			WPTF_Debug ( "Open done" );
			if ( !$this->_SendRequest () )
				return (FALSE);
			WPTF_Debug ( "Send done" );
			if ( !$this->_GetResponse () )
				return (FALSE);
			WPTF_Debug ( "Get done" );
			$this->Close ();
			return ($this->_aResponse);
		}

		function SetAuthenticationLine ( $s_auth ) {
			$this->_sAuthLine = $s_auth;
		}

		function SetAuthentication ( $s_type, $s_user, $s_pass ) {
			$this->_sAuthType = $s_type;
			$this->_sAuthUser = $s_user;
			$this->_sAuthPass = $s_pass;
		}

		function SetAgent ( $s_agent ) {
			$this->_sAgent = $s_agent;
		}
	}
}