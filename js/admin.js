jQuery(document).ready(function () {
    var $=jQuery;
    var	j_form = $('form#TectiteOptions');
				
    j_form.find('input').each(function() {
        $(this).change(function () {
            j_form.submit();
        });
    });
});
