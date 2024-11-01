<?php

/*
  Plugin Name: Tectite Forms
  Plugin URI: https://www.tectite.com/plugins
  Description: Install a secure anti-spam form.  Use our sample forms or easily design your own form.
  Version: 1.3
  Author: Russell Robinson
  Author URI: http://www.openconcepts.com.au/
  License: GPL2
 */
?>
<?php

/*  Copyright 2012  Russell Robinson  (email: russellr at tectite dot com)

  This program is free software; you can redistribute it and/or modify
  it under the terms of the GNU General Public License, version 2, as
  published by the Free Software Foundation.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with this program; if not, write to the Free Software
  Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
 */
?>
<?php

if ( !class_exists ( 'WPTF_Tectite_Forms' ) ) {
		define ( 'IS_DEVELOPMENT', false );
		define ( 'IS_TESTING', false );

	require_once 'php/class-tectite-forms.php';
}
