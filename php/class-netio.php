<?php

if ( !class_exists ( 'WPTF_NetIO' ) ) {

	require_once 'functions.php';
	/*
	 * Class:       WPTF_NetIO
	 * Description:     
	 *  A class to provide internet input/output capabilities.
	 *  Use as a base class for more specific functions.
	 */

	class WPTF_NetIO {

		var $_sHost;
		var $_iPort;
		var $_sPrefix;
		var $_iConnTimeout;
		var $_fSock;
		var $_aIPs;
		var $_iError = 0;
		var $_iSysErr;
		var $_sSysMesg;
		var $nErrInit = -1;	  // not initialized
		var $nErrRead = -2;	  // read error
		var $nErrWrite = -3;	  // write error
		var $nErrWriteShort = -4;	// failed to write all bytes
		var $nErrSocket = -100;	// error in socket open

		function __construct ( $s_host = NULL, $i_port = NULL, $s_prefix = "" ) {
			if ( isset ( $s_host ) )
				$this->_sHost = $s_host;
			if ( isset ( $i_port ) )
				$this->_iPort = $i_port;
			$this->_sPrefix = $s_prefix;
			$this->_iConnTimeout = 30;
			$this->_iSysErr = 0;
			$this->_sSysMesg = "";
		}

		function _SetError ( $i_error, $i_sys_err = 0, $s_sys_mesg = "" ) {
			$this->_iError = $i_error;
			$this->_iSysErr = $i_sys_err;
			$this->_sSysMesg = $s_sys_mesg;
			return (FALSE);
		}

		function IsError () {
			return ($this->_iError != 0 ? TRUE : FALSE);
		}

		function ClearError () {
			$this->_SetError ( 0 );
		}

		function GetError () {
			return (array( $this->_iError, $this->_iSysErr, $this->_sSysMesg ));
		}

		function SetHost ( $s_host ) {
			$this->_sHost = $s_host;
		}

		function SetPort ( $i_port ) {
			$this->_iPort = $i_port;
		}

		function SetConnectionTimeout ( $i_secs ) {
			$this->_iConnTimeout = $i_secs;
		}

		function SetPrefix ( $s_prefix ) {
			$this->_sPrefix = $s_prefix;
		}

		function GetHost () {
			return (isset ( $this->_sHost ) ? $this->_sHost : "");
		}

		function GetPort () {
			return (isset ( $this->_iPort ) ? $this->_iPort : 0);
		}

		function GetPrefix () {
			return ($this->_sPrefix);
		}

		function GetConnectionTimeout () {
			return ($this->_iConnTimeout);
		}

		function _CacheIt () {
			WPTF_Debug ( "Caching " . implode ( ",", $this->_aIPs ) );
			if ( WPTF_IsSetSession ( "FormNetIODNSCache" ) )
				$a_cache = WPTF_GetSession ( "FormNetIODNSCache" );
			else
				$a_cache = array( );
			$a_cache[ $this->_sHost ] = $this->_aIPs;
			WPTF_SetSession ( "FormNetIODNSCache", $a_cache );
		}
		/*
		 * Some versions of PHP seem to have a major slowdown when resolving
		 * names with gethostbyname (5 seconds with PHP 4.3.9).
		 * So, in the case of multi-page forms using MULTIFORMURL, we get a big speed up
		 * by caching the IP address of the server.
		 */

		function _CheckCache () {
			if ( !WPTF_IsSetSession ( "FormNetIODNSCache" ) )
				return (FALSE);
			$a_cache = WPTF_GetSession ( "FormNetIODNSCache" );
			if ( !is_array ( $a_cache ) || !isset ( $a_cache[ $this->_sHost ] ) || !is_array ( $a_cache[ $this->_sHost ] ) )
				return (FALSE);
			$this->_aIPs = $a_cache[ $this->_sHost ];
			return (TRUE);
		}

		function Resolve () {
			$this->ClearError ();
			if ( !isset ( $this->_sHost ) )
				return ($this->_SetError ( $this->nErrInit ));
			if ( $this->_CheckCache () )
				return (TRUE);
			WPTF_Debug ( "Start resolve of " . $this->_sHost );
			//
			// if host is an actual IP address, then it is returned unchanged, which is good!
			//
        if ( ($a_ip_list = gethostbynamel ( $this->_sHost )) === FALSE ) {
				WPTF_Debug ( "Resolve failed" );
				return ($this->_SetError ( $this->nErrInit, 0, GetMessage ( MSG_RESOLVE, array( "NAME" => $this->_sHost ) ) ));
			}
			WPTF_Debug ( "Done resolve: " . implode ( ",", $a_ip_list ) );
			$this->_aIPs = $a_ip_list;
			$this->_CacheIt ();
			return (TRUE);
		}

		function _SSLOpen ( $s_ip, &$errno, &$errstr, $i_timeout ) {
			WPTF_Debug ( "Using _SSLOpen (stream_socket_client), SNI, host=" . $this->GetHost () );
			$context = stream_context_create ();
			$result = stream_context_set_option ( $context, 'ssl', 'verify_host', true );
			$result = stream_context_set_option ( $context, 'ssl', 'verify_peer', false );
			$result = stream_context_set_option ( $context, 'ssl', 'allow_self_signed', true );
			$result = stream_context_set_option ( $context, 'ssl', 'SNI_enabled', true );
			$result = stream_context_set_option ( $context, 'ssl', 'SNI_server_name', $this->GetHost () );
			//
			// Note that even if SNI fails, the socket will still open, but the
			// web server should send a 400 error.
			//
        return (stream_socket_client ( $this->GetPrefix () . $s_ip . ":" . $this->GetPort (), $errno, $errstr, $i_timeout, STREAM_CLIENT_CONNECT, $context ));
		}

		function Open () {
			$this->ClearError ();
			if ( !isset ( $this->_sHost ) || !isset ( $this->_iPort ) )
				return ($this->_SetError ( $this->nErrInit ));
			if ( !$this->Resolve () )
				return (FALSE);
			WPTF_Debug ( "Starting socket open" );
			$f_sock = FALSE;
			//
			// Now, run through the list of IPs until we find one that connects.
			// However, this can cause problems with SNI in SSL/TLS connections.
			// If there is only one IP address, use the host name.
			// Otherwise, if we can specify SNI and it's an SSL connection
			// use streams, otherwise try each IP individually.
			//
        if ( count ( $this->_aIPs ) == 1 ) {
				WPTF_Debug ( "Trying host " . $this->_sHost . ", timeout " . $this->GetConnectionTimeout () );
				$f_sock = @fsockopen ( $this->GetPrefix () . $this->_sHost, $this->GetPort (), $errno, $errstr, $this->GetConnectionTimeout () );
			} else {
				foreach ( $this->_aIPs as $s_ip ) {
					WPTF_Debug ( "Trying IP $s_ip, timeout " . $this->GetConnectionTimeout () );
					if ( IsPHPAtLeast ( "5.3.2" ) && substr ( $this->GetPrefix (), 0, 3 ) == "ssl" ) {
						if ( ($f_sock = $this->_SSLOpen ( $s_ip, $errno, $errstr, $this->GetConnectionTimeout () )) !== FALSE )
							break;
					}
					elseif ( ($f_sock = @fsockopen ( $this->GetPrefix () . $s_ip, $this->GetPort (), $errno, $errstr, $this->GetConnectionTimeout () )) !== FALSE )
						break;
				}
			}
			if ( $f_sock === FALSE ) {
				WPTF_Debug ( "open failed: $errno $errstr" );
				return ($this->_SetError ( $this->nErrSocket, $errno, $errstr ));
			}
			$this->_fSock = $f_sock;
			WPTF_Debug ( "Done socket open" );
			return (TRUE);
		}

		function Read () {
			$this->ClearError ();
			$a_lines = array( );
			while ( ($s_line = fgets ( $this->_fSock )) !== FALSE )
				$a_lines[ ] = $s_line;
			WPTF_Debug ( "Read " . count ( $a_lines ) . " lines" );
			return ($a_lines);
		}

		function Write ( $s_str, $b_flush = TRUE ) {
			$this->ClearError ();
			if ( !isset ( $this->_fSock ) )
				return ($this->_SetError ( $this->nErrInit ));
			if ( ($n_write = fwrite ( $this->_fSock, $s_str )) === FALSE )
				return ($this->_SetError ( $this->nErrWrite ));
			if ( $n_write != strlen ( $s_str ) )
				return ($this->_SetError ( $this->nErrWriteShort ));
			if ( $b_flush )
				if ( fflush ( $this->_fSock ) === FALSE )
					return ($this->_SetError ( $this->nErrWriteShort ));
			return (TRUE);
		}

		function Close () {
			if ( isset ( $this->_fSock ) ) {
				fclose ( $this->_fSock );
				unset ( $this->_fSock );
			}
		}
	}

}