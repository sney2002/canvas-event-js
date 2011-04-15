// Inspired by base2 and Prototype
(function(){
  var initializing = false;
  // The base Class implementation (does nothing)
  this.Class = function(){};
  // Create a new Class that inherits from this class
  Class.extend = function(prop) {
    var _super = this.prototype,
    	prototype,
    	name,
    	tmp,
    	ret;

    // Instantiate a base class (but only create the instance,
    // don't run the init constructor)
    initializing = true;
    prototype = new this();
    initializing = false;

    // Copy the properties over onto the new prototype
    for ( name in prop ) {
      // Check if we're overwriting an existing function
      prototype[name] = typeof prop[name] == "function" &&
        typeof _super[name] == "function" ?
        (function(name, fn){
         return function() {
           tmp = this._super;
           // Add a new ._super() method that is the same method
           // but on the super-class
           this._super = _super[name];
           // The method only need to be bound temporarily, so we
           // remove it when we're done executing
           ret = fn.apply(this, arguments);
           this._super = tmp;
           return ret;
         };
        })(name, prop[name]) :
        prop[name];
    }
    // The dummy class constructor
    // Modificado segun http://ejohn.org/blog/simple-class-instantiation/
    // Para instanciación sin usar el operador new
		function Class(args){
				if ( this instanceof arguments.callee ) {
					if ( !initializing && this.init )
						this.init.apply( this, args.callee ? args : arguments );
				} else
					return new arguments.callee( arguments );
			};

    // Populate our constructed prototype object
    Class.prototype = prototype;
    // Enforce the constructor to be what we expect
    Class.constructor = Class;
    // And make this class extendable
    Class.extend = arguments.callee;
    return Class;
 };
})();

