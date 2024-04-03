var Framework = new function () {
    // Localisation of JavaScript content: English...
    var messages =
    {
        opensInNewWindow: 'opens in a new window',
        youHaveNotSavedYourChanges: 'You have not saved your changes.',
        thisPageContainsErrors: '<p>ERROR: This page contains one or more errors. See details below.</p>'
    };

    // Welsh...
    if (/(^| )lang=cym(;|$)/.test(document.cookie)) {
        messages =
        {
            opensInNewWindow: 'yn agor ffenestr newydd',
            youHaveNotSavedYourChanges: ' ',
            thisPageContainsErrors: "<p>GWALL: Mae'r dudalen hon yn cynnwys un neu ragor o wallau. Gweler y manylion isod.</p>"
        };
    }

    this.messages = messages;

    // Utility functions.
    this.Utility = new function () {
        this.isLive = function () {
            return location.host === 'online.hmrc.gov.uk' || location.host === 'www.tax.service.gov.uk';
        };

        // Return a date offset from today, in days.
        this.daysFromNow = function (days) {
            var now = new Date();
            var millis = days * 24 * 60 * 60 * 1000;
            return new Date(now.getTime() + millis);
        };

        // Removes leading and trailing white space from a string.
        this.trim = function (string) {
            return string ? string.replace(/(^\s+|\s+$)/g, '') : string;
        };

        // Create an array of elements which have a specified node type.
        this.getElementsByNodeType = function (type, document) {
            if (!document) {
                document = window.document;
            }

            var array = [];

            function recurse(nodes) {
                var length = nodes.length;

                for (var i = 0; i < length; i++) {
                    if (nodes[i].nodeType === type) {
                        array.push(nodes[i]);
                    }

                    if (nodes[i].childNodes.length > 0) {
                        recurse(nodes[i].childNodes);
                    }
                }
            }

            recurse(document.childNodes);
            return array;
        };

        // Create a regular expression to match a className in a class attribute.
        function getClassNameRegExp(className) {
            return new RegExp('(^|\\s)' + className + '(\\s|$)');
        }

        // Test a HTML element to see if it is a specified class.
        this.hasClassName = function (htmlElement, className) {
            return getClassNameRegExp(className).test(htmlElement.className);
        };

        // Test a HTML element to see if it is a specified target
        this.hasTarget = function(htmlElement, targetName) {
            return htmlElement.target === targetName;
        }

        // Find an element's parent with a specified tag name.
        this.getAncestorByTagName = function (htmlElement, tagName) {
            var returnElement = htmlElement.parentNode;

            while (returnElement.parentNode && returnElement.tagName.toLowerCase() !== tagName.toLowerCase()) {
                returnElement = returnElement.parentNode;
            }

            return returnElement.tagName.toLowerCase() === tagName.toLowerCase() ? returnElement : undefined;
        };

        // Return an array of elements that are direct children of the specified tag.
        this.getChildrenByTagName = function (htmlElement, tagName) {
            // Array to return.
            var children = [];

            // All descendents.
            var descendents = htmlElement.getElementsByTagName(tagName.toLowerCase());
            var descendentsLength = descendents.length;

            for (var i = 0; i < descendentsLength; i++) {
                if (descendents[i].parentNode === htmlElement) {
                    children.push(descendents[i]);
                }
            }

            return children;
        };

        // Returns an array of comments that have a specific [Label].
        this.getCommentsByLabel = function (label, document) {
            var comments = [];
            var allComments = Framework.Utility.getElementsByNodeType(8, document);
            var allCommentsLength = allComments.length;

            var condition = new RegExp('^ ?\\[' + label + '\\] ?', 'i');

            for (var i = 0; i < allCommentsLength; i++) {
                var comment = allComments[i];

                if (condition.test(comment.nodeValue)) {
                    comments.push(comment);
                }
            }

            return comments;
        };

        // returns a comment's content without its label.
        this.stripCommentLabel = function (comment) {
            return comment.nodeValue.replace(/(^ ?\[[^\]]+\] ?)/, '');
        };

        // Add a class to an element.
        this.addClassName = function (htmlElement, className) {
            Framework.Utility.removeClassName(htmlElement, className);
            // Remove if already present.
            var newClassName = htmlElement.className;

            // Append.
            newClassName += ' ' + className;

            // Tidy (trailing, leading + duplicate white space).
            newClassName = Framework.Utility.trim(newClassName).replace(/\s\s+/g, ' ');

            htmlElement.setAttribute('class', newClassName);
        };

        // Remove a class from an element.
        this.removeClassName = function (htmlElement, className) {
            // Remove if already present.
            htmlElement.className = htmlElement.className.replace(getClassNameRegExp(className), ' ');
        };

        // Get the value of a form field
        this.getFieldValue = function (field) {
            var type = field.type || (field.length ? field[0].type : field.type);

            switch (type) {
                case 'select-one':
                    return field[field.selectedIndex].value;

                case 'radio':
                    for (var i = 0; i < field.length; i++) {
                        if (field[i].checked) {
                            return field[i].value;
                        }
                    }

                    return undefined;

                case 'checkbox':
                    if (!field.length) {
                        return field.checked ? field.value : '';
                    }

                    var values = [];

                    for (var i = 0; i < field.length; i++) {
                        if (field[i].checked) {
                            values.push(field[i].value);
                        }
                    }

                    return values;

                default:
                    return field.value;
            }
        };

        // returns true if the named item is a form field.
        this.isFormField = function (form, name) {
            var field = form[name];
            return field && (field.name === name || field[0] && field[0].name === name);
        };

        // Convert a string into a number if it is a number.
        this.preferNumber = function (string) {
            if (string !== '') {
                var number = Number(string);
                return isNaN(number) ? string : number;
            }

            return string;
        };

        // Make a HTTP request
        this.request = function (httpMethod, url, callback) {
            var XHR = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject('Microsoft.XMLHTTP');
            var asynchronous = !!callback;

            if (asynchronous) {
                XHR.onreadystatechange = function () {
                    if (XHR.status === 200 && XHR.readyState === 4) {
                        callback(XHR);
                    }
                };
            }

            XHR.open(httpMethod, url, asynchronous);
            XHR.send();
            return XHR;
        };

        // Parse a JSON string
        this.parseJSON = function (jsonString) {
            var object;

            if (typeof JSON !== 'undefined') {
                object = JSON.parse(jsonString);
            }
            else {
                object = eval('(' + jsonString + ')');
            }

            return object;
        };

        var includeScriptCallbacks = [];

        // Include an external script
        this.includeScript = function (src, callback) {
            if (document.readyState !== 'complete') {
                document.write('<script src="' + src + '"></script>');
                if (typeof callback !== 'undefined') {
                    includeScriptCallbacks.push(callback);
                    document.write('<script>Framework.Utility.includeScriptCallback();</script>');
                }
            }
            else {
                var element = document.createElement('script');
                element.src = src;

                if (element.readyState) {
                    element.onreadystatechange = function () {
                        if (element.readyState !== 'loading') {
                            element.onreadystatechange = null;
                            if (typeof callback !== 'undefined') {
                                callback();
                            }
                        }
                    };
                }
                else {
                    element.onload = callback;
                }

                document.body.appendChild(element);
            }
        };

        this.includeScriptCallback = function () {
            var callback = includeScriptCallbacks.shift();
            callback();
        };

        function getElement(element) {
            if (typeof element === 'string') {
                element = document.getElementById(element);
            }

            return element;
        }

        this.getElement = getElement;

        this.show = function (element) {
            if (element = getElement(element)) {
                Framework.Utility.setStyle(element, 'display', '');
                element.setAttribute('aria-hidden', false);
            }
        };

        this.hide = function (element) {
            if (element = getElement(element)) {
                Framework.Utility.setStyle(element, 'display', 'none');
                element.setAttribute('aria-hidden', true);
            }
        };

        this.setStyle = function (element, style, value) {
            if (element = getElement(element)) {
                element.style[style] = value;
            }
        };

        this.setAttribute = function (element, attribute, value) {
            if (element = getElement(element)) {
                element.setAttribute(attribute, value);
            }
        };

        this.setHtml = function (element, html) {
            if (element = getElement(element)) {
                Framework.Utility.setAttribute(element, 'aria-live', 'polite');
                element.innerHTML = html;
            }
        };

        this.pushAttribute = function (element, attribute, value) {
            if (element = getElement(element)) {
                if (typeof element.oldValues === 'undefined') {
                    element.oldValues = [];
                }

                if (typeof element.oldValues[attribute] === 'undefined') {
                    element.oldValues[attribute] = [];
                }

                element.oldValues[attribute].push(element.getAttribute(attribute));
                Framework.Utility.setAttribute(element, attribute, value);
            }
        };

        this.popAttribute = function (element, attribute) {
            if (element = getElement(element)) {
                if (typeof element.oldValues !== 'undefined' && typeof element.oldValues[attribute] !== 'undefined' && element.oldValues[attribute].length > 0) {
                    Framework.Utility.setAttribute(element, attribute, element.oldValues[attribute].pop());
                }
            }
        };

        /*
         Cookie functions.
         */

        function getCookies() {
            // Put cookies into a convenient object
            var cookieList = {};

            var cookies = document.cookie.split('; ');
            for (var i = 0; i < cookies.length; i++) {
                var parts = cookies[i].split('=');
                var name = parts.shift();
                var value = parts.join('=');
                cookieList[name] = value;
            }

            return cookieList;
        }

        var cookieCache = document.cookie;
        this.cookies = getCookies();

        this.getCookie = function (name) {
            if (document.cookie != cookieCache) {
                Framework.Utility.cookies = getCookies();
            }

            return Framework.Utility.cookies[name];
        };

        this.setCookie = function (name, value, path, expiryDate, domain) {
            var expires = expiryDate ? '; expires=' + expiryDate.toUTCString() : '';

            if (!path) {
                path = '/';
            }

            if (!domain) {
                document.cookie = name + '=' + value + expires + '; path=' + path;
            }
            else {
                document.cookie = name + '=' + value + expires + '; path=' + path + '; domain=' + domain;
            }

            Framework.Utility.cookies[name] = value;
        };

        this.deleteCookie = function (name, path) {
            if (!path) {
                path = '/';
            }

            document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=' + path;
            delete Framework.Utility.cookies[name];
        };

        /*
         Event handling functions.
         */
        // Keep track of all elements which have had events attached so we can remove the events to prevent memory leaks.
        var elementsToClean;

        /*
         Add an event handler to an element.

         Many event handlers can be added to an element, they will be called in the order they have been added.

         If a handler returns false, no further handlers will be called for the event.

         eventName is the name of the event to handle, e.g. onclick.

         eventHandler is a function to call to handle the event.
         */
        this.addEventHandler = function (htmlElement, eventName, eventHandler) {
            var eventCollection = eventName + 'Events';	// E.g. onclickEvents

            // If this is the first event handler for this element, do some initialisation.
            if (!htmlElement[eventCollection]) {
                htmlElement[eventCollection] = [];

                // If there is already an event handler present (e.g. directly in HTML source), move it into our collection.
                if (htmlElement[eventName]) {
                    // Mozilla-based browsers expose existing inline event handlers differently than IE, so normalise that here.
                    var handlerCode = htmlElement[eventName].toString();
                    handlerCode = handlerCode.replace(/^[^\{]+\{/, '');
                    handlerCode = handlerCode.replace(/\}$/, '');

                    /*
                     Because we're recreating the normalised event-handling function here,
                     we cannot use the 'this' keyword to refer to the element that fires the event.
                     */
                    handlerCode = handlerCode.replace(/\bthis\b/g, '_this');
                    var handlerFunction = new Function('_this', handlerCode);
                    htmlElement[eventCollection].push(handlerFunction);
                }

                // Make this element invoke our internal fireEvents function for this event.
                htmlElement[eventName] = function () {
                    return fireEvents(this, eventName);
                };

                // If this is the first handler that the framework has added, set up the clean-up code.
                if (!elementsToClean) {
                    elementsToClean = [];
                    Framework.Utility.addEventHandler(window, 'onunload', clearEvents);
                }
                // Remember to clean this event on this element.
                elementsToClean.push({htmlElement: htmlElement, eventName: eventName});
            }

            // Add this event to our event handler.
            htmlElement[eventCollection].push(eventHandler);
        };

        // Fires events added to an element - private, referenced by addEventHandler.
        function fireEvents(htmlElement, eventName) {
            var eventCollection = eventName + 'Events';

            for (var i = 0; i < htmlElement[eventCollection].length; i++) {
                var thisEvent = htmlElement[eventCollection][i];

                // Call the handler & evaluate return value
                if (thisEvent(htmlElement) === false) {
                    // Handler returned false, stop & return.
                    return false;
                }
            }

            // All handlers successfully called.
            return true;
        }

        // Removes all event handlers added by the framework - private, referenced by addEventHandler.
        function clearEvents() {
            while (elementsToClean.length > 0) {
                var elementToClean = elementsToClean.pop();
                var htmlElement = elementToClean.htmlElement;
                var eventName = elementToClean.eventName;
                var eventCollection = eventName + 'Events';

                // Remove all event handlers for this element.
                while (htmlElement[eventCollection].length > 0) {
                    htmlElement[eventCollection].pop();
                }

                htmlElement[eventName] = null;
            }
        }

        var domReadyFunctions = [];

        /*
         Call the specified function once the DOM is ready.
         Callback function will be called without parameters.  Use a closure if parameters are required.
         Functions will be called in the same order they are given to this function.
         */
        this.onDomReady = function (callback) {
            domReadyFunctions.push(callback);
        };

        this.domIsReady = function () {
            while (domReadyFunctions.length) {
                var domReadyFunction = domReadyFunctions.shift();
                domReadyFunction();
            }
        };
    };

    // Invoke the browser back button when the application back button is pressed.
    this.BrowserBackButtonInvoker = new function () {
        // Attaches an onclick event handler to ALL non-submit buttons with a 'back' class.
        // Should be used for back buttons only.
        this.inject = function () {
            var inputs = document.getElementsByTagName('input');
            var inputsLength = inputs.length;

            for (var i = 0; i < inputsLength; i++) {
                if (inputs[i].type === 'button' && Framework.Utility.hasClassName(inputs[i], 'back')) {
                    Framework.Utility.addEventHandler(inputs[i], 'onclick', invokeBrowserBack);
                }
            }
        };

        // Go back.
        function invokeBrowserBack() {
            window.history.back();
        }
    };

    // Allow buttons to bypass client-side form validation.
    this.BypassValidation = new function () {
        // Attaches itself to all submit buttons with a 'no-validation' class.
        this.inject = function () {
            var inputs = document.getElementsByTagName('input');
            var inputsLength = inputs.length;

            for (var i = 0; i < inputsLength; i++) {
                if (inputs[i].type === 'submit' && Framework.Utility.hasClassName(inputs[i], 'no-validation')) {
                    Framework.Utility.addEventHandler(inputs[i], 'onclick', bypassValidation);
                }
            }
        };

        // Kill the form's onsubmit event handler.
        function bypassValidation(button) {
            var form = button.form;
            form.onsubmit = null;
        }
    };

    // Displays content depending on the values of form fields.
    this.DisplayConditions = new function () {
        // All the discovered conditions.
        var conditions = [];

        // Evaluates the conditions and refreshes the display.
        function evaluate(eventElement) {
            for (var i = 0; i < conditions.length; i++) {
                var condition = conditions[i];
                var expression = condition.expression;

                for (var j = 0; j < condition.fields.length; j++) {
                    var field = condition.fields[j];
                    var name = field.name || field[0].name;
                    var value = Framework.Utility.getFieldValue(field);
                    expression = expression.replace(name, value);
                }

                expression = expression.replace(/[\s'"]/g, '');

                var display = evaluateExpression(expression);

                display ? Framework.Utility.show(condition.element) : Framework.Utility.hide(condition.element);

                if (!display && eventElement && eventElement.tagName === 'FORM') // Only clear hidden fields when submitting.
                {
                    clearFieldValues(condition.element);
                }
            }
        }

        function clearFieldValues(element) {
            var fields = element.getElementsByTagName('input');
            for (var i = 0; i < fields.length; i++) {
                switch (fields[i].type) {
                    case 'radio':
                        fields[i].form[fields[i].name][0].checked = true;
                        break;

                    case 'checkbox':
                        fields[i].checked = false;
                        break;

                    case 'text':
                    case 'password':
                    case 'file':
                        fields[i].value = '';
                }
            }

            fields = element.getElementsByTagName('select');
            for (var i = 0; i < fields.length; i++) {
                fields[i].selectedIndex = 0;
            }

            fields = element.getElementsByTagName('textarea');
            for (var i = 0; i < fields.length; i++) {
                fields[i].value = '';
            }
        }

        function evaluateExpression(expression) {
            // evaluate everything inside brackets.
            expression = expression.replace(/\((.*)\)/g, function ($0, $1) {
                return evaluateExpression($1);
            });

            // evaluate &&
            expression = expression.replace(/(.+?)&&(.+)/g, function ($0, $1, $2) {
                return evaluateExpression($1) && evaluateExpression($2);
            });

            // evaluate ||
            expression = expression.replace(/(.+?)\|\|(.+)/g, function ($0, $1, $2) {
                return evaluateExpression($1) || evaluateExpression($2);
            });

            var display = true;
            var negate = false;

            var tokens = expression.match(/^(.*?)(===|==|!=|>=|<=|>|<)(.*?)$/);

            if (tokens && tokens.length === 4) {
                var left = Framework.Utility.preferNumber(tokens[1]);
                var comparison = tokens[2];
                var right = Framework.Utility.preferNumber(tokens[3]);

                switch (comparison) {
                    case '!=':
                        negate = true;
                    // fall-through;

                    case '==':
                        if (/,/.test(left)) {
                            display = new RegExp('(^|,)' + right + '(,|$)').test(left);
                        }
                        else if (/,/.test(right)) {
                            display = new RegExp('(^|,)' + left + '(,|$)').test(right);
                        }
                        else {
                            display = String(left) == String(right);
                        }
                        break;

                    case '===':
                        display = String(left) == String(right);
                        break;

                    case '>=':
                        display = left >= right;
                        break;

                    case '<=':
                        display = left <= right;
                        break;

                    case '>':
                        display = left > right;
                        break;

                    case '<':
                        display = left < right;
                        break;

                    default:
                        display = true;
                }
            }
            else {
                display = expression === "true";
            }

            if (negate) {
                display = !display;
            }

            return display;
        }

        // Collects the data about a DisplayCondition and adds it to the evaluation array.
        function injectDisplayCondition(node) {
            function addEventHandler(field) {
                Framework.Utility.addEventHandler(field, 'onchange', evaluate);
                Framework.Utility.addEventHandler(field, 'onclick', evaluate);
                Framework.Utility.addEventHandler(field, 'onkeyup', evaluate);
            }

            // This is the element that will be displayed or removed from display.
            var parentNode = node.parentNode;

            // This is the expression that will be evaluated when its associated fields change.
            var expression = Framework.Utility.stripCommentLabel(node);

            var form = Framework.Utility.getAncestorByTagName(node, 'form');

            if (form) {
                if (!form.displayConditionEventHandler) {
                    Framework.Utility.addEventHandler(form, 'onsubmit', evaluate);
                    form.displayConditionEventHandler = true;
                }

                // Get a list of potential associated fields' names.
                var potentialFields = expression.match(/[-\w'\[\]\.:]+/g);

                var fields = [];

                for (var i = 0; i < potentialFields.length; i++) {
                    var name = potentialFields[i];

                    // Is this a form field?
                    if (Framework.Utility.isFormField(form, name)) {
                        var field = form[name];

                        fields.push(field);

                        if (!field.displayConditionTrigger) {
                            field.displayConditionTrigger = true;

                            if (field.length && !/^select/.test(field.type)) {
                                for (var j = 0; j < field.length; j++) {
                                    addEventHandler(field[j]);
                                }
                            }
                            else {
                                addEventHandler(field);
                            }
                        }
                    }
                }

                conditions.push({fields: fields, element: parentNode, expression: expression});
            }
        }

        // Find and process DisplayCondition comments.
        this.inject = function () {
            // Iterate an array of the comments
            var comments = Framework.Utility.getCommentsByLabel('DisplayCondition');

            for (var i = comments.length - 1; i >= 0; i--) {
                injectDisplayCondition(comments[i]);
            }

            if (conditions.length > 0) {
                evaluate();
            }
        };
    };

    // Prevent duplicate submission of forms.
    this.DuplicateSubmitBlocker = new function () {
        var timeout = 15000; // 15 Seconds

        // Attaches an onsubmit event handler to ALL forms, blocking all but the first form submission.
        this.inject = function () {
            var forms = document.getElementsByTagName('form');
            var formsLength = forms.length;

            for (var i = 0; i < formsLength; i++) {
                Framework.Utility.addEventHandler(forms[i], 'onsubmit', blockSubmission);
            }
        };

        // Prevent the submission of a form which has already been submitted.
        function blockSubmission(form) {
            var now = new Date();

            if (form.submitted) // Has the form been submitted?
            {
                if (now - form.submittedAt > timeout) {
                    form.submitted = true;
                    form.submittedAt = now;
                    Framework.Utility.popAttribute(form, 'target');
                    return true;
                }

                return false;
            }

            if (form.isPopup) // Don't include popup buttons as form submissions.
            {
                form.isPopup = false;
            }
            else {
                Framework.Utility.pushAttribute(form, 'target', '');
                form.submitted = true;
                form.submittedAt = now;
            }

            return true;
        }
    };

    // Attach submit functions for form validation.
    this.FormValidation = new function () {

        // Attaches itself to all forms with a matching validate function (based on the form's name).
        this.inject = function () {

            var forms = document.getElementsByTagName('form');
            var formsLength = forms.length;

            for (var i = 0; i < formsLength; i++) {

                var functionName = getValidateFunctionName(forms[i].name);
                var inputs = document.getElementsByTagName('input');

                for (x = 0; x < inputs.length; x++) {
                    if (inputs.item(x).type === 'text' || inputs.item(x).type === 'textarea') {
                        var theValue = inputs.item(x);
                        var noTabs = theValue.value.replace(/\t/g, ' ');
                        theValue.value = noTabs;
                    }
                }

                if (window[functionName]) {
                    Framework.Utility.addEventHandler(forms[i], 'onsubmit', submitValidation);
                }
            }
        };

        // onsubmit event handler.
        function submitValidation(form) {
            var functionName = getValidateFunctionName(form.name);
            return window[functionName](form);
        }

        function getValidateFunctionName(formName) {
            var functionName = formName.replace(/(.)(.*)/g, function (t, a, b) {
                return a.toUpperCase() + b;
            });
            return "validate" + functionName;
        }
    };

    // Displays content hidden when JavaScript is not available.
    this.JavaScriptContent = new function () {
        // Show the functions.
        this.show = function () {
            // Iterate an array of the comments
            var comments = Framework.Utility.getCommentsByLabel('JavaScript');

            for (var i = comments.length - 1; i >= 0; i--) {
                var node = comments[i];

                var oldHTML = '<!--' + node.nodeValue + '-->'; // Comment to find.
                var newHTML = Framework.Utility.stripCommentLabel(node); // The uncommented HTML.

                var successful = false; // String has been successfully uncommented
                var parentNode = node.parentNode;

                /*
                 If we cannot do the replacement on this element, it might work on its parent.
                 Internet Explorer isn't too happy with innerHTML modifications on list items or table cells, but is fine for complete lists or tables.
                 */
                while (!successful && parentNode) {
                    try {
                        parentNode.innerHTML = parentNode.innerHTML.replace(oldHTML, newHTML);
                        successful = true;
                    }
                    catch (e) {
                        parentNode = parentNode.parentNode; // Try the parent then.
                    }
                }
            }
        };
    };

    // Handle persistent forms.	These forms will try to submit whenever the user navigates away from the page.
    this.PersistentForms = new function () {
        // A reference to the form to submit.
        var persistentForm;

        // Decide whether to post the form.
        var displayOnunloadWarning = true;

        // Test to see if any of the form fields have been changed.
        function formIsDirty() {
            var persistentFormLength = persistentForm.length;

            for (var i = 0; i < persistentFormLength; i++) {
                var field = persistentForm[i];

                if (field.name) {
                    if (field.originalValue !== (field.selectedIndex || field.checked || field.value)) {
                        return true;
                    }
                }
            }

            return false;
        }

        /*
         Detects a persistence form and attaches onclick event handlers to all links to submit the form.

         Also attaches a window.onbeforeunload event to trap browser back, forward, refresh, close, etc...
         */
        this.inject = function () {
            // Detect persistence form.	I.e., the first form with a field called "redirectUrl"
            var forms = document.getElementsByTagName('form');
            var formsLength = forms.length;

            for (var i = 0; i < formsLength; i++) {
                if (forms[i].redirectUrl) {
                    persistentForm = forms[i];
                    break;
                }
            }

            // Set up persistent form.
            if (persistentForm) {
                // Set up onbeforeunload event.
                window.onbeforeunload = function () {
                    if (displayOnunloadWarning && formIsDirty()) {
                        return messages.youHaveNotSavedYourChanges;
                    }
                };

                // We don't want the onbeforeunload warning to occur when the form is submitted.
                Framework.Utility.addEventHandler(persistentForm, "onsubmit", silenceOnunloadWarning);

                // Capture the original values of the form fields, because we only want to do this if the form has changed.
                var persistentFormLength = persistentForm.length;

                for (var i = 0; i < persistentFormLength; i++) {
                    var field = persistentForm[i];

                    if (field.name) // We're only interested in fields that will get submitted (no name = not submitted)
                    {
                        // Put value of field in 'originalValue' DOM property.
                        field.originalValue = field.selectedIndex || field.checked || field.value;
                    }
                }

                // Add event handlers to links that take the user away from this page.
                var links = document.getElementsByTagName('a'); // All links
                var thisPage = location.href.split('#')[0].split('?')[0];

                var linksLength = links.length;

                for (var j = 0; j < linksLength; j++) {
                    // Links with no href attribute and links that open new windows are OK.
                    if (links[j].href && !Framework.Utility.hasClassName(links[j], 'popup-window') && !Framework.Utility.hasClassName(links[j], 'new-window') && !Framework.Utility.hasTarget(links[j], '_blank' )) {
                        // This link might not be to another page, ignore the hash/URI fragment identifier to find out.
                        var targetPage = links[j].href.split('#')[0];

                        if (thisPage !== targetPage) // This link is to another page.
                        {
                            Framework.Utility.addEventHandler(links[j], 'onclick', submitPersitentForm);
                        }
                    }
                }
            }
        };

        // No onbeforeunload warning will be shown.
        function silenceOnunloadWarning() {
            displayOnunloadWarning = false;
            return true;
        }

        // Submit the form if it has been changed.
        function submitPersitentForm(link) {
            if(link.href.indexOf("javascript:window.print") == 0) {
                return true;
            }
            if (formIsDirty()) // The form has been changed
            {
                persistentForm.redirectUrl.value = link.href;
                silenceOnunloadWarning();
                persistentForm.submit();
                return false; // Do not follow the link
            }

            // The form has not been changed, just follow the link instead.
            return true;
        }
    };

    // Handle popup windows.
    this.PopupWindows = new function () {
        var popupWindowParameters = 'toolbar=no,menubar=no,scrollbars=yes,resizable=yes,width=500,height=400';
        var targetRegEx = /[^a-z0-9_]/gi; // Regular expression to strip invalid characters from target names

        // Add a title attribute to say it opens in a new window
        function addTitleAttribute(link) {
            link.title = messages.opensInNewWindow;

            // Add title to image elements inside the link too
            var images = link.getElementsByTagName('img');
            var imagesLength = images.length;

            for (var i = 0; i < imagesLength; i++) {
                images[i].title = images[i].alt + ' - ' + messages.opensInNewWindow;
                images[i].alt = images[i].title;
            }
        }

        /*
         Attaches an onclick event handler to ALL links with the class "popup-window" or "new-window".

         Attaches an onclick event handler to ALL buttons with the class "popup-window" or "new-window",
         or whose form has a class "popup-window" or "new-window".
         */
        this.inject = function () {
            var links = document.getElementsByTagName('a'); // Potential link elements
            var linksLength = links.length;

            for (var i = 0; i < linksLength; i++) {
                if (Framework.Utility.hasClassName(links[i], 'popup-window')) {
                    Framework.Utility.addEventHandler(links[i], 'onclick', popupWindow);
                    addTitleAttribute(links[i]);
                }
                else if (Framework.Utility.hasClassName(links[i], 'new-window')) {
                    links[i].rel = "noreferrer noopener";
                    links[i].target = '_blank';
                    addTitleAttribute(links[i]);
                }
            }

            var forms = document.getElementsByTagName('form');
            var formsLength = forms.length;

            for (var i = 0; i < formsLength; i++) {
                var setClassName = false;

                if (Framework.Utility.hasClassName(forms[i], 'popup-window')) {
                    setClassName = 'popup-window';
                }
                else if (Framework.Utility.hasClassName(forms[i], 'new-window')) {
                    setClassName = 'new-window';
                }

                if (setClassName) {
                    var childButtons = forms[i].getElementsByTagName('input');
                    var childButtonsLength = childButtons.length;
                    for (var j = 0; j < childButtonsLength; j++) {
                        if (childButtons[j].type === 'submit') {
                            Framework.Utility.addClassName(childButtons[j], setClassName);
                        }
                    }
                }
            }

            var buttons = document.getElementsByTagName('input');
            var buttonsLength = buttons.length;

            for (var i = 0; i < buttonsLength; i++) {
                if (buttons[i].type == 'submit') {
                    if (Framework.Utility.hasClassName(buttons[i], 'popup-window')) {
                        Framework.Utility.addEventHandler(buttons[i], 'onclick', buttonPopupWindow);
                        buttons[i].title = messages.opensInNewWindow;
                    }
                    else if (Framework.Utility.hasClassName(buttons[i], 'new-window')) {
                        Framework.Utility.addEventHandler(buttons[i], 'onclick', buttonNewWindow);
                        buttons[i].title = messages.opensInNewWindow;
                    }
                }
            }
        };

        // Open a link in a popup window.
        function popupWindow(link) {
            window.open(link.href, link.className.replace(targetRegEx, ''), popupWindowParameters);
            return false;
        }

        // Open a form submission from some of its buttons in a new window.
        function buttonNewWindow(button) {
            var form = button.form;

            if (form) {
                form.rel = "noreferrer noopener";
                form.target = '_blank';
                form.isPopup = true; // Bypass duplicate submit blocker.
            }
        }

        // Open a form submission from some of its buttons in a new window.
        function buttonPopupWindow(button) {
            var form = button.form;

            if (form) {
                var target = 'popup' + form.name.replace(targetRegEx, '');
                window.open('', target, popupWindowParameters);
                form.target = target;
                form.isPopup = true; // Bypass duplicate submit blocker.
            }
        }
    };

    // Device profiling
    this.DeviceProfiling = new function () {
        var cookieName = 'dp_device';
        var fieldName = 'dp_attrs_field';
        var new_uuid;

        //return true if any version of device profiling is required
        function profileRequired() {
            // Only on RSA pages
            var path = window.location.pathname;

            // Not for offline/local pages
            var protocol = window.location.protocol;
            if (!/^\/(error|unavailable)\//.test(path) && protocol != 'file:') {
                // Only when logged in.
                if (!Framework.Utility.hasClassName(document.body, 'popup')) {
                    var links = document.getElementsByTagName('a'); // Potential links
                    var linksLength = links.length;

                    for (var i = 0; i < linksLength; i++) {
                        var href = links[i].getAttribute('href');
                        if (href && /^(\/linkback)?\/logout/.test(href)) {
                            return true;
                        }
                    }
                }
            }
        }

        function profile() {
            if (typeof dp_addAttributesToPage !== 'undefined') {
                var iframe = document.createElement('iframe');
                iframe.name = 'profile';
                Framework.Utility.setStyle(iframe, 'display', 'none');

                document.body.appendChild(iframe);

                var form = document.createElement('form');
                form.action = '/users/lastlogin';
                form.method = 'POST';
                form.target = 'profile';

                var field = document.createElement('input');
                field.type = 'hidden';
                field.name = fieldName;
                field.id = fieldName;

                form.appendChild(field);
                document.body.appendChild(form);

                dp_addAttributesToPage();

                window.setTimeout(function () {
                    saveCookie();
                    form.submit();
                }, 4000);
            }
            else {
                window.setTimeout(profile, 1000);
            }
        }

        function dpSettingsLoaded() {
            if (typeof dp_cookie !== 'undefined') {
                cookieName = dp_cookie;
            }

            if (typeof dp_attributesFieldName !== 'undefined') {
                fieldName = dp_attributesFieldName;
            }

            // Except if dp is already included in this page
            var forms = document.getElementsByTagName('form');
            var formsLength = forms.length;
            var includeDp = true;

            for (var i = 0; i < formsLength; i++) {
                if (forms[i][fieldName]) {
                    includeDp = false;
                    Framework.Utility.addEventHandler(forms[i], 'onsubmit', function () {
                        saveCookie();
                    });
                    break;
                }
            }

            if (includeDp) {
                Framework.Utility.includeScript('/js/device-profile/dp.js', profile);
            }
        }

        function saveCookie() {
            var cookieValue = Framework.Utility.getCookie(cookieName);

            if (cookieValue) {
                if (window.localStorage) {
                    localStorage.setItem(cookieName, cookieValue);
                }

                Framework.Utility.setCookie('dp_done', true);
            }
        }

        function restoreCookie() {
            if (typeof Framework.Utility.cookies[cookieName] === 'undefined') {
                if (window.localStorage) {
                    var cookieValue = localStorage.getItem(cookieName);

                    if (cookieValue) {
                        var expiryDate = Framework.Utility.daysFromNow(1000);
                        Framework.Utility.setCookie(cookieName, cookieValue, '/', expiryDate);
                    }
                }
            }
        }

        function validateDevice(device) {
            return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(device);
        }

        function noValidDeviceId() {
            /* MRJ removed this to fix live issue - added return null instead
             if(!/^\/login/.test(window.location.pathname))
             {
             window.location.href="/login?sfwtc=true";
             }*/
            return null;
        }

        // Tests whether we have access to local storage.
        function hasLocalStorage() {
            var test = 'test';

            try {
                localStorage.setItem(test, test);
                localStorage.getItem(test);
                localStorage.removeItem(test);
                return true;
            }
            catch (e) {
                return false;
            }
        }

        this.init = function () {
            var cookieName = 'X_DEVICE_ID';
            var domain = '.hmrc.gov.uk';

            // If we're in the .hmrc.gov.uk domain and device profiling is required or we're on the login page and we have access to local storage
            if (/\.hmrc\.gov\.uk$/.test(window.location.hostname) && (profileRequired() || /^\/login/.test(window.location.pathname)) && hasLocalStorage()) {
                if (typeof Framework.Utility.cookies[cookieName] === 'undefined') {
                    // No session cookie
                    if (localStorage.getItem(cookieName) && typeof localStorage.getItem(cookieName) !== 'undefined') {
                        if (validateDevice(localStorage.getItem(cookieName))) {
                            // Create cookie using local storage
                            var expireDate = new Date();
                            expireDate.setDate(expireDate.getDate() + 1200000000);
                            Framework.Utility.setCookie(cookieName, localStorage.getItem(cookieName), '', expireDate, domain);

                            // Check cookies are enabled
                            var cookiesEnabled = ("cookie" in document && (document.cookie.length > 0 || (document.cookie = "test").indexOf.call(document.cookie, "test") > -1));

                            if (cookiesEnabled) {
                                location.reload(); // User has removed browser cookie, not local
                            }
                        }
                        else {
                            // Local storage device id isn't valid
                            noValidDeviceId();
                        }
                    }
                    else {
                        // No device id in local or session
                        noValidDeviceId();
                    }
                }
                else {
                    // Is a session cookie
                    if (!localStorage.getItem(cookieName) || typeof localStorage.getItem(cookieName) === 'undefined') {
                        if (validateDevice(Framework.Utility.cookies[cookieName])) {
                            // No local storage cookie or local storage value is null
                            localStorage.setItem(cookieName, Framework.Utility.cookies[cookieName]);
                        }
                        else {
                            // Local storage device id isn't valid
                            noValidDeviceId();
                        }
                    }
                    else {
                        // Local storage cookie
                        if (localStorage.getItem(cookieName) != Framework.Utility.cookies[cookieName]) {
                            if (validateDevice(localStorage.getItem(cookieName))) {
                                // Session cookie doesn't match local storage
                                var expireDate = new Date();
                                expireDate.setDate(expireDate.getDate() + 1200000000);
                                Framework.Utility.setCookie(cookieName, localStorage.getItem(cookieName), '', expireDate, domain);

                                // Check cookies are enabled
                                var cookiesEnabled = ("cookie" in document && (document.cookie.length > 0 || (document.cookie = "test").indexOf.call(document.cookie, "test") > -1));

                                if (cookiesEnabled) {
                                    location.reload();//user has removed browser cookie, not local
                                }
                            }
                            else {
                                if (validateDevice(Framework.Utility.cookies[cookieName])) {
                                    // Local storage isn't valid, session storage is
                                    localStorage.setItem(cookieName, Framework.Utility.cookies[cookieName]);
                                }
                                else {
                                    // Neither Device IDs are valid
                                    noValidDeviceId();
                                }
                            }
                        }
                        else {
                            // Both local and session match
                            if (!validateDevice(localStorage.getItem(cookieName))) {
                                // Both device IDs are invalid
                                noValidDeviceId();
                            }
                        }
                    }
                }
            }

            // If Device Profiling hasn't been carried out and Device Profiling is required
            if (!Framework.Utility.cookies['dp_done'] && profileRequired()) {
                restoreCookie();
                Framework.Utility.includeScript('/users/dp-settings.js', dpSettingsLoaded);
            }
        };
    };

    // Links back to user's origin.
    this.LinkBackLinks = new function () {
        function populateLnsEndpointParameters() {
            var links = document.getElementsByTagName('a');
            var linksLength = links.length;
            var parameterValue = escape(location.href);

            for (var i = 0; i < linksLength; i++) {
                if (/\?lnsEndpointUri=$/.test(links[i].href)) {
                    links[i].href += parameterValue;
                }
            }
        }

        function removeLinks() {
            if (typeof Framework.Utility.cookies['du'] === 'undefined') {
                var links = document.getElementsByTagName('a');

                // Since links[] is a live collection, removing links whilst iterating from start to finish might skip instances, so iterate backwards.
                for (var i = links.length - 1; i >= 0; i--) {
                    if (/\/home\?lnsEndpointUri=/.test(links[i].href) && !Framework.Utility.hasClassName(links[i], 'next')) {
                        var linkContent = links[i].innerHTML;
                        var oldHtml = links[i].parentNode.innerHTML;
                        var newHtml = oldHtml.replace(linkContent, '');
                        newHtml = newHtml.replace(/[^.]*\/home\?lnsEndpointUri=[^>]*[^.]*\.?/, '');

                        if (newHtml === '') {
                            links[i].parentNode.parentNode.removeChild(links[i].parentNode);
                        }
                        else {
                            links[i].parentNode.innerHTML = newHtml;
                        }
                    }
                }

                if (buttonLogoutToDigital = Framework.Utility.getElement('buttonLogOutTodigital')) {
                    buttonLogoutToDigital.parentNode.removeChild(buttonLogoutToDigital);
                }
            }
        }

        this.setup = function () {
            removeLinks();
            populateLnsEndpointParameters();
        };
    };

    // Accessibility
    this.Accessibility = new function () {
        var validHtmlId = /^[a-zA-Z][\w:.-]*$/;

        function ariaHintText() {
            var divs = document.getElementsByTagName('div');
            var divsLength = divs.length;

            for (var i = 0; i < divsLength; i++) {
                if (Framework.Utility.hasClassName(divs[i], 'hint') && /\S/.test(divs[i].innerHTML)) {
                    var hint = divs[i];

                    if (!hint.id || !validHtmlId.test(hint.id)) {
                        hint.id = 'field-hint:' + i;
                    }

                    var field = hint.parentNode;

                    if (Framework.Utility.hasClassName(field, 'field')) {
                        var inputs = Framework.Utility.getChildrenByTagName(field, 'input');

                        if (inputs.length > 0) {
                            inputs[0].setAttribute('aria-describedby', hint.id);
                        }
                        else {
                            var selects = Framework.Utility.getChildrenByTagName(field, 'select');

                            if (selects.length > 0) {
                                selects[0].setAttribute('aria-describedby', hint.id);
                            }
                            else {
                                var textareas = Framework.Utility.getChildrenByTagName(field, 'textarea');

                                if (textareas.length > 0) {
                                    textareas[0].setAttribute('aria-describedby', hint.id);
                                }
                            }
                        }
                    }
                }
            }
        }

        this.inject = function () {
            ariaHintText();
        };
    };

    this.MDTPDeviceFingerPrinting = new function () {
        this.init = function () {
            Framework.Utility.includeScript('/js/device-profile/mdtpdf.min.js');
        };
    };
};

// Provide the HTML element with a "js" class name to indicate to CSS that JavaScript is available.
var htmlElement = document.getElementsByTagName('html');

if (htmlElement.length > 0) {
    htmlElement = htmlElement[0];
    Framework.Utility.addClassName(htmlElement, 'js');
}

if(typeof useGoogleAnalytics === "undefined" || useGoogleAnalytics) {
    (function (i, s, o, g, r, a, m) {
        i['GoogleAnalyticsObject'] = r;
        i[r] = i[r] || function () {
            (i[r].q = i[r].q || []).push(arguments)
        }, i[r].l = 1 * new Date();
        a = s.createElement(o),
            m = s.getElementsByTagName(o)[0];
        a.async = 1;
        a.src = g;
        m.parentNode.insertBefore(a, m)
    })(window, document, 'script', '//www.google-analytics.com/analytics.js', 'ga');
}
