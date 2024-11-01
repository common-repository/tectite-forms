<?php

if ( !function_exists ( 'WPTF_Debug' ) ) {

	//
	// Write to the debug log if it exists and is writable.
	//
	function WPTF_Debug ( $s_mesg ) {
		static $fDebug = NULL;

		if ( !isset ( $fDebug ) ) {
			$fDebug = false;  // only initialize once
			$s_dir = '/tmp';
			$s_db_file = "$s_dir/wptf_debug.log";
			//
			// we only open an existing file - we don't create one
			//
        if ( file_exists ( $s_db_file ) ) {
				if ( ($fDebug = fopen ( $s_db_file, "a" )) === false ) {
					return;
				}
			}
		}
		if ( $fDebug !== false ) {
			fwrite ( $fDebug, date ( 'r' ) . ": " . $s_mesg . "\n" );
			fflush ( $fDebug );
		}
	}

	//
	// Session data access
	//
	function WPTF_GetSession ( $s_name ) {
		return (isset ( $_SESSION ) ? $_SESSION[ $s_name ] : null);
	}

	//
	// Session data isset
	//	
	function WPTF_IsSetSession ( $s_name ) {
		return (isset ( $_SESSION ) && isset ( $_SESSION[ $s_name ] ));
	}

	//
	// Session data setting
	//
	function WPTF_SetSession ( $s_name, $m_value ) {
		$_SESSION[ $s_name ] = $m_value;
	}

	//
	// Session data un-setting
	//
	function WPTF_UnsetSession ( $s_name ) {
		$_SESSION[ $s_name ] = null;
		unset ( $_SESSION[ $s_name ] );
	}
}