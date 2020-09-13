<?php
/**
 * The base configuration for WordPress
 *
 * The wp-config.php creation script uses this file during the
 * installation. You don't have to use the web site, you can
 * copy this file to "wp-config.php" and fill in the values.
 *
 * This file contains the following configurations:
 *
 * * MySQL settings
 * * Secret keys
 * * Database table prefix
 * * ABSPATH
 *
 * @link https://wordpress.org/support/article/editing-wp-config-php/
 *
 * @package WordPress
 */

// ** MySQL settings - You can get this info from your web host ** //
/** The name of the database for WordPress */
define( 'DB_NAME', 'wordpress' );

/** MySQL database username */
define( 'DB_USER', 'root' );

/** MySQL database password */
define( 'DB_PASSWORD', '' );

/** MySQL hostname */
define( 'DB_HOST', 'localhost' );

/** Database Charset to use in creating database tables. */
define( 'DB_CHARSET', 'utf8mb4' );

/** The Database Collate type. Don't change this if in doubt. */
define( 'DB_COLLATE', '' );

/**#@+
 * Authentication Unique Keys and Salts.
 *
 * Change these to different unique phrases!
 * You can generate these using the {@link https://api.wordpress.org/secret-key/1.1/salt/ WordPress.org secret-key service}
 * You can change these at any point in time to invalidate all existing cookies. This will force all users to have to log in again.
 *
 * @since 2.6.0
 */
define( 'AUTH_KEY',         'FBC{6;@,(?abtb[&3>;<iPL(yG@mA(7]F8sb3_)+l^eBt:tZLqc-@Pr.f7cck1So' );
define( 'SECURE_AUTH_KEY',  'J7d8Va@[p>7o%MXs=1U6SS_Uo?.*P#xZrDpl3sRm?G%8jpIO%]Kf[]sE.cx1[p4w' );
define( 'LOGGED_IN_KEY',    '-3;XKlO]kzyp2T{R;)L FQSO4yM[t/D6 bLao+,wlNnn37qHC>p.(;:?HqHiZiAC' );
define( 'NONCE_KEY',        '%A`8G>]mtC]b5RwY!qCsUdl/1aN!wuMrZv:4-&=0[9U{/sCLNpIMU(ifi[kspIae' );
define( 'AUTH_SALT',        'M}YR=]yfUqlt_iGqjyySP7#XQ_B#6^%}]0TwWyLDHvOt#^_NcCx<DON{~QYoNq>4' );
define( 'SECURE_AUTH_SALT', 'E.xZLC|o0VsQt3xWtRYxlzk,BYhnJEld&HA$E0r]@qz:Z<w+BcTot2~_n$agpa$0' );
define( 'LOGGED_IN_SALT',   '+dnp_X^):{KFSd4{:o]s0Hazexf`go^rMeN@v)<Dm|kM~`iR0F o &S`qcOux4eu' );
define( 'NONCE_SALT',       'mRcYO8Jpz-2&L8?o^P_~8EbZYvGAxV1f0`6Rx|x6so>6IX^Nm},tOQRe$JQ$_k&X' );

/**#@-*/

/**
 * WordPress Database Table prefix.
 *
 * You can have multiple installations in one database if you give each
 * a unique prefix. Only numbers, letters, and underscores please!
 */
$table_prefix = 'wp_';

/**
 * For developers: WordPress debugging mode.
 *
 * Change this to true to enable the display of notices during development.
 * It is strongly recommended that plugin and theme developers use WP_DEBUG
 * in their development environments.
 *
 * For information on other constants that can be used for debugging,
 * visit the documentation.
 *
 * @link https://wordpress.org/support/article/debugging-in-wordpress/
 */
define( 'WP_DEBUG', false );

/* That's all, stop editing! Happy publishing. */

/** Absolute path to the WordPress directory. */
if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', __DIR__ . '/' );
}

/** Sets up WordPress vars and included files. */
require_once ABSPATH . 'wp-settings.php';
