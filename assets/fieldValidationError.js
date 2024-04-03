/**
 * A set of functions to support the dynamic display of a client side validation error messages.
 */

var hmrc = {
	portal : {
		/**
		 * Creates a new instance of a validation error for an identified field.
		 *
		 * @param fieldId The HTML element id of the field in error.
		 * @param errorMsg The error message.
		 */
		FieldValidationError : function(fieldId, errorMsg, rawErrorMsg)
		{
			if(fieldId)
			{
				this.field = document.getElementById(fieldId);
				this.errorMsgSpan = hmrc.portal.getErrorMsgSpanForField(fieldId);
				this.errorMsg =  errorMsg || 'Field '+ fieldId + ' is invalid.';
				this.rawErrorMsg = rawErrorMsg;
			}

			/** Displays this field validation error. */
			this.display = function()
			{
				Framework.Utility.setHtml(this.errorMsgSpan, this.errorMsg);
				if(this.errorMsgSpan)
				{
				    var parent = this.errorMsgSpan.parentElement
				    if (parent && Framework.Utility.hasClassName(parent, 'govuk-form-group'))
				    {
				        Framework.Utility.addClassName(parent, 'govuk-form-group--error')
				    }
					this.field.hasError = true;
				}
			};

			/**  Clears this field validation error. */
			this.clear = function()
			{
				Framework.Utility.setHtml(this.errorMsgSpan, '');
				if(this.errorMsgSpan)
				{
                    var parent = this.errorMsgSpan.parentElement
                    if (parent && Framework.Utility.hasClassName(parent, 'govuk-form-group'))
                    {
                      Framework.Utility.removeClassName(parent, 'govuk-form-group--error')
                    }
					this.field.hasError = false;
				}
			};
		}

		,

		/**
		 * Clears all error messages from the specified form.
		 *
		 * @param form The HTML form.
		 */
		clearFieldValidationErrors : function(form)
		{
			var errorSummaryElement = document.getElementsByClassName("govuk-error-summary");
			if(errorSummaryElement.length > 0)
			{
				errorSummaryElement[0].classList.add("govuk-!-display-none");
				var errorSummaryListElement = document.getElementsByClassName("govuk-error-summary__list");
				if(errorSummaryListElement.length > 0)
				{
					errorSummaryListElement[0].innerHTML = "";
				}
			}

			function clearDiv(id)
			{
				Framework.Utility.setHtml(id, '');
			}

			clearDiv('pageError.' + form.name);
			clearDiv('pageWarning.' + form.name);
			clearDiv('pageInformation.' + form.name);

			for(var i=0; i < form.elements.length; i++)
			{
				new hmrc.portal.FieldValidationError(form.elements[i].id).clear();
			}
		}

		,

		/**
		 * Handles the display of error messages for the form.
		 *
		 * Displays the error message for each field and sets focus to an identified field.
		 *
		 * @param fieldValidationErrors An array of FieldValidationError objects.
		 * @param focusField The Field which should receive the focus.
		 */
		handleFieldValidationErrors : function(fieldValidationErrors, focusField)
		{
			for(var i in fieldValidationErrors)
			{
				fieldValidationErrors[i].display();
			}

			if(focusField && focusField.type != 'hidden')
			{
				focusField.focus();
			}
		}

		,

		handleErrorSummary : function(fieldValidationErrors) {
			var errorSummaryListElement = document.getElementsByClassName("govuk-error-summary__list");
			if(errorSummaryListElement.length > 0)
			{
				for(var i in fieldValidationErrors)
				{
					errorSummaryListElement[0].innerHTML += "<li><a href=\"#" + fieldValidationErrors[i].field.id + "\">" + fieldValidationErrors[i].rawErrorMsg + "</a></li>";
				}
				var errorSummaryElement = document.getElementsByClassName("govuk-error-summary");
				if(errorSummaryElement.length > 0)
				{
					errorSummaryElement[0].classList.remove("govuk-!-display-none");
				}
			}
		}

		,

		/**
		 * Returns a reference to the HTML element that contains the error message for a field.
		 *
		 * @param fieldId The HTML element id of the field.
		 * @returns A reference to the element if it exists, otherwise undefined/null.
		 */
		getErrorMsgSpanForField : function(fieldId)
		{
			var field = document.getElementById(fieldId);
			if(field)
			{
				// Cleanse the field name if it would not be valid as a HTML ID.
				var CONVERT_TO_ID = /\[\'/g;
				var STRIP_FROM_ID = /(^[^A-Z]+|[^A-Z0-9\-_:.]+)/gi;
				var cleansedId = field.name.replace(CONVERT_TO_ID, '.').replace(STRIP_FROM_ID, '');

				var errorMsgSpan = document.getElementById('fieldError.' + cleansedId);

				if(!errorMsgSpan) // try the uncleansed field name.
				{
					errorMsgSpan = document.getElementById('fieldError.' + field.name);
				}

				return errorMsgSpan;
			}
		}
	}
};