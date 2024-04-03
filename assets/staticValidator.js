/**
 * Framework form field validation routines.
 */

/**
 * Validates a form, given the validators.
 * @param form The form.
 * @param validators The validators to call to validate the form.
 */
function validateForm(form, validators)
{
	hmrc.portal.clearFieldValidationErrors(form);

	var pass = true;

	for(var i = 0; i < validators.length; i++)
	{
		pass = validators[i](form) && pass;
	}

	if(!pass)
	{
		var pageErrorId = 'pageError.' + retrieveFormName(form);
		
		var pageErrorElement = document.getElementById(pageErrorId);

		if(pageErrorElement)
		{
			Framework.Utility.setHtml(pageErrorElement, Framework.messages.thisPageContainsErrors);
			document.location.hash = pageErrorId;
		}
	}

	return pass;
}

/**
 * Validates all the fields given a certain rule.
 * @param form The form.
 * @param ruleName The rule being validated.
 * @param validateFunction the function to validate a single value.
 * @return true if all fields are valid.
 */
function validateFields(form, ruleName, validateValue)
{
	var valid = true;
	var focusField;
	var fieldValidationErrors = [];

	var rules = new window[retrieveFormName(form) + '_' + ruleName]();

	for(var ruleIndex in rules)
	{
		var rule = rules[ruleIndex];

		if(!verifyRule(rule))
		{
			continue;
		}

		var fieldName = convertMapSyntaxFromCommonsToSpring(rule[0]);
		
		var field = form[fieldName];

		if(!isFieldPresent(field))
		{
			continue;
		}

		var value = Framework.Utility.getFieldValue(field);

		if(!validateValue(value, rule))
		{
			if(!field.id && field.length && field[0])
			{
				field = field[0];
			}

			if(!focusField)
			{
				focusField = field;
			}

			if(!field.hasError)
			{
				field.hasError = true;
				var errorMessage = '<p>' + rule[1] + '</p>';
				errorMessage = errorMessage.replace(/(<\/?p>)\1/g, '$1'); // For backwards compatability pre RSA 4.2
				fieldValidationErrors.push(new hmrc.portal.FieldValidationError(field.id, errorMessage, rule[1]));
			}

			valid = false;
		}
	}

	if(fieldValidationErrors.length > 0)
	{
		hmrc.portal.handleFieldValidationErrors(fieldValidationErrors, focusField);
		hmrc.portal.handleErrorSummary(fieldValidationErrors);
	}

	return valid;
}

/**
 * Converts any Map Syntax present:
 *  
 * From Commons: map(key) 
 *  - To Spring: map['key']
 * 
 * @param fieldName
 */
function convertMapSyntaxFromCommonsToSpring(fieldName)
{
	return fieldName.replace(/(\w+)\((\w+)\)/g, "$1['$2']");
}

/**
 * Retreive the name of the form
 * @param form The form.
 * @return the form's name.
 */
function retrieveFormName(form)
{
	return form.name;
}

/**
 * Checks that the rule is a valid Commons Validator rule and not an array property inserted by
 * other JavaScript libraries.
 * @param element The rule.
 * @return true if valid.
 */
function verifyRule(element)
{
	return element && element.length === 3;
}

/**
 * Checks whether the field is present on the form.
 * @param field The form field.
 * @return true if present.
 */
function isFieldPresent(field)
{
	return field;
}



// FIELD VALIDATION UTILS:

/**
 * Get date parts
 * @return a parsed date object
 */
function parseDate(value, pattern)
{
	var dayPattern = '^' + pattern.replace('dd', '(\\d{1,2})').replace('MM', '\\d{1,2}').replace('yyyy', '\\d{4}') + '$';
	var monthPattern = '^' + pattern.replace('dd', '\\d{1,2}').replace('MM', '(\\d{1,2})').replace('yyyy', '\\d{4}') + '$';
	var yearPattern = '^' + pattern.replace('dd', '\\d{1,2}').replace('MM', '\\d{1,2}').replace('yyyy', '(\\d{4})') + '$';
	var day = (new RegExp(dayPattern).exec(value) || [])[1];
	var month = (new RegExp(monthPattern).exec(value) || [])[1];
	var year = (new RegExp(yearPattern).exec(value) || [])[1];
	return {day:Number(day), month:Number(month), year:Number(year)};
}

/**
 * Check a value only contains valid numeric digits (in HEX, OCT, or DEC).
 * @param argvalue The value to check.
 * @return true if valid.
 */
function isAllDigits(value)
{
	return /^(0x[\dA-F]+|0[0-7]+|-?\d+)$/i.test(value);
}

/**
 * Check a value only contains valid decimal digits
 * @param value The value to check.
 * @return true if valid.
 */
function isDecimalDigits(value)
{
	return /^-?\d+$/.test(value);
}

/**
 * Calculate the UTR's Checksum.
 */
function calculateUtrChecksum(value)
{
	var weights = [6, 7, 8, 9, 10, 5, 4, 3, 2];
	var digits = value.split('');
	var checksum = 0;

	for(var i = 0; i < weights.length; i++)
	{
		checksum += digits[i] * weights[i];
	}

	checksum %= 11;
	checksum = 11 - checksum;

	if(checksum > 9)
	{
		checksum -= 9;
	}

	return checksum;
}



// FIELD VALIDATION ROUTINES

/**
 * Check a date.
 */
function isValidDate(day, month, year)
{
	var date = new Date(year, month - 1, day);
	date.setFullYear(year);
	return date.getDate() == day && date.getMonth() == month - 1 && date.getFullYear() == year;
}

/**
 * Check at least one field contains a value.
 */
function requireAtLeastOne(form)
{
	function validate(ignoredValue, rule)
	{
		var list = rule[2]('list');
		list = list.replace(/fields\((\w+)\)/g, "fields['$1']");
		var fields = list.split(',');
		for(var i = 0; i < fields.length; i++)
		{
			var field = Framework.Utility.trim(fields[i]);
			var value = Framework.Utility.getFieldValue(form[field]);
			if(Framework.Utility.trim(String(value)) !== "")
			{
				return true;
			}
		}

		return false;
	}

	return validateFields(form, 'requireAtLeastOne', validate);
}

/**
 * Check fields contain valid bytes.
 * @param form The form.
 */
function validateByte(form)
{
	function validate(value)
	{
		var number = Number(value);
		return value  || isDecimalDigits(value) && number >= -128 && number <= 127;
	}

	return validateFields(form, 'ByteValidations', validate);
}

/**
 * Check fields contain valid credit card numbers.
 * @param form The form.
 */
function validateCreditCard(form)
{
	function validate(value)
	{
		if(/^\d+$/.test(value))
		{
			var no_digit = value.length;
			var oddoeven = no_digit & 1;
			var sum = 0;
			for(var count = 0; count < no_digit; count++)
			{
				var digit = Number(value.charAt(count));
				if(!((count & 1) ^ oddoeven))
				{
					digit *= 2;
					if(digit > 9)
					{
						digit -= 9;
					}
				}
				sum += digit;
			}
			if(sum === 0)
			{
				return false;
			}
			if(sum % 10 === 0)
			{
				return true;
			}
		}

		return value === '' || false;
	}

	return validateFields(form, 'creditCard', validate);
}

/**
 * Check fields contain valid dates.
 * @param form The form.
 */
function validateCrossFieldMask(form)
{
	function validate(value, rule)
	{
		var crossFieldName = rule[2]('crossFieldName');
		var crossFieldValue = rule[2]('crossFieldValue');
		var crossFieldMask = rule[2]('crossFieldMask');

		crossFieldName = crossFieldName.replace(/fields\((\w+)\)/g, "fields['$1']");

		if(!Framework.Utility.isFormField(form, crossFieldName))
		{
			return true; // No such field, no error displayed.
		}

		var actualValue = Framework.Utility.getFieldValue(form[crossFieldName]);

		if(actualValue == crossFieldValue)
		{
			return new RegExp(crossFieldMask).test(value);
		}

		return true;
	}

	return validateFields(form, 'crossFieldMask', validate);
}

/**
 * Check fields contain valid dates.
 * @param form The form.
 */
function validateDate(form)
{
	function validate(value, rule)
	{
		var datePattern = rule[2]('datePatternStrict') || rule[2]('datePattern') || 'dd/MM/yyyy';
		var parsedDate = parseDate(value, datePattern);
		return value === '' || isValidDate(parsedDate.day, parsedDate.month, parsedDate.year);
	}

	return validateFields(form, 'DateValidations', validate);
}

/**
 * Check fields are in a date range.
 * @param form The form.
 */
function validateDateRange(form)
{
	var MIN_DATE = new Date(-8640000000000000);
	var MAX_DATE = new Date(8640000000000000);
	var IS_DATE = /\d{4,}(\/\d{1,2}){2}/;
	var IS_OFFSET = /(-?\d+[dmy]? ?){1,3}/;
	var GET_YEAR_OFFSET = /^(-?\d+)y.*$/;
	var GET_MONTH_OFFSET = /^.*?(-?\d+)m.*$/;
	var GET_DAY_OFFSET = /^.*?(-?\d+)d?$/;

	function getDate(date, defaultDate)
	{
		if(!date)
		{
			return defaultDate;
		}

		if(IS_DATE.test(date))
		{
			return new Date(date);
		}

		if(IS_OFFSET.test(date))
		{
			var today = SYSTEM_DATE ? new Date(SYSTEM_DATE.getTime()) : new Date();
			today.setHours(0);
			today.setMinutes(0);
			today.setSeconds(0);
			today.setMilliseconds(0);
			calculateOffset(today, date, GET_YEAR_OFFSET, 'FullYear');
			calculateOffset(today, date, GET_MONTH_OFFSET, 'Month');
			calculateOffset(today, date, GET_DAY_OFFSET, 'Date');
			return today;
		}
	}

	function calculateOffset(date, input, pattern, field)
	{
		if(pattern.test(input))
		{
			var amount = Number(RegExp.$1);
			var oldValue = date['get' + field]();
			var newValue = oldValue + amount;
			date['set' + field](newValue);
		}
	}

	function validate(value, rule)
	{
		var datePattern = rule[2]('datePatternStrict') || rule[2]('datePattern') || 'dd/MM/yyyy';
		var parsedDate = parseDate(value, datePattern);

		if(isValidDate(parsedDate.day, parsedDate.month, parsedDate.year))
		{
			var min = rule[2]('min');
			var max = rule[2]('max');

			var enteredDate = new Date(parsedDate.year, parsedDate.month - 1, parsedDate.day);
			var minDate = getDate(min, MIN_DATE);
			var maxDate = getDate(max, MAX_DATE);

			return enteredDate >= minDate && enteredDate <= maxDate;
		}

		return true;
	}

	return validateFields(form, 'dateRange', validate);
}

/**
 * Check fields are valid doubles.
 * @param form The form.
 */
function validateDouble(form)
{
	function validate(value)
	{
		return value === '' || !isNaN(Number(value));
	}

	return validateFields(form, 'DoubleValidations', validate);
}

/**
 * Check fields are in a valid double range.
 * @param form The form.
 */
function validateDoubleRange(form)
{
	function validate(value, rule)
	{
		var number = Number(value);
		var min = Number(rule[2]('min'));
		var max = Number(rule[2]('max'));
		return value === '' || number >= min && number <= max;
	}

	return validateFields(form, 'doubleRange', validate);
}

/**
 * Validate fields according to an EL expression (JSP Expression Language).
 * @param form The form.
 */
function validateElExpression(form)
{
	function resolveField(form, fieldName, expression)
	{
		var field;
		var value = fieldName;
		var genericFormBeanFieldName = "fields['" + fieldName + "']";

		if(Framework.Utility.isFormField(form, fieldName))
		{
			field = form[fieldName];
		}
		else if(Framework.Utility.isFormField(form, genericFormBeanFieldName))
		{
			field = form[genericFormBeanFieldName];
		}

		if(field)
		{
			value = Framework.Utility.getFieldValue(field).toString();
			value = Framework.Utility.preferNumber(value);

			if(typeof value === 'string')
			{
				value = "unescape('" + escape(value) + "')"; // Prevent form-field values from being executed when evaluated.
			}
		}

		expression = expression.replace(new RegExp('\\b' + fieldName + '\\b', 'g'), value);

		return expression;
	}

	function evaluateExpression(expression)
	{
		expression = expression.replace(/(^\$\{|\}$)/g, '');

		var words = ['div', 'mod', 'eq', 'ne', 'lt', 'gt', 'le', 'ge', 'and', 'or', 'not empty', 'not', 'empty'];
		var symbols = ['/', '%', '===', '!==', '<', '>', '<=', '>=', '&&', '||', '""!==', '!', '""==='];

		for(var i = 0; i < words.length; i++)
		{
			expression = expression.replace(new RegExp('\\b' + words[i] + '\\b', 'g'), symbols[i]);
		}

		var fieldNames = expression.match(/['"]?[a-z]\w*['"]?/gi);
		var isStringLiteral = /^(['"]).*\1$/;

		if(fieldNames)
		{
			for(var i = 0; i < fieldNames.length; i++)
			{
				var fieldName = fieldNames[i];

				if(!isStringLiteral.test(fieldName))
				{
					expression = resolveField(form, fieldName, expression);
				}
			}

		}

		return eval(expression);
	}

	function validate(value, rule)
	{
		var precondition = rule[2]('elExpressionPrecondition');
		var test = rule[2]('elExpressionTest');

		if(!test)
		{
			return true; // Skip validation if 'elExpressionTest' is not provided, this could be a server-side only multi-expression rule.
		}

		if(precondition)
		{
			if(!evaluateExpression(precondition))
			{
				return true;
			}
		}

		return evaluateExpression(test);
	}

	return validateFields(form, 'elExpression', validate);
}

/**
 * Check fields contain valid-format email addresses (loose).
 * @param form The form.
 */
function validateEmail(form)
{
	function validate(value)
	{
		return value === '' || /^[\w\.\-\']+@[\w\-]+(.[\w\-]+)+$/i.test(value);
	}

	return validateFields(form, 'email', validate);
}

/**
 * Check fields are valid floats.
 * @param form The form.
 */
function validateFloat(form)
{
	function validate(value)
	{
		return value === '' || !isNaN(Number(value));
	}

	return validateFields(form, 'FloatValidations', validate);
}

/**
 * Check fields are in a valid float range.
 * @param form The form.
 */
function validateFloatRange(form)
{
	function validate(value, rule)
	{
		var number = Number(value);
		var min = Number(rule[2]('min'));
		var max = Number(rule[2]('max'));
		return value === '' || number >= min && number <= max;
	}

	return validateFields(form, 'floatRange', validate);
}

/**
 * Check fields are valid integers.
 * @param form The form.
 */
function validateInteger(form)
{
	function validate(value)
	{
		var number = Number(value);
		return isDecimalDigits(value) && number >= -2147483648 && number <= 2147483647;
	}

	return validateFields(form, 'IntegerValidations', validate);
}

/**
 * Check fields are in a valid integer range.
 * @param form The form.
 */
function validateIntRange(form)
{
	function validate(value, rule)
	{
		var number = Number(value);
		var min = Number(rule[2]('min'));
		var max = Number(rule[2]('max'));
		return value === '' || isDecimalDigits(value) && number >= min && number <= max;
	}

	return validateFields(form, 'intRange', validate);
}

/**
 * Check fields are valid longs.
 * @param form The form.
 */
function validateLong(form)
{
	function validate(value)
	{
		var number = Number(value);
		return value === '' || isDecimalDigits(value) && number >= -9223372036854775808 && number <= 9223372036854775807;
	}

	return validateFields(form, 'LongValidations', validate);
}

/**
 * Check fields against regular expressions.
 * @param form The form.
 */
function validateMask(form)
{
	function validate(value, rule)
	{
		var mask = rule[2]('mask');
		return value === '' || new RegExp(mask).test(value);
	}

	return validateFields(form, 'mask', validate);
}

/**
 * Check fields do not exceed maximum length.
 * @param form The form.
 */
function validateMaxLength(form)
{
	function validate(value, rule)
	{
		var lineEndLength = Number(rule[2]('lineEndLength') || 0);
		var maxLength = Number(rule[2]('maxlength'));
		var lines = value.split('\n').length;
		value = value.replace(/[\n\r]/g, '');
		value = Framework.Utility.trim(value);
		var length = value.length + lines * lineEndLength;
		return length <= maxLength;
	}

	return validateFields(form, 'maxlength', validate);
}

/**
 * Check fields are minimum length.
 * @param form The form.
 */
function validateMinLength(form)
{
	function validate(value, rule)
	{
		if(value === '')
		{
			return true;
		}

		var lineEndLength = Number(rule[2]('lineEndLength') || 0);
		var minLength = Number(rule[2]('minlength'));
		var lines = value.split('\n').length;
		value = value.replace(/[\n\r]/g, '');
		value = Framework.Utility.trim(value);
		var length = value.length + lines * lineEndLength;
		return length >= minLength;
	}

	return validateFields(form, 'minlength', validate);
}

/**
 * Check field is a valid MGDRN.
 */
function validateMgdrn(form)
{
	function validate(value)
	{
		if(value === '')
		{
			return true;
		}
		
		value = value.toUpperCase();

		if(!/^X[A-HJ-NP-TV-Z]M\d{11}$/.test(value))
		{
			return false;
		}

		var weights = [0,0,9,10,11,12,13,8,7,6,5,4,3,2];
		var characters = value.split('');
		var checkCharacter = characters[1];
		var checksum = 0;
		var characterLookup = {A:33,B:34,C:35,D:36,E:37,F:38,G:39,H:40,I:41,J:42,K:43,L:44,M:45,N:46,O:47,P:48,Q:49,R:50,S:51,T:52,U:53,V:54,W:55,X:56,Y:57,Z:58};
		var checkCharacterLookup = "ABCDEFGHXJKLMNYPQRSTZVW".split('');

		for(var i = 0; i < weights.length; i++)
		{
			var number = characters[i];
			
			if(/[A-Z]/.test(number))
			{
				number = characterLookup[number];
			}
			
			checksum += number * weights[i];
		}

		checksum %= 23;

		var expectedCheckCharacter = checkCharacterLookup[checksum];

		return checkCharacter == expectedCheckCharacter;
	}

	return validateFields(form, 'mgdrn', validate);
}

/**
 * Check fields contain a value.
 */
function validateRequired(form)
{
	function validate(value)
	{
		return Framework.Utility.trim(String(value)) !== "";
	}

	return validateFields(form, 'required', validate);
}

/**
 * Check fields are a valid short.
 *
 * @param form The form.
 */
function validateShort(form)
{
	function validate(value)
	{
		var number = Number(value);
		return value === '' || isDecimalDigits(value) && number >= -32768 && number <= 32767;
	}

	return validateFields(form, 'ShortValidations', validate);
}

/**
 * Check field is a valid UTR.
 */
function validateUtr(form)
{
	function validate(value)
	{
		if(value === '')
		{
			return true;
		}

		if(!/^\d{10}$/.test(value))
		{
			return false;
		}
		
		var checkDigit = value.substring(0, 1);
		var checkSum = calculateUtrChecksum(value.substring(1, 10));
		return checkDigit == checkSum;
	}

	return validateFields(form, 'utr', validate);
}

/**
 * Check fields against their parameterised tests.
 * @param form The form.
 */
function validateValidWhen(form)
{
	function escapeQuotes(value)
	{
		return value.replace(/\"/g, '\\"');
	}

	function fieldResolver(value)
	{
		var field = form[value];

		if(field && (field.name == value || field[0] && field[0].name == value))
		{
			value = Framework.Utility.getFieldValue(field).toString();
			value = Framework.Utility.preferNumber(value);

			if(typeof value === 'string')
			{
				value = '"' + escape(value) + '"';
			}
		}

		return value;
	}

	function validate(value, rule)
	{
		var test = rule[2]('test');
		test = convertMapSyntaxFromCommonsToSpring(test);
		test = test.replace(/\*this\*/g, '"' + escape(value) + '"');
		test = test.replace(/==/g, '===');
		test = test.replace(/!=/g, '!==');
		test = test.replace(/\bnull\b/g, '""');
		test = test.replace(/\)\s*or\s*\(/, ')||(');
		test = test.replace(/\)\s*and\s*\(/, ')&&(');
		test = test.replace(/(\b[a-zA-Z_][\w\['\]]*)/g, fieldResolver);
		return eval(test);
	}

	return validateFields(form, 'validwhen', validate);
}

/**
 * Check fields against their parameterised tests.
 * @param form The form.
 */
var validWhenMapSupport = validateValidWhen;

/**
 * Check field is a valid VRN.
 */
function validateVrn(form)
{
	function isVrnChecksum(total, check)
	{
		var mod = total % 97;
		checksum = 97 - (mod || 97);
		return check === checksum;
	}

	function validate(value)
	{
		if(value === '')
		{
			return true;
		}

		if(!/^\d{9}$/.test(value))
		{
			return false;
		}
		
		var check = Number(value.substring(7));
		var digits = value.split('');
		var total = 0;
		var weights = [8,7,6,5,4,3,2];

		for(var i = 0; i < weights.length; i++)
		{
			total += digits[i] * weights[i];
		}

		return isVrnChecksum(total, check) || isVrnChecksum(total + 55, check);
	}

	return validateFields(form, 'vrn', validate);
}

/**
 * Legacy functions still being referenced. 
 */
var jcv_retrieveFormName = retrieveFormName;
var jcv_verifyArrayElement = function(index, element){if(!element){element = index;} return verifyRule(element);};
var jcv_isFieldPresent = isFieldPresent;
var jcv_isValidDate = isValidDate;
