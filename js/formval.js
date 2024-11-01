/*
 * File:    formval.js
 * Version: 7 (see Version History below)
 * Author:  Russell Robinson, http://www.tectite.com/
 * Created: 5 October 2010
 *
 * Copyright (c) 2010-2012 tectite.com and Open Concepts (Vic) Pty Ltd
 * (ABN 12 130 429 248), Melbourne, Australia.
 * This script is free for all use as described in the "Copying and Use" and
 * "Warranty and Disclaimer" sections below.
 *
 * Description
 * ~~~~~~~~~~~
 * This JavaScript script provides client-side field validation
 * and can be used with any HTML form.  Version 5+ supports AJAX form processing.
 * In particular, it is utilized by forms created by the Tectite
 * Form Designer, available at http://www.tectite.com/
 * Visit us for support and updates.

 * Copying and Use (Software License)
 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  This program is free software; you can redistribute it and/or
 *  modify it under the terms of the GNU General Public License
 *  as published by the Free Software Foundation; either version 2
 *  of the License, or (at your option) any later version.

 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.

 *  You should have received a copy of the GNU General Public License
 *  along with this program; if not, write to the Free Software
 *  Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 *  
 *  You can also read the full license details here:
 *      http://www.gnu.org/licenses/gpl-2.0.html
 *
 * Warranty and Disclaimer
 * ~~~~~~~~~~~~~~~~~~~~~~~
 *  This script is provided free-of-charge and with ABSOLUTELY NO WARRANTY.
 *  It has not been verified for use in critical applications, including,
 *  but not limited to, medicine, defense, aircraft, space exploration,
 *  or any other potentially dangerous activity.
 *
 *  By using this file you agree to indemnify tectite.com and
 *  Open Concepts (Vic) Pty Ltd, their agents, employees, directors and
 *  associated companies and businesses from any liability whatsoever.
 *
 * We still care
 * ~~~~~~~~~~~~~
 *  If you find a bug or fault in this file, please report it to us.
 *  We will respond to your report and make endeavours to rectify any
 *  faults you've detected as soon as possible.
 *
 *  To contact us please register on our forums at:
 *      http://www.tectite.com/vbforums/
 *  or view our contact information:
 *      http://www.tectite.com/contacts.php
 *
 * Version History
 * ~~~~~~~~~~~~~~~
 *
 * Version 7, 23 July 2012
 *  Now supports both "form_environ" and "tectite_form_environ" global
 *  variables.  This provides compatibility with non-plugin uses.
 *
 * Version 6, 16 July 2012
 *  Now includes Ajax submission logic when fmmode is set to "auto"
 *  or "ajax".  Implements CORS or JSONP processing for cross-domain
 *  form submissions.  Resets the form on successful submission
 *  (clears the fields).
 *
 * Version 5, 20 March 2012
 *  Refactored the code to allow use in FormMail Ajax forms.
 *
 * Version 4, 11 November 2010
 *  Added support for disabling the validation processing
 *  by passing a "formval=off" parameter in the URL.
 *
 * Version 3, 28 October 2010
 *  Fixed bugs in handling radio buttons.
 *  Fixed bug: was marking valid fields that were not invalid.
 *  Changed names of ltrim, rtrim, and trim functions added to String class.
 *  Added support for Multi-Page forms: the "back" button no longer triggers
 *  validation.
 *  Changed name of "form" property added to Element class.
 *  Debug level is now stored in a window property, along with a function to
 *  set it.  Cancelling debug messages now restores debug messages after 2 seconds.
 *
 * Version 2, 8 October 2010
 *  Fixed a bug in finding DIV tags in some documents.
 *  Added better default message for select and checkbox field errors.
 *  The alert popup when there are field errors on form submit is now
 *  optional.
 *  The first field in error is given focus on submit failure.
 *  For simple required testing, the attached message is not
 *  used for field errors.
 *
 * Version 1, 7 October 2010
 *  Initial working version.
 */

/*
 * Class: TectiteFormValidator
 * Description:     
 *  This is the form validation setup function.
 */
function    TectiteFormValidator()
{
    var validator = this;
    
    /*
     * use a local $ alias for jQuery since we are used in a WordPress plugin
     * and similar situations
     */
    var     $ = (typeof jQuery === "undefined" ? null : jQuery);
    
    var     s_ajax_img_path = '';
    
    /*
     * The following messages are shown to the user in the circumstances
     * indicated.
     * You can modify or translate these messages as required.
     */
    /*
     * s_error_submit is shown in a popup alert when the user tries to
     * submit the form and there are some errors.
     * Set this to an empty string to skip the popup alert.
     */
    var     s_error_submit = "The form is not complete. Please fix the errors before submitting.";
    /*
     * s_error_field_empty is the default error message for a required field
     * whose value is empty.
     */
    var     s_error_field_empty = "Please enter a value for this field.";
    /*
     * s_error_radio_reqd is the default error message for a required radio
     * button field whose value is not checked.
     */
    var     s_error_radio_reqd = "Please select one of the options.";
    /*
     * s_error_select_reqd is the default error message for a required select
     * field whose value is empty.
     */
    var     s_error_select_reqd = "Please select a value for this field.";
    /*
     * s_error_checkbox_reqd is the default error message for a required select
     * field whose value is empty.
     */
    var     s_error_checkbox_reqd = "You must check this box.";
    

    /*alert("FormVal.js");*/

    /*
     * Add some useful functions to the String object.
     */
    /*
     * Left-trim the string and return a copy.
     */
    String.prototype.tectite_ltrim = function() {
        return (this.replace(/^\s*/,""));
    };
    /*
     * Right-trim the string and return a copy.
     */
    String.prototype.tectite_rtrim = function() {
        return (this.replace(/\s*$/,""));
    };
    /*
     * Trim both ends of the string and return a copy.
     */
    String.prototype.tectite_trim = function() {
        return (this.tectite_ltrim().tectite_rtrim());
    };

    /*
     * Test code for above functions.
     */
    /***
        var s_test = "   \f\r\n\t hello  world  \f\r\n\t  ";
        alert("Trimming '" + s_test + "': '" + s_test.tectite_trim() + "'");
        alert("Original is: '" + s_test + "'");
     ***/

    /*
     * Object:      NodeInfo
     * Parameters:  o_parent    the parent node
     *              o_child     the child node
     * Returns:     void
     * Description:     
     *  Constructs an object containing a parent and child node.
     */
    function    NodeInfo(o_parent,o_child)
    {
        this.GetParent = function() {
            return o_parent;
        }
        this.GetChild = function() {
            return o_child;
        }
    }

    /*
     * This function parses ampersand-separated name=value argument pairs from
     * the query string of the URL. It stores the name=value pairs in 
     * properties of an object and returns that object. Use it like this:
     * 
     * var args = getArgs();  // Parse args from URL
     * var q = args.q || "";  // Use argument, if defined, or a default value
     * var n = args.n ? parseInt(args.n) : 10; 
     *
     * Adapted from "JavaScript: The Definitive Guide" by David Flanagan.
     */
    function GetArgs()
    {
        var args = new Object();
        var query = location.search.substring(1);     // Get query string
        var pairs = query.split("&");                 // Break at ampersand
        for(var i = 0; i < pairs.length; i++) {
            var pos = pairs[i].indexOf('=');          // Look for "name=value"
            if (pos == -1) continue;                  // If not found, skip
            var argname = pairs[i].substring(0,pos);  // Extract the name
            var value = pairs[i].substring(pos+1);    // Extract the value
            value = decodeURIComponent(value);        // Decode it, if needed
            args[argname] = value;                    // Store as a property
        }
        return args;                                  // Return the object
    }

    var     nDebugLevel = 0;        /* current debug level */

    var     oURLArgs = GetArgs();

    if (oURLArgs["formval"] && oURLArgs["formval"] == "off")
        return;
    /* 
     * On document load, run the Initialize function.
     */
    if (window.addEventListener)
        window.addEventListener("load",Initialize,false);
    else if (window.attachEvent)
        window.attachEvent("onload",Initialize);

    if (oURLArgs["debug"])
    {
        if (oURLArgs["debug"] === "off")
            nDebugLevel = 0;
        else if (!isNaN(parseInt(oURLArgs["debug"])))
            nDebugLevel = parseInt(oURLArgs["debug"]);
        if (nDebugLevel)
        {
            window.tectite_debug_level = nDebugLevel;
            window.tectite_setdebug = function() {
                nDebugLevel = window.tectite_debug_level;
            }
        }
    }

    /*
     * Function:    Debug
     * Parameters:  i_level output level for this message
     *              rem     remaining arguments are strings or values to output
     * Returns:     void
     * Description:     
     *  Produces debug output based on the current debug level and the
     *  output level specified.
     */
    function Debug(i_level/*, variable arguments */)
    {
        var     s_mesg = "";

        if (arguments.length > 1 && i_level <= nDebugLevel)
        {
            for (var ii = 1 ; ii < arguments.length ; ii++)
                s_mesg += arguments[ii];
            s_mesg += "\r\n\r\n" + "Click Cancel to switch off further debug messages for 2 seconds.";
            if (!confirm(s_mesg))
            {
                nDebugLevel = 0;
                window.setTimeout(window.tectite_setdebug,2000);
            }
        }
    }

    /*
     * Function:    Initialize
     * Parameters:  void
     * Returns:     void
     * Description:     
     *  Initializes the form validation by scanning
     *  all fields in all forms in the document
     *  looking for fields that are listed in "required"
     *  or "conditions" fields.
     */
    function    Initialize()
    {
        var     a_reqd = [];
        var     a_cond = [];

        Debug(5,"Initialize");
        for (var ii = 0 ; ii < document.forms.length ; ii++)
        {
            var form = document.forms[ii];
            var b_form_validation = false;

            RecordFieldIndexes(form);
            /*
             * fmmode == "auto" means when JavaScript is enabled and
             * formval.js can run, we automatically switch to Ajax mode
             */
            if (form.fmmode && form.fmmode.value == "auto")
            {
                if ($ !== null)
                {
                    //
                    // tell FormMail to use Ajax protocol
                    //
                    $(form.fmmode).val('ajax');
                    //
                    // grab the path for the images (passed in by Wordpress plugin, for example)
                    // we support both "tectite_form_environ" and "form_environ" (the latter is used
                    // in some old non-plugin cases)
                    //
                    s_ajax_img_path = '';
                    if (typeof tectite_form_environ !== 'undefined' &&
                            typeof tectite_form_environ.img_url !== 'undefined' &&
                            tectite_form_environ.img_url !== null)
                        s_ajax_img_path = tectite_form_environ.img_url;
                    else if (typeof form_environ !== 'undefined' &&
                            typeof form_environ.img_url !== 'undefined' &&
                            form_environ.img_url !== null)
                        s_ajax_img_path = form_environ.img_url;
                    AjaxSetup($(form),s_ajax_img_path);
                    //
                    // the submit button container needs to be full width so we can
                    // provide feedback during operation - adjust
                    //
                    $(form).find('input[type=submit]').parent('.TectiteFormDesignerField').css('width','98%');
                    $(form).find('input[type=submit]').live('click',{
                        j_form:$(form)
                    },function (ev) {
                        ev.preventDefault();
                        AjaxSubmit(ev.data.j_form);
                        return false;
                    });
                }
            }

            /*
             * If the form is setup to use FormMail in Ajax mode,
             * skip "required" and "condition" initialization
             */
            if (form.fmmode && form.fmmode.value == "ajax")
            {
                b_form_validation = false;
            }
            else
            {
                if (CheckRequired(form,a_reqd))
                    b_form_validation = true;
            /* We'll implement Tectite FormMail "conditions" later...
                    if (CheckConditions(form,a_cond))
                        b_form_validation = true;
                 */
            }

            if (b_form_validation)
            {
                if (nDebugLevel >= 2)   /* just some debugging code */
                {
                    var     s_mesg = "Form " + jj + " required fields:\r\n";

                    for (var jj = 0 ; jj < a_reqd.length ; jj++)
                        with (a_reqd[jj].elem)
                            s_mesg += jj + ":" + id + " is field " +
                            name + " type " + type + "\r\n";
                    Debug(2,s_mesg);
                }
                RecordBackClicks(form);

                /*
                 * Record any current OnSubmit handler.
                 */
                form.tectite_onsubmit_orig = form.onsubmit;
                /*
                 * Install our OnSubmit handler.
                 */
                form.onsubmit = ValidateOnSubmit;
                /*
                 * record the list of required specifications
                 */
                form.tectite_required_specs = a_reqd;
            }
            else
                Debug(2,"No required fields");
        }
    }
    
    /*
     * Function:    RecordBackClicks
     * Parameters:  form    the form
     * Returns:     void
     * Description:     
     *  Checks for a "multi_go_back" button and, if it exists,
     *  adds an onclick handler to all buttons so we can accurately
     *  record whether the user has clicked the back button.
     */
    function    RecordBackClicks(form)
    {
        if (form.multi_go_back && IsPushButton(form.multi_go_back))
        {
            var elem = form.multi_go_back;

            /*
             * Record any current OnClick handler.
             */
            elem.tectite_onback_orig = elem.onclick;
            /*
             * Install our OnClick handler.
             */
            elem.onclick = function() {
                Debug(1,"Clicked " + elem.name);
                elem.tectite_clicked = true;
                if (elem.tectite_onback_orig)
                {
                    var     b_ret = elem.tectite_onback_orig();

                    /*
                     * if the original handler is returning false, then
                     * the submit will not happen; so clear out the "clicked"
                     * recording.  If we don't do this, then a failed back
                     * followed by a next/ok, will submit the form without
                     * validation.
                     */
                    if (b_ret === false)
                        elem.tectite_clicked = null;
                    return b_ret;
                }
            };
        }
    }

    /*
     * Function:    RecordFieldIndexes
     * Parameters:  form    the form
     * Returns:     void
     * Description:     
     *  Adds the form position of each field element to the element.
     */
    function    RecordFieldIndexes(form)
    {
        for (var ii = 0 ; ii < form.elements.length ; ii++)
        {
            var elem = form.elements[ii];

            elem.tectite_form_order = ii;
        }
    }

    /*
     * Function:    ValidateOnSubmit
     * Parameters:  void
     * Returns:     ?   returns false to prevent submission
     * Description:     
     *  Validates fields on form submission.
     */
    function    ValidateOnSubmit()
    {
        var     b_valid = true;
        var     e_focus = null;

        /*
         * if a multi-page back button has been clicked, don't validate
         */
        if (!this.multi_go_back || !this.multi_go_back.tectite_clicked)
        {
            for (var ii = 0 ; ii < this.tectite_required_specs.length ; ii++)
            {
                var     spec = this.tectite_required_specs[ii];

                if (!spec.advanced)
                    if (spec.elem.tectite_validation)
                    {
                        spec.elem.tectite_validation();
                        if (IsInvalid(spec.elem))
                        {
                            /*
                         * give focus to the field that is closest
                         * to the beginning of the form
                         */
                            if (!e_focus ||
                                e_focus.tectite_form_order > spec.elem.tectite_form_order)
                                e_focus = spec.elem;
                            b_valid = false;
                        }
                    }
            }
            if (!b_valid)
            {
                if (e_focus)
                    e_focus.focus();
                if (s_error_submit)
                    alert(s_error_submit);
                return (false);
            }
            /*
             * all is valid, invoke the original onsubmit handler
             */
            if (this.tectite_onsubmit_orig)
                return this.tectite_onsubmit_orig();
        }
    }

    /*
     * Function:    IsInvalid
     * Parameters:  elem    a field
     * Returns:     bool    true if the field is marked invalid
     * Description:     
     *  Checks the CSS class for a "TectiteFieldError".
     */
    function    IsInvalid(elem)
    {
        return (elem.className && elem.className.indexOf("TectiteFieldError") !== -1);
    }

    /*
     * Function:    OnClickIsRequired
     * Parameters:  void
     * Returns:     void
     * Description:     
     *  Validates a required field on click.
     */
    function    OnClickIsRequired()
    {
        Debug(4,"OnClickIsRequired: ",this.name);
        if (TestFieldValid(this))
            if (this.tectite_onclick_orig)
                this.tectite_onclick_orig();
    }
    
    /*
     * Function:    OnChangeIsRequired
     * Parameters:  void
     * Returns:     void
     * Description:     
     *  Validates a required field on change.
     */
    function    OnChangeIsRequired()
    {
        Debug(4,"OnChangeIsRequired: ",this.name);
        if (TestFieldValid(this))
            if (this.tectite_onchange_orig)
                this.tectite_onchange_orig();
    }

    /*
     * Function:    OnBlurIsRequired
     * Parameters:  void
     * Returns:     void
     * Description:     
     *  Validates a required field on blur.
     */
    function    OnBlurIsRequired()
    {
        Debug(4,"OnBlurIsRequired: ",this.name);
        if (TestFieldValid(this))
            if (this.tectite_onblur_orig)
                this.tectite_onblur_orig();
    }

    /*
     * Function:    TestFieldValid
     * Parameters:  elem    the field element
     * Returns:     bool    true if the field is valid
     * Description:     
     *  Validates a field and marks it as valid or invalid.
     */
    function    TestFieldValid(elem)
    {
        var     b_valid = false;

        Debug(4,"TestFieldValid: ",elem.name);
        /*
         * Validate the field based on type
         */
        if (IsRadio(elem))
        {
            var     e_checked;

            if ((e_checked = TestRadioChecked(elem)) !== null)
            {
                Debug(1,"TestFieldValid: ",elem.name," radio checked");
                b_valid = true;
            }
            else
                Debug(1,"TestFieldValid: ",elem.name," radio UNCHECKED");
        }
        else if (IsCheckbox(elem))
        {
            if (elem.checked)
            {
                Debug(1,"TestFieldValid: ",elem.name," checkbox checked");
                b_valid = true;
            }
            else
                Debug(1,"TestFieldValid: ",elem.name," checkbox UNCHECKED");
        }
        else
        {
            /*
             * text-type field
             */
            if (elem.value && elem.value !== "")
            {
                Debug(1,"TestFieldValid: ",elem.name," value: '",elem.value,"'");
                b_valid = true;
            }
            else
                Debug(1,"TestFieldValid: ",elem.name," EMPTY");
        }
        if (b_valid)
            /*
         * field is valid:
         *  remove the TectiteFieldError CSS class
         */
            validator.MarkValid(elem);
        else
            /*
         * field is invalid:
         *  add the TectiteFieldError CSS class
         */
            validator.MarkInvalid(elem,elem.tectite_required_mesg);
        return (b_valid);
    }

    /*
     * Method:      TestRadioChecked
     * Parameters:  elem    one of the radio button elements
     * Returns:     mixed   the element that is checked or null if none checked
     * Description: 
     *  Checks all the radio buttons with this element's field name
     *  to see if one of them is checked.
     */
    function    TestRadioChecked(elem)
    {
        Debug(3,"TestRadioChecked: ",elem.name);
        if (elem.tectite_form)
        {
            var     a_buttons = FindAllByName(GetFormFromElem(elem),elem.name);

            Debug(3,"TestRadioChecked: found ",a_buttons.length," buttons");
            for (var ii = 0 ; ii < a_buttons.length ; ii++)
            {
                Debug(4,"TestRadioChecked: button ID ",a_buttons[ii].id);
                if (IsRadio(a_buttons[ii]))
                {
                    Debug(4,"TestRadioChecked: is radio");
                    if (a_buttons[ii].checked)
                    {
                        Debug(4,"TestRadioChecked: is checked");
                        return (a_buttons[ii]);
                    }
                    else
                        Debug(4,"TestRadioChecked: is NOT checked");
                }
            }
        }
        return (null);
    }
    
    /* 
     * Function:    MarkValid
     * Parameters:  elem    a field element
     * Returns:     void
     * Description:     
     *  Marks a field valid by removing the TectiteFieldError CSS
     *  class.
     */
    this.MarkValid = function(elem)
    {
        if (IsInvalid(elem))
        {
            /*
             * for radio buttons, remove the CSS class from all of them
             */
            if (IsRadio(elem))
            {
                var     a_buttons = FindAllByName(GetFormFromElem(elem),elem.name);

                for (var ii = 0 ; ii < a_buttons.length ; ii++)
                    if (IsRadio(a_buttons[ii]))
                    {
                        a_buttons[ii].className = a_buttons[ii].className.replace(/\s*TectiteFieldError/,"");
                        RemoveErrorMessage(a_buttons[ii]);
                    }
            }
            else
            {
                elem.className = elem.className.replace(/\s*TectiteFieldError/,"");
                RemoveErrorMessage(elem);
            }
            Debug(2,"MarkValid: Field ",elem.name," is now class '",elem.className,"'");
        }
    }

    /* 
     * Function:    MarkInvalid
     * Parameters:  elem    a field element
     *              s_mesg  the message to display
     * Returns:     void
     * Description:     
     *  Marks a field invalid by adding the TectiteFieldError CSS
     *  class.
     */
    this.MarkInvalid = function(elem,s_mesg)
    {
        if (!IsInvalid(elem))
        {
            if (!s_mesg)
            {
                if (IsRadio(elem))
                    s_mesg = s_error_radio_reqd;
                else if (IsSelect(elem))
                    s_mesg = s_error_select_reqd;
                else if (IsCheckbox(elem))
                    s_mesg = s_error_checkbox_reqd;
                else
                    s_mesg = s_error_field_empty;
            }

            /*
             * for radio buttons, add the CSS class to all of them
             */
            if (IsRadio(elem))
            {
                var     a_buttons = FindAllByName(GetFormFromElem(elem),elem.name);
                var     b_done = false;

                for (var ii = 0 ; ii < a_buttons.length ; ii++)
                    if (IsRadio(a_buttons[ii]))
                    {
                        a_buttons[ii].className += " TectiteFieldError";
                        if (!b_done)
                        {
                            /*
                         * add the error message before the first button found
                         */
                            a_buttons[ii].tectite_error_mesg_node = validator.AddErrorMessage(a_buttons[ii],s_mesg);
                            b_done = true;
                        }
                    }
            }
            else
            {
                /*
                 * mark this element as invalid
                 */
                elem.className += " TectiteFieldError";
                /*
                 * add the error message to the document
                 */
                elem.tectite_error_mesg_node = validator.AddErrorMessage(elem,s_mesg);
            }
        }
        Debug(2,"MarkInvalid: Field ",elem.name," is now class '",elem.className,"'");
    }

    /* 
     * Function:    FindParentDiv
     * Parameters:  elem    a field element
     *              s_class the CSS class to search for
     * Returns:     Node    the parent node with the given class, null if not found
     * Description:     
     *  Searches up the document for a parent node with the given CSS class.
     */
    function    FindParentDiv(elem,s_class)
    {
        var     e_parent = elem.parentNode;

        while (e_parent !== null)
        {
            if (e_parent.tagName &&
                e_parent.tagName.toLowerCase() === "div" &&
                e_parent.className.indexOf(s_class) !== -1)
                break;
            e_parent = e_parent.parentNode;
        }
        return (e_parent);
    }

    /* 
     * Function:    AddErrorMessage
     * Parameters:  elem    the field element to add the message to
     *              s_mesg  the error message to display
     * Returns:     Object  info about the node that was added to the document
     * Description:     
     *  Adds an error message to the document.
     *  This method looks for a parent or grandparent DIV with a CSS class
     *  of TectiteFormDesignerField, and utilizes that.
     *  If no such DIV is found, then it calls AddErrorMesg2Element
     *  to display the error.
     */
    this.AddErrorMessage = function(elem,s_mesg)
    {
        var     e_div;

        if ((e_div = FindParentDiv(elem,"TectiteFormDesignerField")) !== null)
        {
            e_div.className += " TectiteFieldError";
            Debug(4,"AddErrorMessage: adding class to div: '",e_div.className,"'");
            return (AddErrorMesg2Div(e_div,s_mesg))
        }
        return (AddErrorMesg2Element(elem,s_mesg));
    }

    /*
     * Function:    AddErrorMesg2Element
     * Parameters:  e_field the field element to add the message to
     *              s_mesg  the error message to display
     * Returns:     Object  info about the node that was added to the document
     * Description:     
     *  Adds an error message to the document near the given field element.
     */
    function    AddErrorMesg2Element(e_field,s_mesg)
    {
        /*
         * create a span element with CSS class TectiteFieldError
         * to contain the error message
         */
        var e_span = document.createElement("span");

        e_span.className = "TectiteFieldError";
        /*
         * Add the message for this field
         */
        e_span.appendChild(document.createTextNode(s_mesg));
        /*
         * for radio buttons, add the message above it, along with a
         * line break
         */
        if (IsRadio(e_field))
        {
            e_span.appendChild(document.createElement("br"));
            return (new NodeInfo(e_field.parentNode,e_field.parentNode.insertBefore(e_span,e_field)));
        }
        /*
         * This adds the span before the next sibling of the field
         * or right at the end of the parent.
         */
        return (new NodeInfo(e_field.parentNode,e_field.parentNode.insertBefore(e_span,e_field.nextSibling)));
    }

    /*
     * Function:    AddErrorMesg2Div
     * Parameters:  e_div   the div element to add the message to
     *              s_mesg  the error message to display
     * Returns:     NodeInfo info about the node that was added to the document
     * Description:     
     *  Adds an error message to the document inside the given DIV.
     */
    function AddErrorMesg2Div(e_div,s_mesg)
    {
        /*
         * create a P element with CSS class TectiteFieldError
         * to contain the error message
         */
        var e_block = document.createElement("p");

        e_block.className = "TectiteFieldError";
        /*
         * Add the message for this field
         */
        e_block.appendChild(document.createTextNode(s_mesg));
        /*
         * This adds the block to the end of the DIV.
         */
        return (new NodeInfo(e_div,e_div.appendChild(e_block)));
    }

    /* 
     * Function:    RemoveErrorMessage
     * Parameters:  elem    the field element from which to remove the message
     * Returns:     Node    the node that was removed from the document
     * Description:     
     *  Removes an error message from the document near the given field element.
     */
    function    RemoveErrorMessage(elem)
    {
        var     node = null;

        /*
         * The field element must have the document node stored.
         */
        if (elem.tectite_error_mesg_node)
        {
            var o_node_info = elem.tectite_error_mesg_node;

            node = o_node_info.GetParent().removeChild(o_node_info.GetChild());
            Debug(4,"RemoveErrorMessage: removed node");
            elem.tectite_error_mesg_node = null;
        }
        var     e_div;

        if ((e_div = FindParentDiv(elem,"TectiteFormDesignerField")) !== null)
        {
            e_div.className = e_div.className.replace(/\s*TectiteFieldError/,"");
            Debug(4,"RemoveErrorMessage: removed class from div: '",e_div.className,"'");
        }
        return (node);
    }

    /*
     * Function:    CheckRequired
     * Parameters:  form    the form
     *              a_reqd  an associative array that holds required elements
     * Returns:     bool    true if the form has some required fields
     * Description:     
     *  Checks whether a form has required fields, and adds them to the given array.
     */
    function    CheckRequired(form,a_reqd)
    {
        var     b_found = false;

        /*
         * Function:    CheckRequired::_SetSimpleRequired
         * Parameters:  elem        the element
         *              o_reqd_spec the required specification for the field
         * Returns:     void
         * Description:     
         *  Sets up the element for simple required processing.
         */
        function    _SetSimpleRequired(elem,o_reqd_spec)
        {
            if (IsRadio(elem))
            {
                /*
                 * set up each of the radio buttons
                 */
                var     a_buttons = FindAllByName(form,elem.name);

                for (var ii = 0 ; ii < a_buttons.length ; ii++)
                    if (IsRadio(a_buttons[ii]))
                    {
                        var     e_button = a_buttons[ii];

                        Debug(3,e_button.id," name = ",e_button.name," is radio button field");
                        /*
                     * save the current OnClick handler
                     */
                        e_button.tectite_onclick_orig = e_button.onclick;
                        /*
                     * load our OnClick handler
                     */
                        e_button.onclick = OnClickIsRequired;
                        /*
                     * and the validation for form submission
                     */
                        e_button.tectite_validation = OnClickIsRequired;
                        /*e_button.checked = false;       /* just for testing! */
                        /*
                     * point back to the form from this element
                     */
                        e_button.tectite_form = form;
                    }
            }
            else if (IsCheckbox(elem))
            {
                Debug(3,elem.id," name = ",elem.name," is checkbox field");
                /*
                 * save the current OnClick handler
                 */
                elem.tectite_onclick_orig = elem.onclick;
                /*
                 * load our OnClick handler
                 */
                elem.onclick = OnClickIsRequired;
                /*
                 * and the validation for form submission
                 */
                elem.tectite_validation = OnClickIsRequired;
            }
            else
            {
                Debug(3,elem.id," name = ",elem.name," is an onchange field");
                /*
                 * save the current OnChange handler
                 */
                elem.tectite_onchange_orig = elem.onchange;
                /*
                 * load our OnChange handler
                 */
                elem.onchange = OnChangeIsRequired;
                /*
                 * install as onblur too, because in some cases, FF doesn't
                 * fire the OnChange handler (e.g. when selecting a previous entry
                 * into an empty box).
                 */
                elem.tectite_onblur = elem.onblur;
                elem.onblur = OnBlurIsRequired;
                /*
                 * and the validation for form submission
                 */
                elem.tectite_validation = OnChangeIsRequired;
            }
            /*
             * store the message with this field
             * (we don't do this now because it's not a good match
             * in the JavaScript with the message that would
             * appear on a separate error page)
             */
            /*elem.tectite_required_mesg = o_reqd_spec.mesg;*/
            /*
             * point back to the form that this field belongs to
             */
            elem.tectite_form = form;
        }

        if (form.required && form.required.value)
        {
            var     a_list = form.required.value.split(",");

            Debug(6,"Required list split to ",a_list.length);
            for (var ii = 0 ; ii < a_list.length ; ii++)
            {
                var     o_reqd_spec = ParseRequired(a_list[ii].tectite_trim());

                if (!o_reqd_spec.advanced && o_reqd_spec.name)
                {
                    Debug(6,"'",a_list[ii],"' parsed to '",o_reqd_spec.name,"' mesg='",o_reqd_spec.mesg,"'");
                    var     elem = FindFieldByName(form,o_reqd_spec.name);

                    if (elem !== null && IsInputField(elem) && !IsPushButton(elem))
                    {
                        _SetSimpleRequired(elem,o_reqd_spec);
                        o_reqd_spec.elem = elem;
                        a_reqd.push(o_reqd_spec);
                        b_found = true;
                    }
                }
            }
        }
        return (b_found);
    }

    /*
     * Function:    FindFieldByName
     * Parameters:  form    the form
     *              s_name  the name of the field
     * Returns:     HTMLelement the element matching the field, or null if not found
     * Description:     
     *  Finds a field in the form given a name.
     */
    function    FindFieldByName(form,s_name)
    {
        for (var ii = 0 ; ii < form.elements.length ; ii++)
        {
            var     elem = form.elements[ii];

            if (elem && elem.name && elem.name === s_name)
            {
                Debug(5,"Found field called ",s_name);
                return (elem);
            }
        }
        Debug(5,"No field called ",s_name);
        return (null);
    }
    
    /*
     * Function:    GetFormFromElem
     * Parameters:  elem    an element on the form
     * Returns:     form element or null
     * Description:
     *  Returns the form from an element on the form.
     */
    function GetFormFromElem(elem)
    {
        if (typeof elem.tectite_form !== 'undefined' && elem.tectite_form !== null)
            return (elem.tectite_form);
        if ($ !== null)
        {
            var     j_form = $(elem).closest('form');
            
            if (j_form.length == 1)
                return (j_form.get(0));
        }
        return (null);
    }

    /*
     * Function:    FindAllByName
     * Parameters:  form    the form
     *              s_name  a field name
     * Returns:     array   the form elements with this name
     * Description:     
     *  Finds all elements in the form with the given name.
     */
    function    FindAllByName(form,s_name)
    {
        var     a_ret = [];

        for (var ii = 0 ; ii < form.elements.length ; ii++)
        {
            var     elem = form.elements[ii];

            if (elem && elem.name && elem.name === s_name)
            {
                Debug(5,"Found field called ",s_name);
                a_ret.push(elem);
            }
        }
        return (a_ret);
    }

    /*
     * Function:    ParseRequired
     * Parameters:  s_spec  a FormMail required specification
     * Returns:     object  an object describing the required specification
     * Description:     
     *  Parses an individual FormMail required specification.
     */
    function    ParseRequired(s_spec)
    {
        var     o_reqd = new Object();
        var     a_name_split;
        var     i_pos;

        if ((i_pos = s_spec.search(/[|!=^]/)) == -1)
        {
            /*
             * simple required specification
             */
            a_name_split = s_spec.split(":",2);
            o_reqd.advanced = false;
            o_reqd.name = a_name_split[0].tectite_trim();
            o_reqd.mesg = (a_name_split.length > 1 ? a_name_split[1] : "").tectite_trim();
        }
        return (o_reqd);
    }

    /* 
     * Function:    IsField
     * Parameters:  elem    an HTMLelement object
     * Returns:     bool    true if the element is a form field
     * Description: 
     *  Checks if an element is a form field.
     */
    function    IsField(elem)
    {
        switch (elem.tagName.toLowerCase())
        {
            case "input":
            case "select":
            case "button":
            case "textarea":
                return (true);
            default:
                return (false);
        }
    }

    /* 
     * Function:    IsRadio
     * Parameters:  elem    an HTMLelement object
     * Returns:     bool    true if the element is a radio button
     * Description: 
     *  Checks if an element is a radio button
     */
    function    IsRadio(elem)
    {
        if (elem.tagName.toLowerCase() === "input")
            return (elem.type.toLowerCase() === "radio");
        return (false);
    }

    /* 
     * Function:    IsCheckbox
     * Parameters:  elem    an HTMLelement object
     * Returns:     bool    true if the element is a radio button
     * Description: 
     *  Checks if an element is a check box.
     */
    function    IsCheckbox(elem)
    {
        if (elem.tagName.toLowerCase() === "input")
            return (elem.type.toLowerCase() === "checkbox");
        return (false);
    }

    /* 
     * Function:    IsSelect
     * Parameters:  elem    an HTMLelement object
     * Returns:     bool    true if the element is a select field
     * Description: 
     *  Checks if an element is a select field
     */
    function    IsSelect(elem)
    {
        return (elem.tagName.toLowerCase() === "select");
    }

    /* 
     * Function:    IsPushButton
     * Parameters:  elem    an HTMLelement object
     * Returns:     bool    true if the element is a push button
     * Description: 
     *  Checks if an element is a push button.
     */
    function    IsPushButton(elem)
    {
        switch (elem.tagName.toLowerCase())
        {
            case "input":
                switch (elem.type.toLowerCase())
                {
                    case "button":
                    case "reset":
                    case "submit":
                        return (true);
                }
                return (false);
            case "button":
                return (true);
            default:
                return (false);
        }
    }

    /* 
     * Function:    IsInputField
     * Parameters:  elem    an HTMLelement object
     * Returns:     bool    true if the element is a form field that accepts user input
     * Description: 
     *  Checks if an element is a form field that accepts user input (i.e. is not a hidden field).
     */
    function    IsInputField(elem)
    {
        return (IsField(elem) && elem.type.toLowerCase() != "hidden");
    }
    
    
    /*
     * Function:    AjaxSetup
     * Parameters:  m_form      the form element
     *              s_img_url   URL to obtain images
     * Returns:     void
     * Description:
     *  Initializes Ajax for the form.
     */
    function AjaxSetup(m_form,s_img_url)
    {
        var j_form = $(m_form);
        var mesgs = {
            loading_img:'<img src="ajax-loading.gif" alt="" />',
            done_img:'<img src="ajax-done.gif" alt="" />',
            done_mesg:'Message sent.',
            error_img:'<img src="ajax-error.gif" alt="" />',
            error_mesg:'Error!'
        };
        
        function AdjustImgTag(s_url,s_img)
        {
            return (s_img.replace(/src="/,'src="'+s_url));
        }
        
        /*
         * Preload images
         */
        for (var s_fld in mesgs)
        {
            if (s_fld.indexOf('_img') != -1)
                $(AdjustImgTag(s_img_url,mesgs[s_fld]));
        }
        
        /*
         * Store HTML strings in the form.
         */
        j_form.data('progress_loading',AdjustImgTag(s_img_url,mesgs.loading_img));
        j_form.data('progress_done',AdjustImgTag(s_img_url,mesgs.done_img) + '&#160;'+mesgs.done_mesg);
        j_form.data('progress_error',AdjustImgTag(s_img_url,mesgs.error_img) + '&#160;'+mesgs.error_mesg);

    }
        
    /*
     * Function:    AjaxSubmit
     * Parameters:  m_form    the form element
     * Returns:     void
     * Description:
     *  Submits the given form using Ajax.
     */
    function AjaxSubmit(m_form)
    {
        var j_form = $(m_form);
        var s_data = j_form.serialize();
        var j_progress = j_form.find('.TectiteAjaxProgress');
    
        function SetProgress(s_stage,s_mesg)
        {
            if (typeof s_mesg === 'undefined' || s_mesg === null)
                s_mesg = '';
            if (s_stage === null)
                j_progress.html(s_mesg);
            else
                j_progress.html(j_form.data('progress_' + s_stage) + s_mesg);
        }
        function ClearProgress()
        {
            j_progress.html('');
            if (j_form.data('tprogress')) {
                clearTimeout(j_form.data('tprogress'));
                j_form.data('tprogress',null)
            }
        }
        function DisplayError(error_items)
        {
            for (var s_fld in error_items)
            {
                try
                {
                    var j_elem = j_form.find('[name='+s_fld+']');
                        
                    if (j_elem.length > 0)
                    {
                        var elem = j_elem.get(0);
                            
                        TectiteFormValidator.MarkInvalid(elem/*,error_items[s_fld]*/);
                        function Reset(j_elem) {
                            TectiteFormValidator.MarkValid(j_elem.get(0));
                            j_elem.unbind('change',Reset);
                            j_elem.unbind('blur',Reset);
                            ClearProgress();
                        };
                                
                        j_elem.change(function () {
                            Reset($(this));
                        });
                            
                        j_elem.blur(function () {
                            Reset($(this));
                        });
                    }
                }
                catch (exc)
                {
                }
            }
        }
                
        
       
        ClearProgress();
        SetProgress('loading');
        j_form.find('input[type=submit]').attr('disabled',true);

        //
        // note we handle remote posting using CORS and then fallback to jsonp
        //
        var ajax_data = {
            type:'POST',
            url:j_form.attr('action'),
            cache:false,
            data:s_data,
            success:function (s_data,s_status,jqxhr) {
                var res;
                var i_clear_secs = 10;  /* set for errors */
                        
                try
                {
                    if (typeof s_data == 'object')
                        res = s_data;
                    else
                        res = $.parseJSON(s_data);
                }
                catch (exc)
                {
                    res = {
                        Result: 'FAILED',
                        ErrorMesg: 'Server returned unexpected result (JSON parse failed)'
                    };
                }
                        
                if (res.Result == "OK") {
                    SetProgress('done');
                    //                    j_form.find(' input[name=subject]').val('');
                    //                    j_form.find(' textarea[name=Message]').val('');
                    i_clear_secs = 2;    /* shorten for success */
                }
                else {
                    SetProgress('error','&#160;' + res.ErrorMesg);
                    if (res.ErrorItems)
                        DisplayError(res.ErrorItems);
                }
                j_form.data('tprogress',setTimeout(function () {
                    ClearProgress();
                    if (res.Result == "OK")
                        j_form.get(0).reset();
                },i_clear_secs * 1000));
                j_form.find('input[type=submit]').attr('disabled',false);
            }
        };
        
        var clone = (function(){ 
            return function (obj) {
                Clone.prototype=obj;
                return new Clone()
            };
            function Clone(){}
        }());

        /*
         * Try CORS so we can do a POST, if that doesn't work try jsonp
         * (only GET method).
         * IE8 and IE9 don't work with CORS, so GET method is used.
         */
        function TryJSONP(ajax_data)
        {
            ajax_data.dataType = 'jsonp';
            ajax_data.type = 'GET';
            ajax_data.async = true;
            //
            // if a second network error occurs after the TryCORS error (e.g. wrong
            // URL, the error function below won't be called.
            // The workaround is the following timeout value (which is a good idea anyway for
            // a GET request).
            //
            ajax_data.timeout = 10000;
            ajax_data.error = function (jqxhr,s_status,m_error) {
                if (s_status == 'timeout')
                    SetProgress(null,'Timeout....please try again later.');
                else
                    SetProgress('error','&#160;A network error occurred: ' + s_status + '&#160;' + m_error);
                j_form.find('input[type=submit]').attr('disabled',false);
            };
            $.ajax(ajax_data);
        }
        
        function TryCORS(ajax_data)
        {
            var orig_data = clone(ajax_data);
            
            ajax_data.dataType = 'json';
            ajax_data.type = 'POST';
            ajax_data.async = false;
            ajax_data.error = function (jqxhr,s_status,m_error) {
                TryJSONP(orig_data);
            };
            $.ajax(ajax_data);
        }
        
        TryCORS(ajax_data);
    }
}
/*
 * Initialize
 */
TectiteFormValidator = new TectiteFormValidator();
