<?php
/*
Plugin Name: Word Search Puzzle
Plugin URI: https://example.com/word-search-puzzle
Description: A fun word search puzzle game with a shortcode to display on the front-end.
Version: 1.0
Author: Your Name
Author URI: https://example.com
License: GPL2
*/

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly.
}

/**
 * Enqueue plugin CSS and JS.
 */
function wsp_enqueue_scripts() {
    // Enqueue jQuery (if not already loaded).
    wp_enqueue_script( 'jquery' );

    // Enqueue the game JavaScript.
    wp_enqueue_script( 'wsp-game-js', plugin_dir_url( __FILE__ ) . '/assets/js/game.js', array( 'jquery' ), '1.0', true );

    // Enqueue the plugin CSS.
    wp_enqueue_style( 'wsp-game-css', plugin_dir_url( __FILE__ ) . '/assets/css/style.css', array(), '1.0' );
}
add_action( 'wp_enqueue_scripts', 'wsp_enqueue_scripts' );

/**
 * Render the game HTML via a shortcode.
 *
 * Usage: [word_search_puzzle]
 */
function wsp_display_game() {
    ob_start();
    ?>
    <div class="game-container">
        <div class="header">
            <h1>Word Search</h1>
            <div class="controls">
                <button id="newGame" disabled>New Game</button>
                <div id="score">Found: 0/5</div>
            </div>
        </div>
        
        <div class="main-content">
            <div class="grid-container">
                <div id="grid"></div>
                <svg id="lineCanvas"></svg>
            </div>
            
            <div class="words-section">
                <h2>Words to Find:</h2>
                <div id="wordList"></div>
            </div>
        </div>
        <div id="status"></div>
    </div>
    <?php
    return ob_get_clean();
}
add_shortcode( 'word_search_puzzle', 'wsp_display_game' );
