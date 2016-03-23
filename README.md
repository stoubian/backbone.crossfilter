# Backbone.Crossfilter
_A Crossfilter minimalistic port to Backbone Framework._

With backbone.crossfilter you can easily access the powerfull filter functions of [Crossfilter](http://square.github.io/crossfilter/) within your [Backbone](http://backbonejs.org/) app.

You pass a Backbone.Collection to backbone.crossfilter and it gives you back a Backbone.Collection of criterias for each attribute you could filter and another Backbone.Collection for your results.

You just have to build your views under these Backbone.Collections and you're done !

##Installation
```npm install --save StephaneToubiana/backbone.crossfilter.git```

or
```bower install git://github.com/StephaneToubiana/backbone.crossfilter.git```

or
```git clone https://github.com/StephaneToubiana/backbone.crossfilter.git```

##Module system
It detects if you are using commonJS or AMD tools to set its dependencies.
If you don't have any of this tools, USE IT!
####CommonJS
```var BC = require('backbone.crossfilter');```
####AMD
in your config
```javascript
define([BackboneCrossfilter], function(BC){ 
	var myBCfilter = new BC();
	// ...
});
```
####Globals
declare your scripts in that order:
```HTML
<script src="/js/dependencies/jquery.js"></script>
<script src="/js/dependencies/underscore.js"></script>
<script src="/js/dependencies/backbone.js"></script>
<script src="/js/dependencies/crossfilter.js"></script>
<script src="/js/dependencies/backbone.crossfilter.js"></script>
```

## Instanciation
```javascript
var myBCfilter = new backbone.crossfilter({
	config: {
		attributes: [ "attribute1", "attribute2", "attribute3" ],
	}
});
```

Here you instantiate the filter with a ```config ``` object which has an array ```attributes``` with the name of your models' attributes you want to look at.

## Reference to the filter output
Then, you instantiate the filtered collection with the method ```myBCfilter.getFilterCollection()``` which returns a Backbone collection. 
note: At this time the ```filteredCollection``` has exactly the same content as the ```mybaseCollection```  I'm talking below.

Now you can use your ```filteredCollection``` like a classic Backbone.Collection.
For example, you can turn on the backbone comparator with one of your attributes and pass it to a view.

```javascript
var filteredCollection = myBCfilter.getFilterCollection();
filteredCollection.comparator = 'attribute3';
var myView = new View({collection: filteredCollection});
```

## Accessing criterias' collections
Now you have set your filter and have a reference to the filter output ```filteredCollection```, you have access to backbone collections of criterias with the method ```myBCfilter.access("attribute")```.
It gives you a collection of all the choices possible within the category you want to look at.
You will pass these collections to their views that you had already set up.

```javascript
var attribute1View 	= new CriteriaView({collection: myBCfilter.access("attribute1")}),
	attribute2View 	= new CriteriaView({collection: myBCfilter.access("attribute2")}),
	attribute3View 	= new CriteriaView({collection: myBCfilter.access("attribute3")});
```

## The Criteria model
The Criteria model _is built for you_ with this schema :

```javascript
var Criteria = Backbone.Model.extend({
	defaults: {
		checked: false,
		type: "attribute1",
		name: "choice1",
		number: "7"
	},
})
```
and it has a method ```myCriteria.prepaF()``` that you must call when you get a click event in your view (here a marionette view).
```javascript
myCriteriaView = Marionette.ItemView.extend({
	ui: { 'filter': 'input' },
	events: {
		'click @ui.filter': 'clicHandler',
	},
	clicHandler: function(){
		this.model.prepaF();
	},
});
```

## Unleash the power
If you have read this far and already tried to use this plugin, it has not worked !
The final method you must use to complete the task is ```myBCfilter.buildFilter(myCollection)``` to pass the collection you want to filter to your backbone.crossfilter instance. I do it in the fetch's success callback to be sure I have the entire collection in my filter.
```javascript
myBaseCollection.fetch({
	success: function(collection){
		myBCfilter.buildFilter(collection);
	},
});
```
Now you gonna kick this collection's ass and filter it up your desires.
If you keep your Backbone or Marionette views tight linked to your collections/models, whenever a criteria is clicked 
your views are rendered but maybe you want to update the data in your filtered collection manually.
This is possible with the method ```myBCfilter.updateFilter()```.

For convenience, you have access to the IDs of the filter output models in the base collection with the method ```myBCfilter.getIDs()```.
You can also retrieve the IDs of models that are _not_ at the output but in the base collection with the method ```myBCfilter.getInvIDs()```. 

### Enjoy ! \o/

##ToDo
* error management;
* complete code traduction;
* filter by single attribute with multiple values (tag system);
* unit tested;
* better licence reflexion.

#Contributions
Feel free to create pull requests and open issues, even for the smallest thing !
You are welcome.

#LICENCE
Apache v2.0
