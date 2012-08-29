/**
 * @author Tom
 * 
 * Based on: http://javascriptmvc.com/docs.html#!jQuery.fn.formParams
 *
 * 
 * GETs or SETs form parameters to/from Object.
 * 
 * When GET and convert == true -> strings that represent numbers and booleans will be converted and empty string will not be added to the object. 
 * When SET and convert == true -> fields which values are undefined (in the passed object) will be cleared
 * 
 * Example html:
 * @codestart html
 * &lt;form>
 *   &lt;input name="foo[bar]" value='2'/>
 *   &lt;input name="foo[ced]" value='4'/>
 * &lt;form/>
 * @codeend
 * 
 * Example code: 
 *     $('form').formParams() //-> { foo:{bar:'2', ced: '4'} } 
 *
 * 
 * @param {Object} [params] If an object is passed, the form will be repopulated with the values of the object based on the name of the inputs within the form
 * 
 * @param {Boolean} [convert=false] True if strings that look like numbers and booleans should be converted and if empty string should not be added to the result. Defaults to false.
 * 
 * @return {Object} An object of name-value pairs.
 */

;(function($) {
	var keyBreaker = /[^\[\]]+/g, 
		numberMatcher = /^[\-+]?[0-9]*\.?[0-9]+([eE][\-+]?[0-9]+)?$/,
		isNumber = function(value) {
			if (typeof value == 'number') return true;
			if (typeof value != 'string') return false;
			return value.match(numberMatcher);
		};

	$.fn.extend({
		formParams: function(params, convert) {
			if (typeof params === 'boolean') { convert = params; params = null; }
			if (params) return this.setParams(params, convert);																	// SET
			else if (this[0].nodeName.toLowerCase() == 'form' && this[0].elements) {											// GET
				return jQuery(jQuery.makeArray(this[0].elements)).getParams(convert);
			}
			//return jQuery("input[name], textarea[name], select[name]", this[0]).getParams(convert);
		},


		setParams: function(params, clear) {
			this.find("[name]").each(function() {																				// Find all the inputs
				var name = $(this).attr("name"), value = params[name];

				if (name.indexOf('[') > -1){																					// if name is object, e.g. user[name], userData[address][street], update value to read this correctly
					var names = name.replace(/]/g, '').split('['), i = 0, n = null, v = params;
					for (; n = names[i++] ;) if (v[n]) v = v[n]; else { v = undefined; break; }
					value = v;
				}
				
				if (clear !== true && value === undefined) return;																// if clear==true and no value = clear field, otherwise - leave it as it was
				if (value === null || value === undefined) value = '';															// if no value - clear field

				if (this.type === 'radio') this.checked = (this.value == value);
				else if (this.type === 'checkbox') this.checked = value;
				else {
					if ("placeholder" in document.createElement("input")) this.value = value;									// normal browser
					else {																										// manually handle placeholders for specIEl browser
						var el=$(this); 
						if (this.value != value && value != '') el.data('changed', true);
						if (value == '') el.data('changed', false).val(el.attr('placeholder'));
						else this.value = value;						
					}
				}
			});
		},


		getParams: function(convert) {
			var data = {}, current;
			convert = (convert === undefined ? false : convert);

			this.each(function() {
				var el = this, type = el.type && el.type.toLowerCase();
				if ((type == 'submit') || !el.name)  return;																	// if we are submit, ignore
				
				var key = el.name, value = $.data(el, "value") || $.fn.val.call([el]),
					parts = key.match(keyBreaker), lastPart;																	// make an array of values

				if (el.type === 'radio' && !el.checked) return;																	// return only "checked" radio value
				if (el.type === 'checkbox') value = el.checked;																	// convert chekbox to [true | false]

				var $el=$(el); if($el.data('changed')!==true && value==$el.attr('placeholder')) value='';						// clear placeholder valus for IEs

				if (convert){
					if (isNumber(value)){
						var tv = parseFloat(value), cmp=tv+'';
						if (value.indexOf('.') > 0) cmp = tv.toFixed(value.split('.')[1].length);								// convert (string)100.00 to (int)100 
						if (cmp === value) value = tv;
					}
					else if (value === 'true') value = true;
					else if (value === 'false') value = false;
					if (value === '') value = undefined;
				}

				current = data;
				for (var i = 0; i < parts.length - 1; i++) {																	// go through and create nested objects
					if (!current[parts[i]]) current[parts[i]] = {};
					current = current[parts[i]];
				}
				lastPart = parts[parts.length - 1];

				if (current[lastPart]) {																						// now we are on the last part, set the value
					if (!$.isArray(current[lastPart])) {
						current[lastPart] = current[lastPart] === undefined ? [] : [current[lastPart]];
					}
					current[lastPart].push(value);
				} 
				else if (!current[lastPart]) current[lastPart] = value;
			});
			return data;
		}
	});
})(jQuery);
