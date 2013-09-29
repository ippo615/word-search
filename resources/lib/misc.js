/* Copyright (c) 2013 Andrew Ippoliti http://github.com/ippo615
 * Licensed under the Apache 2 license */

// ------------------------------------------- [ Function: Get Url Parms  ] -
// Returns the parameters (stuff after the ?) in a url
// ex: http://www.example.com/index.html?this=is_resturned&so=is_this
// returns 'this=is_resturned&so=is_this'
function getUrlParmString() {
  // URL parameters begin after the '?' in the URL.
  var startLocation = window.location.href.indexOf('?');

  // We may not have any URL parameters.
  if (startLocation === -1) {
    return '';
  }

  // We do not care about the location part of the URL.
  var parmString = window.location.href.slice(startLocation + 1);

  // Some browsers put a '/' at the end of some urls
  parmString = parmString.replace(/\/$/, '');

  return parmString;
}
// Parses the URL for parameters and returns an array of key-value pairs
function parseUrlParmString(parmString){

  if( parmString === '' ){
    return null;
  }

  // Each key/value pair is separated by an '&'.
  var varStrings = parmString.split('&');

  var l = varStrings.length;
  var variables = {};
  for (var i = 0; i < l; i += 1) {
    // Key/value strings have the form: key=value
    var tmp = varStrings[i].split('=');
    // We need to unescape the strings because they be encoded as follows:
    // "hello world" -> hello+world
    // or certain charactes are encoded as their ascii value: %20 %da
    // We also convert the key to lower case so the program can always
    // access via the lower case key.
    variables[unescape(tmp[0]).toLowerCase()] = unescape(tmp[1]);
  }
  return variables;
}

// ------------------------------------ [ Module: jQuery.elementFromPoint ] -
// Enable jQuery to get elements by a point within them
(function ($) {
  var doCheck = true;
  var isRelative = true;

  $.elementFromPoint = function (x, y) {
    if (!document.elementFromPoint) {
      return null;
    }

    var $doc = $(document);
    var $window = $(window);
    if ( doCheck ) {
      var scrollTop = $doc.scrollTop();
      var scrollLeft = $doc.scrollLeft();
      if (scrollTop > 0) {
        isRelative = (document.elementFromPoint(0, scrollTop + $window.height() - 1) === null);
        doCheck = false;
      } else if (scrollLeft > 0) {
        isRelative = (document.elementFromPoint(scrollLeft + $window.width() - 1, 0) === null);
        doCheck = false;
      }
    }

    if (!isRelative) {
      x += $doc.scrollLeft();
      y += $doc.scrollTop();
    }

    return document.elementFromPoint(x, y);
  }

})(jQuery);

// ------------------------------------ [ Module: jQuery.changeStyleSheet ] -
// Changes the innerHTML of a style sheet (fixes IE<9 errors)
(function ($) {

   $.fn.styleSheet = function(cssCode){
     // note: `this` is actually a jQuery object NOT a dom node
     var ie;
     try {
       this.html(cssCode);
     }catch(ie){
       // Internet explorer < 9 does not let me set the innerHTML
       // of a style tag, so I need to do the following instead
       // (note: other browsers don't like this)
       this[0].styleSheet.cssText = cssCode;
     }

     return this;
   }
  
})(jQuery);

// -------------------------------------------- [ Module: Random Numbers  ] -
var RANDOM = (function () {
  var Seed = Math.floor(Math.random() * 4294967296);
  var Current = Seed;

  function setSeed(aSeed) {
    Seed = aSeed;
    Current = aSeed;
  }

  function getSeed() {
    return Seed;
  }

  function getCurrent() {
    return Current;
  }

  function betweenInt(aMin, aMax) {
    Current = (Current * 1664525 + 1013904223) % 4294967296;
    return aMin + Math.floor((Current / 4294967296) * aMax);
  }

  function betweenFloat(aMin, aMax) {
    Current = (Current * 1664525 + 1013904223) % 4294967296;
    return aMin + (Current / 4294967296) * aMax;
  }

  function random() {
    Current = ((Current * 1664525 + 1013904223) % 4294967296);
    return Current / 4294967296;
  }

  // Randomly orders the elements of arr (returns the new arrangement)
  function shuffle(arr) {
    var l = arr.length,
      i = l + 1,
      r1, r2, swap;
    while (i--) {
      r1 = Math.floor(l * RANDOM.random());
      r2 = Math.floor(l * RANDOM.random());
      swap = arr[r1];
      arr[r1] = arr[r2];
      arr[r2] = swap;
    }
    return arr;
  }

  // Returns a random element from arr
  function from(arr){
    return arr[betweenInt(0,arr.length)];
  }

  return {
    setSeed: setSeed,
    getSeed: getSeed,
    getCurrent: getCurrent,
    betweenInt: betweenInt,
    betweenFloat: betweenFloat,
    random: random,
    shuffle: shuffle,
    from: from
  };
})();

// ---------------------------------------------- [ Module: Data Storage  ] -
var DATA = (function ($self) {

    // Saves `value` to `key`, ex: save('tries',77);
    $self.save = function (key, value) {
        // Cookie Writing
        // document.cookie='KEY=VALUE; expires=DATE; path=/'
        var expire = (new Date("2099/12/31")).toUTCString();
        document.cookie = key + '=' + value + '; expires=' + expire + '; path=/';
        //console.info( key+'='+value+'; expires='+expire+'; path=/' ); // DEBUG

        // Local storage
        try {
            localStorage.setItem(key, value);
        } catch (e) {}
    };

    // `any` - any type - returns original string
    $self.any = function (value) {
        return value;
    };

    // `int10` - base 10 integer (ie 123)
    $self.int10 = function (value) {
        return parseInt(value, 10);
    };

    // `float` - floating precision number (ie 1.2e3)
    $self.float = function (value) {
        return parseFloat(value);
    };

    // Returns the value stored in `key` if key is not set it returns
    // the `valueDefault`
    $self.load = function (key, valueDefault) {
        return $self.loadValid(key, valueDefault, $self.any);
    };

    // Returns the value stored in `key` after it has been passed to
    // the `validate` function. Returns `valueDefault` if `key` hasn't
    // been set.
    // ex: var score = DATA.loadValid('score',2,DATA.int10);
    // ex: var name = DATA.loadValid('userName','John',DATA.any);
    $self.loadValid = function (key, valueDefault, validate) {
        // Cookie Reading
        // 'key1=value1; key2=value2' === document.cookie
        var allCookies = decodeURIComponent(document.cookie),
            searchKey = key + '=',
            keyIndex = allCookies.indexOf(searchKey),
            semicolonPosition = allCookies.indexOf(';', keyIndex),
            valueCookie = '',
            valueLocalStorage = '';
        if (keyIndex > -1) {
            if (semicolonPosition > 0) {
                valueCookie = allCookies.slice(keyIndex + searchKey.length, semicolonPosition);
            } else {
                valueCookie = allCookies.slice(keyIndex + searchKey.length);
            }
        }

        // Local Storage
        try {
            valueLocalStorage = localStorage.getItem(key);
        } catch (e) {}

        // Prefer local storage then cookie then default
        //console.info('Loading Key: '+ key ); // DEBUG
        if (valueLocalStorage !== null && valueLocalStorage !== '') {
            //console.info('Local Raw: '+ valueLocalStorage ); // DEBUG
            //console.info('Local Valid: '+ validate(valueLocalStorage) ); // DEBUG
            return validate(valueLocalStorage);
        }
        if (valueCookie !== '') {
            //console.info('Cookie Raw: '+ valueCookie ); // DEBUG
            //console.info('Cookie Valid: '+ validate(valueCookie) ); // DEBUG
            return validate(valueCookie);
        }
        //console.info('Default Raw: '+ validate(valueDefault) ); // DEBUG
        //console.info('Default Valid: '+ validate(valueDefault) ); // DEBUG
        return validate(valueDefault);
    };

    // Clears all of the key/value stores
    $self.clearAll = function () {
        document.cookie = "";
        try {
            localStorage.clear();
        } catch (e) {}
    };

    // Returns a string of all of the key value pairs
    // ex: DATA.dumpAll() === 'name:Andrew;score:55;'
    $self.dumpAll = function () {
        var output = '';
        output += 'Cookie:\n';
        output += document.cookie.split('; ').join(';\n') + '\n';
        try {
            var i = localStorage.length;
            output += 'Local Storage:\n';
            while (i--) {
                output += localStorage.key(i);
                output += ':';
                output += localStorage.getItem(localStorage.key(i));
                output += ';\n';
            }
        } catch (e) {}

        return output;
    };

    // Prompts the user to download it a file containing the saved data
    $self.download = function () {
        var savedData = 'Saved Data\n';
        savedData += 'From: ' + window.location.href + '\n';
        savedData += 'Date: ' + (new Date()).toUTCString() + '\n';
        savedData += $self.dumpAll();
        var uri = 'data:application/octet-stream,' + encodeURIComponent(savedData);
        //window.location.href = uri;
        window.open(uri);
    };

    return $self;
}({}));