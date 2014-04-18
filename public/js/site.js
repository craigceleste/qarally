"use strict";

// This file is for non-angular tidbits.



// Navbar submenu toggling.
// Not using Angular because this complements Bootstrap widget behaviors, so it's not really appropriate as a directive.
$(function(){
	$('body').delegate('.dropdown-submenu > .dropdown-toggle', 'click', function(e) {
		var submenu = $('> .dropdown-menu', $(this).parent());
		$('.dropdown-submenu > .dropdown-menu').not(submenu).hide(); // hide other submenus
		submenu.toggle(); // toggle this one
		e.stopPropagation(); // don't close the parent menu
	});
	$('body').delegate('.dropdown > .dropdown-toggle', 'click', function(){
		$('.dropdown-submenu > .dropdown-menu').hide() // hide dropdown when parent menu is opened or closed
	});
});
